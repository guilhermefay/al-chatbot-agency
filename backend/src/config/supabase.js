const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://temp-placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'temp-placeholder-key';

// Log warning if using default values
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn('⚠️  AVISO: Usando configurações temporárias do Supabase. Configure as variáveis de ambiente reais no Railway.');
  console.warn('⚠️  SUPABASE_URL e SUPABASE_SERVICE_KEY precisam ser configuradas.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase };