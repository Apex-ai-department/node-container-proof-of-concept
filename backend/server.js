import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
// swagger setup
// http://<app_host>:<app_port>/api-docs
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(cors()); // Enable cross-origin resource sharing
app.use(express.json()); // Automatically parse incoming JSON request bodies

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
