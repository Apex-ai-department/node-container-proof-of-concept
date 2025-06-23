import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";

dotenv.config();
const PORT = process.env.PORT || 5001;

const app = express();
const server = createServer(app);

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
