import express from "express";
import { saveJobAndResults } from "../controllers/jobAndResultsController.js";

const router = express.Router();

// Mock data for invoices - you can replace this with actual database queries
const mockInvoices = [
  {
    id: 1,
    company_name: "Sample Company 1",
    price: "1500",
    date: "2024-01-15",
    uploader_name: "John Doe",
    raw_ocr: "Sample OCR text for receipt 1",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    company_name: "Sample Company 2",
    price: "2300",
    date: "2024-01-16",
    uploader_name: "Jane Smith",
    raw_ocr: "Sample OCR text for receipt 2",
    created_at: "2024-01-16T14:20:00Z",
  },
];

router.post("/results", saveJobAndResults);

// GET /api/invoices
router.get("/", (req, res) => {
  res.json(mockInvoices);
});

export default router;
