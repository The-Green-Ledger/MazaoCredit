const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Missing Supabase environment variables. Using mock mode.');
}

const supabase = createClient(
  supabaseUrl || 'https://mock-url.supabase.co', 
  supabaseKey || 'mock-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Test connection
const testConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.log('🔶 Supabase: Running in mock mode (no credentials provided)');
      return;
    }
    
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('🔶 Continuing in mock mode...');
  }
};

module.exports = { supabase, testConnection };
