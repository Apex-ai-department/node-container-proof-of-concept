import { pool } from "../config/postgres.js"; // Your pg connection pool

export async function saveAIResults(req, res) {
  try {
    const { jobId, results, metadata } = req.body;

    if (!jobId || !results) {
      return res.status(400).json({ error: "jobId and results are required" });
    }

    // Example insert, adjust table/columns to your schema
    const query = `
      INSERT INTO ai_results (job_id, results_json, metadata, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (job_id) DO UPDATE
      SET results_json = EXCLUDED.results_json,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
    `;

    await pool.query(query, [
      jobId,
      JSON.stringify(results),
      JSON.stringify(metadata || {})
    ]);

    res.status(200).json({ success: true, message: "AI results saved" });

  } catch (error) {
    console.error("Error saving AI results:", error);
    res.status(500).json({ error: "Failed to save AI results" });
  }
}