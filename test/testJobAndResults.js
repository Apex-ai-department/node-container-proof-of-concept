import fetch from "node-fetch";

const payload = {
  job: {
    jobId: "docker_job_001",
    batchId: "docker_batch_001",
    type: "image_processing",
    files: [
      {
        s3Key: "uploads/docker_batch_001/file1.jpg",
        s3Url: "https://s3.amazonaws.com/fake-bucket/uploads/docker_batch_001/file1.jpg",
        originalName: "file1.jpg"
      }
    ],
    metadata: {
      uploaderName: "Docker Tester",
      uploadedAt: "2025-07-02T12:00:00Z",
      totalFiles: 1,
      successfulFiles: 1
    },
    createdAt: "2025-07-02T12:01:00Z",
    status: "completed"
  },
  results: [
    {
      company_name: "Docker Inc",
      price: "999",
      date: "2025-07-01",
      uploader_name: "Docker Tester",
      raw_ocr: "This is fake OCR for Docker test",
      created_at: "2025-07-02T12:01:10Z"
    }
  ]
};

async function main() {
  try {
    const response = await fetch("http://localhost:3000/api/db/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("✅ Save Response:", data);
  } catch (err) {
    console.error("❌ Failed to save data:", err.message);
  }
}

main();
