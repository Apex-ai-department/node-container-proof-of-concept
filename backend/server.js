import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { specs, swaggerUi } from './swagger.js';

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);

// Middleware
app.use(cors()); // Enable cross-origin resource sharing
app.use(express.json()); // Automatically parse incoming JSON request bodies
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));  // Set up api endpoint for swagger ui


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
  server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
};
startServer();
