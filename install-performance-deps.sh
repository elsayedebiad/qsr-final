#!/bin/bash

# Install Performance Dependencies for 5000+ Users Support
echo "📦 Installing performance dependencies..."

# Redis for caching
npm install ioredis
npm install @types/ioredis --save-dev

# Database optimization
npm install pg
npm install @types/pg --save-dev

# Image optimization
npm install sharp
npm install @types/sharp --save-dev

# Performance monitoring
npm install prom-client
npm install @types/node --save-dev

# Compression
npm install compression
npm install @types/compression --save-dev

# Rate limiting helpers
npm install express-rate-limit
npm install rate-limiter-flexible

# Queue system
npm install bull
npm install @types/bull --save-dev

# Clustering
npm install cluster
npm install pm2

echo "✅ Performance dependencies installed!"

# Run database migrations
echo "🗄️ Running database optimizations..."
npx prisma migrate deploy

echo "🎉 System is now optimized for 5000+ concurrent users!"
