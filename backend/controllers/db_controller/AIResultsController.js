// controllers/jobAndResultsController.js
import { pool } from "../../config/postgres.js";

export async function saveInvoiceResults(req, res) {
  try {
    const results = req.body;

    if (!Array.isArray(results)) {
      return res.status(400).json({ error: "Missing job or results" });
    }

    // Insert AI results linked to job
    const insertResultQuery = `
      INSERT INTO ai_results (
        job_id, company_name, price, date, uploader_name, raw_ocr, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id
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

    res
      .status(200)
      .json({ success: true, message: "Job, files, and results saved" });
  } catch (err) {
    console.error("Error saving job/files/results:", err);
    res.status(500).json({ error: "Failed to save job, files, and results" });
  }
}

export async function getInvoiceResults(req, res) {
  const jobId = req.params.jobId;

  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId parameter" });
  }

  try {
    // Optimized query using LEFT JOIN instead of subquery
    const query = `
      SELECT
        COALESCE(json_agg(r.*) FILTER (WHERE r.id IS NOT NULL), '[]'::json) AS results
      FROM jobs j
      LEFT JOIN ai_results r ON r.job_id = j.job_id OR r.job_id = j."jobId"
      WHERE j.job_id = $1 OR j."jobId" = $1
      GROUP BY j.job_id, j."jobId"
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [jobId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error retrieving invoice results:", err);
    res.status(500).json({ error: "Failed to retrieve invoice results" });
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
