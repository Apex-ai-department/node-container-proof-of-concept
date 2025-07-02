// controllers/jobAndResultsController.js
import { pool } from "../config/postgres.js";

export async function saveJobAndResults(req, res) {
  try {
    const { job, results } = req.body;

    if (!job?.jobId || !Array.isArray(results)) {
      return res.status(400).json({ error: "Missing job or results" });
    }

    // Insert or update job
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
      job.status || "pending",
    ]);

    // Insert job files if present
    if (Array.isArray(job.files)) {
      const insertFileQuery = `
        INSERT INTO job_files (job_id, s3_key, s3_url, original_name, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `;
      for (const file of job.files) {
        await pool.query(insertFileQuery, [
          job.jobId,
          file.s3Key,
          file.s3Url,
          file.originalName,
          new Date().toISOString(),
        ]);
      }
    }

    // Insert AI results linked to job
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
        result.created_at || new Date().toISOString(),
      ]);
    }

    res.status(200).json({ success: true, message: "Job, files, and results saved" });
  } catch (err) {
    console.error("Error saving job/files/results:", err);
    res.status(500).json({ error: "Failed to save job, files, and results" });
  }
}


export async function getJobAndResultsByJobId(req, res) {
  const jobId = req.params.jobId;

  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId parameter" });
  }

  try {
    const query = `
      SELECT
        row_to_json(j) AS job,
        (SELECT json_agg(row_to_json(f)) FROM job_files f WHERE f.job_id = j.job_id) AS files,
        (SELECT json_agg(row_to_json(r)) FROM ai_results r WHERE r.job_id = j.job_id) AS results
      FROM jobs j
      WHERE j.job_id = $1
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [jobId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error retrieving job with related data:", err);
    res.status(500).json({ error: "Failed to retrieve job and related data" });
  }
}


// export async function getJobAndResultsByJobId(req, res) {
//   const jobId = req.params.jobId;

//   if (!jobId) {
//     return res.status(400).json({ error: "Missing jobId parameter" });
//   }

//   try {
//     // Get the job
//     const jobResult = await pool.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
//     if (jobResult.rowCount === 0) {
//       return res.status(404).json({ error: "Job not found" });
//     }
//     const job = jobResult.rows[0];

//     // Get the ai_results linked to job
//     const resultsResult = await pool.query('SELECT * FROM ai_results WHERE job_id = $1', [jobId]);
//     const results = resultsResult.rows;

//     // Get the job_files linked to job
//     const filesResult = await pool.query('SELECT * FROM job_files WHERE job_id = $1', [jobId]);
//     const files = filesResult.rows;

//     // Return combined data
//     res.json({ job, results, files });
//   } catch (err) {
//     console.error("Error retrieving job/results/files:", err);
//     res.status(500).json({ error: "Failed to retrieve job, results, and files" });
//   }
// }