import express from "express";
import { upload } from "../config/multer.js";
import { generateUploadUrls } from "../controllers/generate_upload_urls.js";

const router = express.Router();

// Prefix: /api/upload
router.post("/", upload.array('files', 200), handleUpload);
router.get("/url", generateUploadUrls);
export default router;
