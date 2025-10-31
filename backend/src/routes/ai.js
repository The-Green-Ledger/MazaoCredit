const express = require('express');
const AIModelIntegration = require('../services/AIModelIntegration');
const router = express.Router();

// Product analysis (placeholder)
router.post('/analyze-product', async (req, res) => {
  try {
    const { productData } = req.body;
    const analysis = await AIModelIntegration.analyzeProductQuality(productData);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AI analysis failed',
      error: error.message
    });
  }
});

// Credit scoring endpoint (no persistence here)
router.post('/credit-score', async (req, res) => {
  try {
    const { farmerData, userId } = req.body;
    const creditAnalysis = await AIModelIntegration.predictCreditScore(farmerData, userId);
    res.json({ success: true, data: { creditAnalysis } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Credit scoring failed',
      error: error.message
    });
  }
});

module.exports = router;
