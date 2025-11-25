import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Environment variables accessible in the browser
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  },
  
  // Image optimization configuration
  images: {
    unoptimized: true, // For static export compatibility
  },
};

export default nextConfig;
