// routes/db.js
import express from "express";
import { saveJobAndResults, getJobAndResultsByJobId } from "../controllers/jobAndResultsController.js";
import { pool } from "../config/postgres.js";

const router = express.Router();

router.post("/save", saveJobAndResults); // POST /api/db/save - save job and results
router.get("/:jobId", getJobAndResultsByJobId); // get job and related results

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
