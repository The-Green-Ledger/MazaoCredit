const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const AICreditScoring = require('../services/AICreditScoring');

const router = express.Router();

// Enhanced registration with AI data collection
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, farmData, financialData, locationData } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare AI analysis data
    const aiAnalysisData = {
      farmData: farmData || {},
      financialData: financialData || {},
      locationData: locationData || {},
      registrationDate: new Date().toISOString()
    };

    // Generate AI credit score for farmers
    let creditAnalysis = {};
    if (role === 'farmer' && farmData) {
      creditAnalysis = await AICreditScoring.analyzeFarmerCredit(aiAnalysisData);
    }

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        role: role || 'buyer',
        profile: {
          ...farmData,
          ...locationData,
          creditScore: creditAnalysis.creditScore || 0,
          creditAnalysis: creditAnalysis,
          financialReadiness: financialData?.financialReadiness || 0
        },
        preferences: {}
      }])
      .select()
      .single();

    if (error) throw error;

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        creditAnalysis: role === 'farmer' ? creditAnalysis : null
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration',
      error: error.message
    });
  }
});

// Enhanced login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// Update farmer profile with additional data for AI analysis
router.put('/profile/farmer', async (req, res) => {
  try {
    const { userId, farmData, financialData, productionData } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('profile')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Prepare data for AI credit analysis
    const analysisData = {
      farmData: farmData || currentUser.profile?.farmData || {},
      financialData: financialData || currentUser.profile?.financialData || {},
      productionData: productionData || {},
      locationData: currentUser.profile?.locationData || {}
    };

    // Run AI credit analysis
    const creditAnalysis = await AICreditScoring.analyzeFarmerCredit(analysisData);

    // Update user profile with new data and AI analysis
    const updatedProfile = {
      ...currentUser.profile,
      ...farmData,
      ...financialData,
      ...productionData,
      creditScore: creditAnalysis.creditScore,
      creditAnalysis: creditAnalysis,
      lastCreditUpdate: new Date().toISOString(),
      financialReadiness: creditAnalysis.financialReadiness
    };

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        profile: updatedProfile,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        creditAnalysis
      },
      message: 'Farmer profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating farmer profile',
      error: error.message
    });
  }
});

// Get credit analysis for a farmer
router.get('/credit-analysis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('profile, role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'farmer') {
      return res.status(400).json({
        success: false,
        message: 'Credit analysis is only available for farmers'
      });
    }

    // Re-run AI analysis with current data
    const analysisData = {
      farmData: user.profile?.farmData || {},
      financialData: user.profile?.financialData || {},
      productionData: user.profile?.productionData || {},
      locationData: user.profile?.locationData || {},
      historicalData: user.profile?.historicalData || {}
    };

    const creditAnalysis = await AICreditScoring.analyzeFarmerCredit(analysisData);

    res.json({
      success: true,
      data: {
        creditAnalysis,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Credit analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating credit analysis',
      error: error.message
    });
  }
});

module.exports = router;