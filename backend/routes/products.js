const express = require('express');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('products')
      .select(`
        *,
        seller:users(name, profile, ratings)
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

    // Pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;

    const { data, error, count } = await query.range(from, to).order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users(name, profile, ratings)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const productData = req.body;

    // Basic validation
    if (!productData.name || !productData.price || !productData.seller_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, price, seller_id'
      });
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: productData.name,
        description: productData.description || 'No description provided',
        price: parseFloat(productData.price),
        original_price: parseFloat(productData.original_price) || parseFloat(productData.price),
        category: productData.category || 'other',
        images: productData.images || [],
        seller_id: productData.seller_id,
        quantity: parseFloat(productData.quantity) || 1,
        unit: productData.unit || 'piece',
        harvest_date: productData.harvest_date || new Date().toISOString(),
        expiry_date: productData.expiry_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: productData.location || {},
        ai_analysis: productData.ai_analysis || {}
      }])
      .select(`
        *,
        seller:users(name, profile, ratings)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

module.exports = router;