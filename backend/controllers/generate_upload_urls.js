import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { s3Client } from "../config/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateUploadUrls } from "./generateUploadUrls.js";
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