import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { specs, swaggerUi } from "./swagger.js";
import { Redis } from "@upstash/redis";
//import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);

// AWS S3 setup
// const bucketName = process.env.BUCKET_NAME
// const bucketRegion = process.env.BUCKET_REGION
// const accessKey = process.env.ACCESS_KEY
// const secretAccessKey = process.env.SECRET_ACCESS_KEY

// const s3 = new S3Client( {
//     credentials: {
//         accessKeyId: accessKey,
//         secretAccessKey: secretAccessKey,
//     },
//     region: bucketRegion
// })

// Redis connection setup
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Middleware
app.use(cors()); // Enable cross-origin resource sharing
app.use(express.json()); // Automatically parse incoming JSON request bodies
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs)); // Set up api endpoint for swagger ui

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

// app.get("/api/posts", upload.single('image'), async(req, res) => {
//     console.log("req.body", req.body)
//     console.log("req.file", req.file)

//     req.file.buffer
//     const params = {
//         Bucket: bucketName,
//         Key: req.file.originalname,
//         Body: req.file.buffer,
//         ContentType: req.file.mimetype,
//     }
//     const command = new PutObjectCommand(params)
    
//     await s3.send(command)

//     res.send({})
// })


// Starting the backend server
const startServer = async () => {
  // Test redis connection
  try {
    await redis.set('connection_test', 'Redis connection successful!');
    const testValue = await redis.get('connection_test');
    console.log(testValue);
  } catch (error) {
    console.error('Redis connection failed');
  }
  
  server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
};
startServer();
