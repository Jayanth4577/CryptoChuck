import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import henRoutes from './routes/henRoutes.js';
import breedingRoutes from './routes/breedingRoutes.js';
import battleRoutes from './routes/battleRoutes.js';
import racingRoutes from './routes/racingRoutes.js';
import bettingRoutes from './routes/bettingRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CryptoChuck Backend API',
    version: '1.0.0',
    endpoints: {
      hens: '/api/hens',
      breeding: '/api/breeding',
      battles: '/api/battles',
      racing: '/api/racing',
      betting: '/api/betting',
      registration: '/api/registration',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/hens', henRoutes);
app.use('/api/breeding', breedingRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/racing', racingRoutes);
app.use('/api/betting', bettingRoutes);
app.use('/api/registration', registrationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 CryptoChuck Backend running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel serverless
export default app;
