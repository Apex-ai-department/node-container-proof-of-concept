import { redis } from "../config/redis.js";

export class QueueInspector {
  constructor() {
    this.queueName = "receipt_upload_queue";
  }

  // Check out queue without removing jobs - peek the latest (newest) job
  async peekQueue() {
    try {
      const job = await redis.lrange(this.queueName, 0, 0); // Get the first item (newest, since we use LPUSH)
      if (job.length === 0) {
        console.log("Queue is empty");
        return null;
      }

      console.log("Raw data from queue (Peek): \n", job[0]);
    } catch (error) {
      console.error("Error peeking queue: ", error);
      throw error;
    }
  }

  // Check out queue with removing jobs
  async pullJob(timeout = 5) {
    try {
      // For Upstash Redis, we need to use a different approach
      // First, get the queue length
      const length = await redis.llen(this.queueName);

      if (length === 0) {
        console.log("No jobs available in queue");
        return null;
      }

      // Get and remove the last item (oldest job - FIFO)
      const jobData = await redis.lpop(this.queueName);

      if (!jobData) {
        console.log("No jobs available in queue");
        return null;
      }

      console.log("Raw data from queue (Pull): \n", jobData);
      return jobData;
    } catch (error) {
      console.error("Error pulling job: ", error);
      throw error;
    }
  }

  // Clear queue
  async clearQueue() {
    try {
      const length = await redis.llen(this.queueName);
      await redis.del(this.queueName);
      console.log(`Cleared queue '${this.queueName}' (removed ${length} jobs)`);
    } catch (error) {
      console.error("Error clearing queue: ", error);
      throw error;
    }
  }

  // Get queue length
  async getQueueLength() {
    try {
      const length = await redis.llen(this.queueName);
      console.log(`📊 Queue length: ${length} jobs`);
    } catch (error) {
      console.error("Error getting queue length: ", error);
      throw error;
    }
  }
}

// CLI interface for testing
async function main() {
  const inspector = new QueueInspector();
  const command = process.argv[2] || "peek";

  try {
    switch (command) {
      case "peek":
        console.log("👀 Peeking at latest job in queue...");
        await inspector.peekQueue();
        break;

      case "pull":
        console.log("🎣 Pulling job from queue...");
        await inspector.pullJob();
        break;

      case "length":
        await inspector.getQueueLength();

        break;

      case "clear":
        console.log("🗑️ Clearing queue...");
        await inspector.clearQueue();
        break;

      default:
        console.log("Available commands: peek, pull, length, clear");
        break;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes("queueInspector.js")) {
  main();
}
