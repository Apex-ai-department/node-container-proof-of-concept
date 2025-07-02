// routes/db.js
import express from "express";
import { saveJobAndResults, getJobAndResultsByJobId } from "../controllers/jobAndResultsController.js";

const router = express.Router();

router.post("/save", saveJobAndResults); // POST /api/db/save
router.get("/:jobId", getJobAndResultsByJobId);

export default router;
