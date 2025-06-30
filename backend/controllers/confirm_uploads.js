import crypto from "crypto";
import dotenv from "dotenv";
import { redis } from "../config/redis.js";

dotenv.config();

const bucketName = process.env.S3_BUCKET_NAME;

// 🚀 NEW: Confirm uploads and queue for processing
export async function confirmUploads(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { batchId, uploadedFiles, metadata = {} } = req.body;
    
    // uploadedFiles should be: [{ s3Key: "uploads/batch/file.jpg", success: true, error?: string }]
    if (!batchId || !uploadedFiles || !Array.isArray(uploadedFiles)) {
      return res.status(400).json({ error: "batchId and uploadedFiles array required" });
    }

    // Filter only successful uploads
    const successfulUploads = uploadedFiles.filter(file => file.success === true);
    
    if (successfulUploads.length === 0) {
      return res.status(400).json({ 
        error: "No successful uploads to process",
        failedFiles: uploadedFiles.filter(f => !f.success)
      });
    }

    // Create job for AI/processing queue
    const processingJob = {
      jobId: crypto.randomBytes(16).toString('hex'),
      batchId: batchId,
      type: 'image_processing', // or whatever processing type you need
      files: successfulUploads.map(f => ({
        s3Key: f.s3Key,
        s3Url: `https://${bucketName}.s3.amazonaws.com/${f.s3Key}`,
        originalName: f.originalName || 'unknown'
      })),
      metadata: metadata, // Any additional data you want to pass
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Push to Redis queue for processing
    await redis.lpush('ai_processing_queue', JSON.stringify(processingJob));
    
    console.log(`📤 Queued job ${processingJob.jobId} with ${successfulUploads.length} files for processing`);

    // TODO: Optionally save batch info to database here
    // await db.batches.create({
    //   batchId,
    //   jobId: processingJob.jobId,
    //   fileCount: successfulUploads.length,
    //   status: 'queued'
    // });

    res.status(200).json({
      success: true,
      jobId: processingJob.jobId,
      batchId: batchId,
      processedFiles: successfulUploads.length,
      failedFiles: uploadedFiles.length - successfulUploads.length,
      message: `Queued ${successfulUploads.length} files for processing`
    });

  } catch (error) {
    console.error("Error confirming uploads:", error);
    res.status(500).json({
      error: "Failed to queue files for processing",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}