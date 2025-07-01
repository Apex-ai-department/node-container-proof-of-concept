import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { s3Client } from "../config/s3.js";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

dotenv.config();

// Instances
const bucketName = process.env.S3_BUCKET_NAME;

if (!bucketName) {
  throw new Error("S3_BUCKET_NAME environment variable is required.");
}

const generateFileName = (originalname, bytes = 32) => {
  const extension = path.extname(originalname);
  const randomName = crypto.randomBytes(bytes).toString("hex");
  return `${randomName}${extension}`;
};

export async function handleUpload(req, res) {
    // Check if the API call is a POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if there's file upload
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded!",
      });
    }

    // Preprocessing w/ grayscale and binarization before sending to S3
    const MAX_WIDTH = 2000;
    const MAX_HEIGHT = 2000;
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();

    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
        image.resize({
            width: MAX_WIDTH,
            height: MAX_HEIGHT,
            fit: "inside",
            withoutEnlargement: true,
        });
    }

    const preprocessedImageBuffer = await image
        .grayscale()
        .threshold(128)
        .jpeg({ quality: 80 })
        .toBuffer();

    // Generate unique file name for 
    const fileName = generateFileName(req.file.originalname);
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: preprocessedImageBuffer,
      ContentType: "image/jpeg",
      ContentLength: preprocessedImageBuffer.length,
    };

    // Send the upload to S3
    await s3Client.send(new PutObjectCommand(params));

    // Save the image name to the database

    // Generate a Signed url
    const imageUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      }),
      { expiresIn: 3600 } // 60 seconds
    );

    // const uploadUrl = await getSignedUrl(
    //     s3Client,
    //     new PutObjectCommand({
    //         Bucket: bucketName,
    //         Key: s3Key,
    //         ContentType: file.type,
    //         ContentLength: file.size,
    //     }),
    //     { expiresIn: 900 }
    // )

    res.status(200).json({
      success: true,
      fileName: fileName,
      imageUrl: imageUrl,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);

    if (error.message === "File type not allowed") {
      return res.status(400).json({
        error: "Only image files are allowed",
      });
    }

    res.status(500).json({
      error: "Failed to upload file",
    });
  }
}

