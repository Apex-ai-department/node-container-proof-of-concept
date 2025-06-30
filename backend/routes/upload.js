import express from "express";
import { upload } from "../config/multer.js";
const router = express.Router();

// Prefix: /api/upload
//router.post("/", upload.array('files', 200), handleUpload);
router.get("/url", get);
export default router;
