const config = require('./src/config');
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Connect to MongoDB
connectDB();

const server = app.listen(config.PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
