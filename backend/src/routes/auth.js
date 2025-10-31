const express = require('express');
const { supabase } = require('../config/supabase');

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

module.exports = router;
