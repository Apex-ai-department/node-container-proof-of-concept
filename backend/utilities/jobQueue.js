import redis from "../config/redis.js";
import { v4 as uuidv4 } from "uuid";

// A job queue class
export class JobQueue {
    constructor(queueName = "receipt-jobs") {
        this.queueName = queueName;
    }

    // Add job to queue
    async addJob(s3url) {
        // Create job id
        const jobId = `job_${Date.now()}_${uuid()}`;
    
        // Store job metadata into queue
        await redis.hset(`job:${jobId}`, {
            status: 'pending',
            s3URL: s3url,
            createdAt: Date.now()
        });

        // Add to queue
        await redis.lpush(this.queueName, jobId);

        return jobId;
    }

    // Get job from the queue ***For AI-service 
    async getJob(timeout = 30) {
        const result = await redis.brpop(this.queueName, timeout);
        return result ? result[1] : null // Return jobId
    }

    // Get job metadata
    async getJobData(jobId) {
        return await redis.hgetall(`job:${jobId}`);
    }

    // Update job status ***For AI-service
    async updateJobStatus(jobId, status) {
        await redis.hset(`job:${jobId}`, {
            status,
            updatedAt: Date.now(),
        })
    }

    // Get queue length
    async getQueueLength() {
        return await redis.llen(this.queueName);
    }
}