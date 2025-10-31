const express = require('express');
const router = express.Router();

// Mock financial endpoints
router.get('/loan-eligibility/:userId', async (req, res) => {
  try {
    res.json({
      success: true,
      data: { eligible: true }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Financial check failed',
      error: error.message
    });
  }
});

module.exports = router;
