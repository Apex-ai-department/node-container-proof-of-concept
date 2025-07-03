import crypto from "crypto";
import dotenv from "dotenv";
import { redis } from "../../config/redis.js";
import { pool } from "../../config/postgres.js";

dotenv.config();

const bucketName = process.env.S3_BUCKET_NAME;

// 🚀 NEW: Confirm uploads and queue for processing
export async function confirmUploads(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if request body exists and is properly parsed
    if (!req.body) {
      return res.status(400).json({
        error: "Request body is missing or not properly formatted",
        details: "Ensure Content-Type: application/json header is set",
      });
    }

    const { batchId, uploadedFiles, metadata = {} } = req.body;

    // uploadedFiles should be: [{ s3Key: "uploads/batch/file.jpg", success: true, error?: string }]
    if (!batchId || !uploadedFiles || !Array.isArray(uploadedFiles)) {
      return res
        .status(400)
        .json({ error: "batchId and uploadedFiles array required" });
    }

    // Filter only successful uploads
    const successfulUploads = uploadedFiles.filter(
      (file) => file.success === true
    );

    if (successfulUploads.length === 0) {
      return res.status(400).json({
        error: "No successful uploads to process",
        failedFiles: uploadedFiles.filter((f) => !f.success),
      });
    }

    // Create job for AI/processing queue
    const processingJob = {
      jobId: crypto.randomBytes(16).toString("hex"),
      batchId: batchId,
      type: "image_processing", // or whatever processing type you need
      files: successfulUploads.map((f) => ({
        s3Key: f.s3Key,
        s3Url: `https://${bucketName}.s3.amazonaws.com/${f.s3Key}`,
        originalName: f.originalName || "unknown",
      })),
      metadata: metadata, // Any additional data you want to pass
      createdAt: new Date().toISOString(),
      status: "processing",
    };

    // Push to Redis queue for processing
    await redis.lpush("receipt_upload_queue", JSON.stringify(processingJob));

    console.log(
      `📤 Queued job ${processingJob.jobId} with ${successfulUploads.length} files for processing`
    );

    // Storing job to postgre database
    // Store the entire job object as JSON in a single table
    const insertJobQuery = `
      INSERT INTO jobs (job_id, job_data, created_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (job_id) DO UPDATE
      SET job_data = EXCLUDED.job_data,
          created_at = EXCLUDED.created_at
    `;

    await pool.query(insertJobQuery, [
      processingJob.jobId,
      JSON.stringify(processingJob), // Store the entire job object
      processingJob.createdAt || new Date().toISOString(),
    ]);

    res.status(200).json({
      success: true,
      jobId: processingJob.jobId,
      batchId: batchId,
      processedFiles: successfulUploads.length,
      failedFiles: uploadedFiles.length - successfulUploads.length,
      message: `Queued ${successfulUploads.length} files for processing`,
    });
  } catch (error) {
    console.error("Error confirming uploads:", error);
    res.status(500).json({
      error: "Failed to queue files for processing",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
