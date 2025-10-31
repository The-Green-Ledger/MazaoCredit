// Authentication and AI-credit related routes
const express = require('express');
const { supabase } = require('../config/supabase');
const AICreditScoring = require('../services/AICreditScoring');
const AIModelIntegration = require('../services/AIModelIntegration');
const { runPythonCreditPredictor } = require('../services/PythonCreditScoring');

const router = express.Router();

// Create or upsert a lightweight profile record for any role.
// Expects a Supabase Auth userId from the client; attaches profile JSON for persistence.
router.post('/register', async (req, res) => {
  try {
    const payload = req.body || {};
    const userId = payload.userId || payload.id || payload.supabaseUserId || payload.authUserId;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId in request body' });

    const profile = {
      name: payload.name,
      email: payload.email,
      role: payload.role,
      gender: payload.gender,
      farmData: payload.farmData || {},
      financialData: payload.financialData || {},
      locationData: payload.locationData || {},
      createdAt: new Date().toISOString()
    };

    // Run credit analysis from registration data (Python preferred)
    // This allows instant scoring post-registration for farmers (and optionally any role)
    let creditAnalysis;
    try {
      const pyResult = await runPythonCreditPredictor({
        farmData: profile.farmData,
        locationData: profile.locationData,
        mpesaData: profile.mpesaData,
        financialData: profile.financialData
      });
      if (pyResult && pyResult.success && pyResult.data && pyResult.data.creditAnalysis) {
        creditAnalysis = pyResult.data.creditAnalysis;
      }
    } catch (e) {
      console.warn('Python predictor failed during register, using JS:', e.message);
    }
    if (!creditAnalysis) {
      creditAnalysis = await AICreditScoring.analyzeFarmerCredit(profile);
    }

    // Attach analysis to profile
    const augmentedProfile = {
      ...profile,
      creditScore: creditAnalysis?.creditScore,
      creditAnalysis,
      lastCreditUpdate: new Date().toISOString(),
    };

    // Store in-memory for demo/mock so that the service works without DB
    AIModelIntegration.saveProfile(userId, augmentedProfile);
    if (creditAnalysis) {
      AIModelIntegration.setCreditAnalysis(userId, creditAnalysis);
    }

    // Try to persist to Supabase if configured (service role key required)
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        await supabase.from('users').upsert({ id: userId, profile: augmentedProfile }, { onConflict: 'id' });
      }
    } catch (e) {
      // ignore if persistence is unavailable
    }

    res.json({ success: true, data: { userId, profile: augmentedProfile, creditAnalysis } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Register failed',
      error: error.message
    });
  }
});

// Update farmer profile (mock-friendly) — merges arbitrary profile fields.
// Accepts top-level gender and nested farm/financial/location data.
router.put('/profile/farmer', async (req, res) => {
  try {
    const { userId, ...profile } = req.body;

    // If supabase is configured, attempt to persist
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        await supabase
          .from('users')
          .update({ profile })
          .eq('id', userId);
      }
    } catch (e) {
      // ignore persistence errors in demo
      console.warn('Profile persistence skipped (demo/mock mode)');
    }

    // Always store in memory for demo continuity
    AIModelIntegration.saveProfile(userId, profile);

    res.json({ success: true, data: { userId, profile } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: error.message
    });
  }
});

