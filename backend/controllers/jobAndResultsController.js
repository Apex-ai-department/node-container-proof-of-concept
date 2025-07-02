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

export async function getJobAndResultsByJobId(req, res) {
  const jobId = req.params.jobId;

  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId parameter" });
  }

  try {
    const jobResult = await pool.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
    if (jobResult.rowCount === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    const job = jobResult.rows[0];

    const resultsResult = await pool.query('SELECT * FROM ai_results WHERE job_id = $1', [jobId]);
    const results = resultsResult.rows;

    res.json({ job, results });
  } catch (err) {
    console.error("Error retrieving job/results:", err);
    res.status(500).json({ error: "Failed to retrieve job and results" });
  }
}