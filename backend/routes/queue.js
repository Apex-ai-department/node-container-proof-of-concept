import express from "express";
import { QueueInspector } from "../utilities/queueInspector.js"; // adjust path as needed

const router = express.Router();
const inspector = new QueueInspector();

router.get("/", async (req, res) => {
  try {
    // Get all jobs in the queue without removing them
    const jobs = await redis.lrange(inspector.queueName, 0, -1); // get all jobs in order (newest first)

    // Each job is a string; parse JSON safely
    const parsedJobs = jobs.map((jobStr) => {
      try {
        return JSON.parse(jobStr);
      } catch {
        return { raw: jobStr };
      }
    });

    res.json(parsedJobs);
  } catch (error) {
    console.error("Error fetching queue:", error);
    res.status(500).json({ error: "Failed to fetch job queue" });
  }
});

export default router;
