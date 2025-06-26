import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
<<<<<<< Updated upstream
=======
import { specs, swaggerUi } from "./config/swagger.js";
import { redis } from "./config/redis.js";
// routes
import uploadRoutes from "./routes/upload.js";
>>>>>>> Stashed changes

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
// Middleware
app.use(cors()); // Enable cross-origin resource sharing
app.use(express.json()); // Automatically parse incoming JSON request bodies

<<<<<<< Updated upstream
=======

// -------------------------------------------------API-----------------------------------------------------------------------
// Routes
app.use("/api/upload", uploadRoutes); 


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
>>>>>>> Stashed changes
app.get("/", (req, res) => {
  res.send("Backend is ready.");
});

// Starting the backend server
const startServer = async () => {
<<<<<<< Updated upstream
=======
  // Test redis connection
  try {
    await redis.set('connection_test', 'Redis connection successful!');
    const testValue = await redis.get('connection_test');
    console.log(testValue);
  } catch (error) {
    console.error('Redis connection failed');
  }

>>>>>>> Stashed changes
  server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
};
startServer();
