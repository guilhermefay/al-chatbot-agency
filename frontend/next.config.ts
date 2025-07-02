import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para output standalone (necessário para Docker)
  output: 'standalone',
  
  // Configurações de imagens
  images: {
    unoptimized: true
  },
  
  // Configurações de ambiente - Railway deve fornecer as variáveis
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-api-production-a3d3.up.railway.app/api',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zogacwdhspzpqqfmakcf.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZ2Fjd2Roc3B6cHFxZm1ha2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MDY4ODcsImV4cCI6MjA2Njk4Mjg4N30.wCd1j9w2n2XL-6W2LRgvXIrDYqmSATTciHhTJ0on7gA',
  },
  
  // Configurações de build
  serverExternalPackages: ['@supabase/supabase-js']
};

export default nextConfig;
