import express from "express";
import { generateUploadUrls } from "../controllers/upload_controller/generate_upload_urls.js";
import { confirmUploads } from "../controllers/upload_controller/confirm_uploads.js";

const router = express.Router();

// Generate pre-signed URLs for direct S3 upload
router.post("/urls", generateUploadUrls);

// Push S3 keys to job queue
router.post("/confirm", confirmUploads);

export default router;
