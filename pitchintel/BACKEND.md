# PitchIntel Backend

This document explains how to run the PitchIntel backend server.

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_key_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Backend

#### Option A: Backend Only

```bash
npm run backend:dev
```

#### Option B: Frontend + Backend Together

```bash
npm run dev:all
```

#### Option C: Use the Setup Script

```bash
./setup-dev.sh
npm run dev:all
```

## 📡 API Endpoints

Once running on `http://localhost:3001`:

### Health Check

- `GET /health` - Server health status

### Analysis Endpoints

- `POST /api/analyze-slides` - Analyze pitch deck slides
- `POST /api/chat` - Chat with VC analyzer

### Usage & Stats

- `GET /api/usage-stats` - OpenAI usage statistics
- `GET /api/conversation-stats` - Conversation statistics

### Cache Management

- `POST /api/clear-cache` - Clear response cache
- `POST /api/clear-conversations` - Clear all conversations

### Conversation Management

- `DELETE /api/conversations/:id` - Delete specific conversation

## 🔧 Environment Variables

Required:

- `OPENAI_API_KEY` - Your OpenAI API key

Optional:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)

## 🛠 Development

### File Structure

```
src/backend/
├── server.ts              # Main server entry point
├── apiRouter.ts           # API route handlers
├── openaiClient.ts        # OpenAI API client with optimizations
├── tokenTracker.ts        # Token usage tracking
├── responseCache.ts       # Response caching
├── conversationMemory.ts  # Conversation management
├── chatAnalyzer.ts        # Chat analysis logic
├── slideAnalyzer.ts       # Slide analysis logic
├── answerScorer.ts        # Answer scoring
├── questionGenerator.ts   # Question generation
└── gptAnalysis.ts         # General GPT analysis
```

### Cost Optimizations

The backend includes several cost optimization features:

- **GPT-4o Mini**: 83% cost savings vs GPT-4
- **Response Caching**: 30-minute cache with smart cache keys
- **Daily Limits**: $50 daily cost limit, 10M token limit
- **Token Estimation**: Prevents oversized requests
- **Optimized Prompts**: Reduced token usage

### Scripts

- `npm run backend:dev` - Run backend in development mode with hot reload
- `npm run backend:build` - Build backend for production
- `npm run backend:start` - Run built backend
- `npm run dev:all` - Run both frontend and backend concurrently

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Change PORT in .env file or kill existing process
   lsof -ti:3001 | xargs kill
   ```

2. **OpenAI API errors**

   - Check your API key in `.env`
   - Verify API key has credits
   - Check daily limits in usage stats

3. **CORS errors**

   - Ensure `FRONTEND_URL` matches your frontend URL
   - Check that both frontend and backend are running

4. **Module resolution errors**
   - Ensure all dependencies are installed: `npm install`
   - Clear node_modules and reinstall if needed

### Logs

Backend logs include:

- Request/response details
- Token usage tracking
- Cost calculations
- Error details with stack traces

## 📊 Monitoring

Access these URLs while the backend is running:

- Health: http://localhost:3001/health
- Usage Stats: http://localhost:3001/api/usage-stats

The frontend's Usage Stats component provides a dashboard for:

- Real-time cost tracking
- Cache hit rates
- Daily usage limits
- Optimization tips
