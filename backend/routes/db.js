// routes/db.js
import express from "express";
import {
  saveInvoiceResults,
  getInvoiceResults,
} from "../controllers/db_controller/AIResultsController.js";
import {
  getJob,
  updateJob,
} from "../controllers/db_controller/jobController.js";
import { pool } from "../config/postgres.js";

const router = express.Router();

// AI Invoice result
router.post("/save_invoice", saveInvoiceResults); // POST /api/db/save - save job and results
router.get("/invoice_results/:jobId", getInvoiceResults); // GET /api/db/results/:jobId - get job and related results

// Jobs
router.get("/jobs/:jobId", getJob); // GET /api/db/jobs/:jobId - get specific job
router.put("/jobs/:jobId", updateJob); // PUT /api/db/jobs/:jobId - update specific job

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM ai_results ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching AI results:", error);
    res.status(500).json({ error: "Failed to fetch AI results" });
  }
});

export default router;
