// controllers/jobAndResultsController.js
import { pool } from "../config/postgres.js";

export async function saveJobAndResults(req, res) {
  try {
    const { job, results } = req.body;

    if (!job?.jobId || !Array.isArray(results)) {
      return res.status(400).json({ error: "Missing job or results" });
    }

    // 1. Insert job
    const insertJobQuery = `
      INSERT INTO jobs (job_id, batch_id, type, metadata, created_at, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (job_id) DO UPDATE
      SET metadata = EXCLUDED.metadata,
          status = EXCLUDED.status,
          created_at = EXCLUDED.created_at
    `;

    await pool.query(insertJobQuery, [
      job.jobId,
      job.batchId,
      job.type,
      JSON.stringify(job.metadata || {}),
      job.createdAt || new Date().toISOString(),
      job.status || "pending"
    ]);

    // 2. Insert AI results linked to job
    const insertResultQuery = `
      INSERT INTO ai_results (
        job_id, company_name, price, date, uploader_name, raw_ocr, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const result of results) {
      await pool.query(insertResultQuery, [
        job.jobId,
        result.company_name,
        result.price,
        result.date,
        result.uploader_name,
        result.raw_ocr,
        result.created_at || new Date().toISOString()
      ]);
    }

    res.status(200).json({ success: true, message: "Job and results saved" });

  } catch (err) {
    console.error("Error saving job/results:", err);
    res.status(500).json({ error: "Failed to save job and results" });
  }
}
