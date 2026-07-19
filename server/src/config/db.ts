import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    // If running in CI/Sandbox without real MongoDB, bypass for health check
    if (process.env.NODE_ENV === 'test' || process.env.SKIP_MONGO === 'true') {
      console.log('Skipping MongoDB connection for test environment.');
      return;
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
