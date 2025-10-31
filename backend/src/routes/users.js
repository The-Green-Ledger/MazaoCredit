const express = require('express');
const { supabase } = require('../config/supabase');
const AIModelIntegration = require('../services/AIModelIntegration');

const router = express.Router();

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let userRow = null;

    // Try Supabase first if configured
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        userRow = data;
      }
    } catch (e) {
      // fall through to in-memory
    }

    // Fallback: in-memory profile
    if (!userRow) {
      const memProfile = AIModelIntegration.getProfile(id);
      if (!memProfile) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      userRow = { id, profile: memProfile };
    }

    // Scrub password if present
    const { password, ...userWithoutPassword } = userRow;

    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

module.exports = router;
