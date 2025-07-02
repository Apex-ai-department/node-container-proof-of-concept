import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { specs, swaggerUi } from "./swagger.js";
import { redis } from "./config/redis.js";
import { pool } from "./config/postgres.js";
import uploadRoutes from "./routes/upload.js";
import invoiceRoutes from "./routes/invoices.js";
import resultsRoutes from "./routes/db.js";

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
app.use("/api/db", resultsRoutes);
//app.use("/api/ai", aiResultsRoutes);

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

  // Test database connection
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("Postgre Database connection successful!", result.rows[0]);
    client.release();
  } catch (error) {
    console.error("Postgre Database connection failed:", error.message);
    console.log(
      "Note: Make sure Docker is running and PostgreSQL container is started"
    );
  }

  server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
};
startServer();
