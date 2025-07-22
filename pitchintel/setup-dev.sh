#!/bin/bash

echo "🚀 Setting up PitchIntel Development Environment"

# Check if .env exists, if not copy from .env.example
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key"
else
    echo "✅ .env file already exists"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎯 To run the application:"
echo "   Backend only:     npm run backend:dev"
echo "   Frontend only:    npm run dev"
echo "   Both together:    npm run dev:all"
echo ""
echo "📱 Frontend will be available at: http://localhost:5173"
echo "🔧 Backend API will be available at: http://localhost:3001/api"
echo "🏥 Backend health check: http://localhost:3001/health"
echo ""
echo "⚠️  Make sure to set your OPENAI_API_KEY in the .env file!"

