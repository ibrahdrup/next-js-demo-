import mongoose, { type Connection, type ConnectOptions } from "mongoose";

/**
 * Cached Mongoose connection state.
 * - `conn`: the active connection (once established).
 * - `promise`: an in-flight connection attempt (while connecting).
 */
type MongooseCache = {
  conn: Connection | null;
  promise: Promise<Connection> | null;
};

// Augment the Node.js global type to include our custom cache.
// This allows the connection to be reused across hot reloads in development.
declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable (e.g. in .env.local).",
  );
}

// Initialize or reuse the cached connection object on `global`.
const cached: MongooseCache = global._mongoose ?? {
  conn: null,
  promise: null,
};

if (!global._mongoose) {
  global._mongoose = cached;
}

/**
 * Establishes (or reuses) a Mongoose connection to MongoDB.
 *
 * The connection is cached on the global object to:
 * - Avoid creating multiple connections in development (due to hot reloading).
 * - Reuse the same connection in serverless/serverful environments when possible.
 */
export async function connectDB(): Promise<Connection> {
  // If we already have an active connection, return it immediately.
  if (cached.conn) {
    return cached.conn;
  }

  // If we're not already connecting, start a new connection attempt.
  if (!cached.promise) {
    const options: ConnectOptions = {
      bufferCommands: false, // Let the app handle connection errors explicitly instead of buffering.
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => mongooseInstance.connection);
  }

  try {
    // Await the shared connection promise and store the result.
    cached.conn = await cached.promise;
  } catch (error) {
    // If connection failed, reset the promise so future calls can retry.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
