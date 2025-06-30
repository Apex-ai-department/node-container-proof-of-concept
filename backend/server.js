import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { specs, swaggerUi } from "./swagger.js";
import { redis } from "./config/redis.js";
import uploadRoutes from "./routes/upload.js";
import invoiceRoutes from "./routes/invoices.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);

// Middleware
app.use(cors()); // Enable cross-origin resource sharing
app.use(express.json()); // Automatically parse incoming JSON request bodies
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs)); // Set up api endpoint for swagger ui

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/invoices", invoiceRoutes);

/**
 * @swagger
 * /:
 *  get:
 *    summary: Access home page
 *    description: Returns a simple message indicating the backend is ready
 *    responses:
 *      200:
 *        descrition: Backend status message
 *        content:
 *          text/plain:
 *            schema:
 *              type: string
 */
app.get("/", (req, res) => {
  res.send("Backend is ready.");
});

// Starting the backend server
const startServer = async () => {
  // Test redis connection
  try {
    await redis.set("connection_test", "Redis connection successful!");
    const testValue = await redis.get("connection_test");
    console.log(testValue);
  } catch (error) {
    console.error("Redis connection failed");
  }

  server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
};
startServer();
