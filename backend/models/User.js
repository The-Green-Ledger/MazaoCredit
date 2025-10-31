const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role || 'buyer',
            profile: userData.profile || {},
            preferences: userData.preferences || {}
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update user
  static async update(id, updateData) {
    try {
      // Remove password from update data if present
      const { password, ...safeUpdateData } = updateData;
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...safeUpdateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Verify password
  static async verifyPassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Get user stats
  static async getUserStats(userId) {
    try {
      // Get products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Get orders count
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', userId);

      if (ordersError) throw ordersError;

      return {
        success: true,
        data: {
          productsCount: productsCount || 0,
          ordersCount: ordersCount || 0
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = User;