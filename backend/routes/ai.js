const express = require('express');
const router = express.Router();

// Mock AI service for demo
class MockAIService {
  async analyzeProduct(imageUrl, productData) {
    return {
      qualityScore: Math.floor(Math.random() * 3) + 7, // 7-10
      freshnessScore: Math.floor(Math.random() * 3) + 7,
      priceRecommendation: productData.price * (0.8 + Math.random() * 0.4), // 80-120% of original
      demandPrediction: Math.floor(Math.random() * 50) + 50, // 50-100
      tags: ['fresh', 'organic', 'premium', 'local'].slice(0, Math.floor(Math.random() * 3) + 1),
      descriptionSuggestion: `Fresh ${productData.category} harvested recently. Perfect for health-conscious consumers looking for quality produce.`
    };
  }

  async generateDescription(productData) {
    return `Fresh, high-quality ${productData.category} harvested at peak ripeness. ${productData.name} is perfect for your culinary needs and comes from sustainable farming practices.`;
  }
}

const aiService = new MockAIService();

// Analyze product
router.post('/analyze-product', async (req, res) => {
  try {
    const { imageUrl, productData } = req.body;

    if (!productData) {
      return res.status(400).json({
        success: false,
        message: 'Product data is required'
      });
    }

    const analysis = await aiService.analyzeProduct(imageUrl, productData);

    res.json({
      success: true,
      data: analysis,
      message: 'Product analysis completed'
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during AI analysis',
      error: error.message
    });
  }
});

// Generate product description
router.post('/generate-description', async (req, res) => {
  try {
    const { productData } = req.body;

    if (!productData || !productData.name || !productData.category) {
      return res.status(400).json({
        success: false,
        message: 'Product name and category are required'
      });
    }

    const description = await aiService.generateDescription(productData);

    res.json({
      success: true,
      data: { description },
      message: 'Description generated successfully'
    });
  } catch (error) {
    console.error('Description generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating description',
      error: error.message
    });
  }
});

module.exports = router;