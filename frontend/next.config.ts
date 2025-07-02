import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para output standalone (necessário para Docker)
  output: 'standalone',
  
  // Configurações de imagens
  images: {
    unoptimized: true
  },
  
  // Configurações de ambiente com valores padrão para build
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-api-production.up.railway.app/api',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build',
  },
  
  // Configurações de build
  serverExternalPackages: ['@supabase/supabase-js']
};

export default nextConfig;
