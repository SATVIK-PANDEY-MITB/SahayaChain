// CORS Configuration
const corsOptions = {
  // Allow requests from any origin in development
  // In production, restrict this to your actual domain
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : '*',
  
  // Allow common methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Allow common headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  
  // Allow cookies to be sent with requests (if using cookies for auth)
  credentials: true,
  
  // Cache preflight response for 1 hour (3600 seconds)
  maxAge: 3600
};

module.exports = corsOptions; 