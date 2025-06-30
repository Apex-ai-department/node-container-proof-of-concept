import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { s3Client } from "../config/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { generateUploadUrls } from "./generateUploadUrls.js";
dotenv.config();

const bucketName = process.env.S3_BUCKET_NAME;

if (!bucketName) {
  throw new Error("S3_BUCKET_NAME environment variable is required.");
}

const generateFileName = (originalName, bytes = 32) => {
  const extension = path.extname(originalName);
  const randomName = crypto.randomBytes(bytes).toString("hex");
  return `${randomName}${extension}`;
};

export async function generateUploadUrls(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { files, batchId = crypto.randomBytes(16).toString('hex') } = req.body;
    
    // Expect files array like: [{ name: "photo.jpg", type: "image/jpeg", size: 1024000 }]
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "No files specified or invalid format" });
    }

    // Validate file count (optional limit)
    if (files.length > 50) {
      return res.status(400).json({ error: "Too many files. Maximum 50 files allowed." });
    }

    const uploadUrls = [];

    for (const file of files) {
      // Validate file info
      if (!file.name || !file.type || !file.size) {
        return res.status(400).json({ error: "Each file must have name, type, and size" });
      }

      // Optional: Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return res.status(400).json({ error: `File type ${file.type} not allowed` });
      }

      // Optional: Validate file size (10MB max per file)
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: `File ${file.name} is too large. Maximum 10MB per file.` });
      }

      // Generate unique filename
      const fileName = generateFileName(file.name);
      const s3Key = `uploads/${batchId}/${fileName}`;

      // Create pre-signed URL for upload
      const uploadUrl = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          ContentType: file.type,
          ContentLength: file.size,
        }),
        { 
          expiresIn: 900, // 15 minutes to complete upload
        }
      );

      uploadUrls.push({
        originalName: file.name,
        fileName: fileName,
        s3Key: s3Key,
        uploadUrl: uploadUrl,
        contentType: file.type,
        size: file.size,
      });
    }

    res.status(200).json({
      success: true,
      batchId: batchId,
      uploadUrls: uploadUrls,
      expiresIn: 900, // 15 minutes
      totalFiles: files.length,
      message: `Generated upload URLs for ${files.length} files`,
    });

  } catch (error) {
    console.error("Error generating upload URLs:", error);
    res.status(500).json({
      error: "Failed to generate upload URLs",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}