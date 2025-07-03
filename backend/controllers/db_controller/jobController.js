import { pool } from "../../config/postgres.js";

// export async function saveJob(req, res) {
//   try {
//     const job = req.body;

//     if (!job?.jobId) {
//       return res.status(400).json({ error: "Missing jobId!" });
//     }

//     // Store the entire job object as JSON in a single table
//     const insertJobQuery = `
//       INSERT INTO jobs (job_id, job_data, created_at)
//       VALUES ($1, $2, $3)
//       ON CONFLICT (job_id) DO UPDATE
//       SET job_data = EXCLUDED.job_data,
//           created_at = EXCLUDED.created_at
//     `;

//     await pool.query(insertJobQuery, [
//       job.jobId,
//       JSON.stringify(job), // Store the entire job object
//       job.createdAt || new Date().toISOString(),
//     ]);

//     res.status(200).json({
//       success: true,
//       message: "Job saved successfully",
//       jobId: job.jobId,
//     });
//   } catch (error) {
//     console.error("Error saving job:", error);
//     res.status(500).json({ error: "Failed to save job" });
//   }
// }

export async function getJob(req, res) {
  const jobId = req.params.jobId;

  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId parameter" });
  }

  try {
    const query = `
        SELECT
          job_data AS job
        FROM jobs j
        WHERE j.job_id = $1 OR j."jobId" = $1
        LIMIT 1;
      `;

    const { rows } = await pool.query(query, [jobId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error retrieving job:", err);
    res.status(500).json({ error: "Failed to retrieve job" });
  }
}

export async function updateJob(req, res) {
  const jobId = req.params.jobId;
  const updateData = req.body;

  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId parameter" });
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "No update data provided" });
  }

  try {
    // First, check if the job exists
    const checkQuery = `
      SELECT job_data, created_at
      FROM jobs 
      WHERE job_id = $1
      LIMIT 1;
      `;

    const { rows: existingRows } = await pool.query(checkQuery, [jobId]);

    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Job not found in database" });
    }

    // Get existing job data
    const existingJob = existingRows[0].job_data || {};

    // Merge exisiting data with update data
    const updatedJobData = {
      ...existingJob,
      ...updateData,
      // Preserve original jobId if it exists
      jobId: existingJob.jobId || jobId,
      updatedAt: new Date().toISOString(),
    };

    // Update the job in the database
    const updateQuery = `
        UPDATE jobs
        SET job_data = $1,
            created_at = $2,
        WHERE job_id = $3
        RETURNING job_id, job_data, created_at;
      `;

    const { rows: updatedRows } = await pool.query(updateQuery, [
      JSON.stringify(updatedJobData),
      existingRows[0].created_at,
      jobId,
    ]);

    res.json({ success: true, message: "Job updated successfully!" });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
}
