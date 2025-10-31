const express = require('express');
const AIModelIntegration = require('../services/AIModelIntegration');

const router = express.Router();

// Enhanced product analysis
router.post('/analyze-product', async (req, res) => {
  try {
    const { productData } = req.body;
    
    const analysis = await AIModelIntegration.analyzeProductQuality(productData);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'AI analysis failed',
      error: error.message
    });
  }
});

// Credit scoring endpoint
router.post('/credit-score', async (req, res) => {
  try {
    const { farmerData } = req.body;
    
    const creditPrediction = await AIModelIntegration.predictCreditScore(farmerData);

    res.json({
      success: true,
      data: creditPrediction
    });
  } catch (error) {
    console.error('Credit scoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Credit scoring failed',
      error: error.message
    });
  }
});

// Crop yield prediction
router.post('/predict-yield', async (req, res) => {
  try {
    const { cropData } = req.body;
    
    // Implement yield prediction
    const prediction = {
      predictedYield: Math.random() * 1000 + 500, // kg per hectare
      confidence: 0.85,
      recommendations: [
        'Optimize irrigation schedule',
        'Consider soil amendments',
        'Monitor pest levels'
      ]
    };

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Yield prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Yield prediction failed',
      error: error.message
    });
  }
});

module.exports = router;