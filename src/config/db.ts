import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not defined");
  }

  try {
    // Explicitly set database name to "vote-app" instead of default "test"
    const connection = await mongoose.connect(mongoUri, {
      dbName: "vote-app",
    });
    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
    console.log(`📊 Using database: ${connection.connection.db?.databaseName || "vote-app"}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;

