import express from "express";
import { handleUpload } from "../controllers/uploadController.js";
import { upload } from "../config/multer.js";

const router = express.Router();

// Prefix: /api/upload
router.post("/", upload.array("file", 200), handleUpload);

export default router;
