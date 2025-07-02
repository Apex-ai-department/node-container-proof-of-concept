// routes/ai.js
import express from "express";
import { saveJobAndResults } from "../controllers/jobAndResultsController.js";

const router = express.Router();

router.post("/save", saveJobAndResults); // POST /api/ai/save

export default router;