// Create or refresh credit analysis for a user.
// If body is empty, derives inputs from persisted profile before scoring.
router.post('/credit-analysis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let farmerData = req.body || {};

    // If no body provided, derive from persisted profile
    if (!farmerData || Object.keys(farmerData).length === 0) {
      try {
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
          const { data: user } = await supabase
            .from('users')
            .select('profile')
            .eq('id', userId)
            .single();
          const p = user?.profile || AIModelIntegration.getProfile(userId) || {};
          farmerData = {
            farmData: p.farmData || {},
            financialData: p.financialData || {},
            locationData: p.locationData || {},
            productionData: p.productionData || {},
            historicalData: p.historicalData || {},
          };
        }
      } catch {}
    }

    let creditAnalysis;
    // Prefer Python model artifacts if available; fallback to JS+OpenAI
    try {
      const pyResult = await runPythonCreditPredictor({ 
        farmData: farmerData.farmData, 
        locationData: farmerData.locationData, 
        mpesaData: farmerData.mpesaData,
        financialData: farmerData.financialData
      });
      if (pyResult && pyResult.success && pyResult.data && pyResult.data.creditAnalysis) {
        creditAnalysis = pyResult.data.creditAnalysis;
      }
    } catch (e) {
      console.warn('Python predictor failed, falling back to JS:', e.message);
    }

    if (!creditAnalysis) {
      creditAnalysis = await AICreditScoring.analyzeFarmerCredit(farmerData);
    }

    // Log score to server terminal for visibility during processing
    try {
      console.log(`[AI CREDIT] user=${userId} score=${creditAnalysis?.creditScore} rate=${creditAnalysis?.interestRate} loan=${creditAnalysis?.recommendedLoanAmount}`);
    } catch {}

    // Persist to supabase if available and hydrate in-memory cache
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        await supabase
          .from('users')
          .update({
            profile: {
              ...(AIModelIntegration.getProfile(userId) || {}),
              creditScore: creditAnalysis.creditScore,
              creditAnalysis,
              lastCreditUpdate: new Date().toISOString(),
            }
          })
          .eq('id', userId);
      }
    } catch (e) {
      console.warn('Credit analysis persistence skipped (demo/mock mode)');
    }

    // In-memory store for demo (store the computed analysis directly)
    AIModelIntegration.setCreditAnalysis(userId, creditAnalysis);

    res.json({
      success: true,
      data: { userId, creditAnalysis }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Credit analysis failed',
      error: error.message
    });
  }
});

// Get latest credit analysis for a user.
// Order of resolution: in-memory cache → Supabase profile → compute from profile
router.get('/credit-analysis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // 1) Try in-memory cache first for speed
    let analysis = AIModelIntegration.getCreditAnalysis(userId);

    // 2) If not found, try to load from Supabase profile and hydrate cache
    if (!analysis) {
      try {
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
          const { data: user, error } = await supabase
            .from('users')
            .select('profile')
            .eq('id', userId)
            .single();
          if (!error && user?.profile?.creditAnalysis) {
            analysis = user.profile.creditAnalysis;
            AIModelIntegration.setCreditAnalysis(userId, analysis);
          }
        }
      } catch (e) {
        // ignore persistence errors to keep endpoint resilient
      }
    }

  // 3) If still not found, compute from stored profile and persist
  if (!analysis) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('profile')
        .eq('id', userId)
        .single();
      const p = user?.profile || AIModelIntegration.getProfile(userId) || {};
      const farmerData = {
        farmData: p.farmData || {},
        financialData: p.financialData || {},
        locationData: p.locationData || {},
        productionData: p.productionData || {},
        historicalData: p.historicalData || {},
      };

      try {
        const pyResult = await runPythonCreditPredictor({
          farmData: farmerData.farmData,
          locationData: farmerData.locationData,
          mpesaData: farmerData.mpesaData,
          financialData: farmerData.financialData
        });
        if (pyResult?.success && pyResult.data?.creditAnalysis) {
          analysis = pyResult.data.creditAnalysis;
        }
      } catch {}
      if (!analysis) {
        analysis = await AICreditScoring.analyzeFarmerCredit(farmerData);
      }

      if (analysis) {
        AIModelIntegration.setCreditAnalysis(userId, analysis);
        try {
          if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
            await supabase
              .from('users')
              .update({
                profile: {
                  ...p,
                  creditScore: analysis.creditScore,
                  creditAnalysis: analysis,
                  lastCreditUpdate: new Date().toISOString(),
                }
              })
              .eq('id', userId);
          }
        } catch {}
      }
    } catch {}
  }

  if (!analysis) {
    return res.status(404).json({ success: false, message: 'No credit analysis found' });
  }

    res.json({ success: true, data: { userId, creditAnalysis: analysis } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit analysis',
      error: error.message
    });
  }
});

module.exports = router;
