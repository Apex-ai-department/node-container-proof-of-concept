// routes/jobs.js
import express from "express";
import { saveJobAndResults } from "../controllers/jobAndResultsController.js";

const router = express.Router();

router.post("/save", saveJobAndResults);

export default router;
