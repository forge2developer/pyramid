import dotenv from "dotenv";

// Load environment variables before other imports
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { testConnection } from "./config/database";

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors()
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to Phyramid API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

app.get("/sanity-check", (req: Request, res: Response) => {
  res.json({
    message: "I AM LIVE - NEW CODE IS RUNNING",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  // Test database connection
  await testConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
};

startServer();
