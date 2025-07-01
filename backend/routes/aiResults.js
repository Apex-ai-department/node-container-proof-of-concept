import express from "express";
import { saveAIResults } from "../controllers/aiResultsController.js";

const router = express.Router();

// need to protect with API authentication?
// router.use((req, res, next) => {
//     const token = req.headers['x-api-key'];
//     if (token !== process.env.AI_SERVICE_API_KEY) {
//         return res.status(401).json({ error: 'Unauthorized' });
//     }
//     next();
// })

router.post("/results", saveAIResults);

export default router;
