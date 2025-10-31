const express = require('express');
const { supabase } = require('../config/supabase');
const AICreditScoring = require('../services/AICreditScoring');
const AIModelIntegration = require('../services/AIModelIntegration');
const { runPythonCreditPredictor } = require('../services/PythonCreditScoring');

const router = express.Router();

// Basic auth route for testing
router.post('/register', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Auth endpoint working'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Auth failed',
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
    const analysis = AIModelIntegration.getCreditAnalysis(userId);
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
