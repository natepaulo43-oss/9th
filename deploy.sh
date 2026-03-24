#!/bin/bash

# 9thform Production Deployment Script
# This script deploys both backend and frontend to production

echo "🚀 Starting 9thform Production Deployment..."
echo ""

# Step 1: Deploy Backend to Firebase Functions
echo "📦 Step 1: Deploying Backend to Firebase Functions..."
cd backend
firebase deploy --only functions
if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed!"
    exit 1
fi
echo "✅ Backend deployed successfully!"
echo ""

# Step 2: Build Frontend
echo "🏗️  Step 2: Building Frontend..."
cd ../frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
echo "✅ Frontend built successfully!"
echo ""

# Step 3: Deploy Frontend to Netlify
echo "🌐 Step 3: Deploying Frontend to Netlify..."
netlify deploy --prod --dir=build
if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed!"
    exit 1
fi
echo "✅ Frontend deployed successfully!"
echo ""

echo "🎉 Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Configure Stripe webhook with your production backend URL"
echo "2. Test the order flow on your live site"
echo "3. Visit /admin to verify the dashboard works"
echo ""
