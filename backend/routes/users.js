const express = require('express');
const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = data;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const userData = req.body;

    // Basic validation
    if (!userData.email || !userData.password || !userData.name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, name'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'buyer',
        profile: userData.profile || {},
        preferences: userData.preferences || {}
      }])
      .select()
      .single();

    if (error) throw error;

    // Remove password from response
    const { password, ...userWithoutPassword } = data;

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow password updates via this route
    if (updateData.password) {
      delete updateData.password;
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Remove password from response
    const { password, ...userWithoutPassword } = data;

    res.json({
      success: true,
      data: userWithoutPassword,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

module.exports = router;