import express from "express";
import upload from "../config/multer.js";
import { generateUploadUrls } from "../controllers/generate_upload_urls.js";
import { confirmUploads } from "../controllers/confirm_uploads.js";
import { handleUpload } from "../controllers/uploadController.js";

const router = express.Router();

// Generate pre-signed URLs for direct S3 upload
router.post("/urls", generateUploadUrls);

router.post("/preprocessed", upload.single("file"), handleUpload);

// Push S3 keys to job queue
router.post("/confirm", confirmUploads);

export default router;
