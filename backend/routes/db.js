// routes/ai.js
import express from "express";
import { saveJobAndResults, getJobAndResultsByJobId } from "../controllers/jobAndResultsController.js";

const router = express.Router();

router.post("/save", saveJobAndResults); // POST /api/ai/save
router.get("/:jobId", getJobAndResultsByJobId);

export default router;
