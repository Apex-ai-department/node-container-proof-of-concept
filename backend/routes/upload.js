import express from "express";
import { handleUpload } from "../controllers/uploadController.js";

const router = express.Router();

// Prefix: /api/upload
router.post("/", handleUpload);

export default router;