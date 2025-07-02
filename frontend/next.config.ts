import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para output standalone (necessário para Docker)
  output: 'standalone',
  
  // Configurações de imagens
  images: {
    unoptimized: true
  },
  
  // Configurações de ambiente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://al-chatbot-backend-new-production.up.railway.app/api',
  },
  
  // Configurações de build
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  }
};

export default nextConfig;
