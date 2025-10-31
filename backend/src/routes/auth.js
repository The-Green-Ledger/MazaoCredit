const express = require('express');
const { supabase } = require('../config/supabase');
const AICreditScoring = require('../services/AICreditScoring');
const AIModelIntegration = require('../services/AIModelIntegration');
const { runPythonCreditPredictor } = require('../services/PythonCreditScoring');

const router = express.Router();

// Create a simple user profile record (paired with Supabase Auth user on frontend)
router.post('/register', async (req, res) => {
  try {
    const payload = req.body || {};
    const userId = payload.userId || payload.id || payload.supabaseUserId || payload.authUserId;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId in request body' });

    const profile = {
      name: payload.name,
      email: payload.email,
      role: payload.role,
      farmData: payload.farmData || {},
      financialData: payload.financialData || {},
      locationData: payload.locationData || {},
      createdAt: new Date().toISOString()
    };

    // Store in-memory for demo/mock
    AIModelIntegration.saveProfile(userId, profile);

    // Try to persist to Supabase if configured
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        await supabase.from('users').upsert({ id: userId, profile }, { onConflict: 'id' });
      }
    } catch (e) {
      // ignore if persistence is unavailable
    }

    res.json({ success: true, data: { userId, profile } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Register failed',
      error: error.message
    });
  }
});

// Update farmer profile (mock-friendly)
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

// Create or refresh credit analysis for a user
router.post('/credit-analysis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const farmerData = req.body;

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

    // Persist to supabase if available
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

// Get latest credit analysis for a user
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
