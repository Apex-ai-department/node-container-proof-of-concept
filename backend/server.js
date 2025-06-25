import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
// swagger setup
// http://<app_host>:<app_port>/api-docs
const swaggerOptions = {
  swaggerDefinition: {
    myapi: '3.0.0',
    info: {
      title: 'API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));



// Sample route
app.get('/api/hello', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


// Middleware
app.use(cors()); // Enable cross-origin resource sharing
app.use(express.json()); // Automatically parse incoming JSON request bodies

app.get("/", (req, res) => {
  res.send("Backend is ready.");
});

// Starting the backend server
// const startServer = async () => {
//   server.listen(PORT, () => {
//     console.log(`Server started at http://localhost:${PORT}`);
//   });
// };
// startServer();
