import { useState, useEffect } from "react";
import { preprocessImage } from "../components/preprocessImage.js";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [preprocessedFiles, setPreprocessedFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [uploaderName, setUploaderName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preprocessingLoading, setPreprocessingLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Download preprocessed image file
  const downloadFile = (file, filename) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download all preprocessed image file
  const downloadAllPreprocessed = () => {
    preprocessedFiles.forEach((file, index) => {
      setTimeout(() => {
        const filename = `preprocessed_${file.name}`;
        downloadFile(file, filename);
      }, index * 100); // Small delay between downloads to avoid browser blocking
    });
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/db/jobs", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jobsData = await response.json();
      setJobs(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  // Load jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Refresh jobs after successful upload
  useEffect(() => {
    if (result?.success) {
      // Refresh jobs immediately after upload
      fetchJobs();

      // Then poll for updates every 5 seconds for the next 2 minutes
      const pollInterval = setInterval(() => {
        fetchJobs();
      }, 5000);

      // Stop polling after 2 minutes
      const stopPolling = setTimeout(() => {
        clearInterval(pollInterval);
      }, 120000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(stopPolling);
      };
    }
  }, [result]);

  const handlePreprocess = async () => {
    if (!files.length) return;

    setPreprocessingLoading(true);
    try {
      const processedFiles = await Promise.all(
        Array.from(files).map((file) => preprocessImage(file))
      );
      setPreprocessedFiles(processedFiles);
      setShowPreview(true);
    } catch (error) {
      console.error("Preprocessing failed: ", error);
      alert("Preprocessing failed: " + error.message);
    } finally {
      setPreprocessingLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Step 1: Generate pre-signed URLs
      let processedFiles;

      if (preprocessedFiles.length > 0) {
        setCurrentStep("Getting upload URLs...");
        processedFiles = preprocessedFiles;
      } else {
        setCurrentStep("Preprocessing images for OCR...");
        processedFiles = await Promise.all(
          Array.from(files).map((file) => preprocessImage(file))
        );
      }

      setCurrentStep("Getting upload URLs...");
      const fileInfos = processedFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }));

      const urlResponse = await fetch("/api/upload/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: fileInfos,
          metadata: { uploaderName },
        }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || "Failed to get upload URLs");
      }

      const { batchId, uploadUrls } = await urlResponse.json();

      // Step 2: Upload files directly to S3 in parallel
      setCurrentStep("Uploading files to cloud storage...");
      const uploadPromises = uploadUrls.map(async (url, index) => {
        const file = processedFiles[index];

        try {
          // Fetching from AWS S3 directly
          const uploadResponse = await fetch(url.uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (uploadResponse.ok) {
            return {
              s3Key: url.s3Key,
              success: true,
              originalName: file.name,
            };
          } else {
            throw new Error(
              `Upload failed with status ${uploadResponse.status}`
            );
          }
        } catch (error) {
          console.error(`upload failed for ${file.name}: `, error);
          return {
            s3Key: url.s3Key,
            success: false,
            error: error.message,
            originalName: file.name,
          };
        }
      });

      // Upload all image files in parallel
      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter((file) => file.success);

      if (successfulUploads.length === 0) {
        throw new Error("No files were uploaded successfully");
      }

      // Step 3: Confirm uploads and trigger AI-service
      setCurrentStep("Queuing files for AI processing...");

      const confirmResponse = await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: batchId,
          uploadedFiles: uploadResults,
          metadata: {
            uploaderName: uploaderName,
            uploadedAt: new Date().toISOString(),
            totalFiles: files.length,
            successfulFiles: successfulUploads.length,
          },
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(
          errorData.error || "Failed to queue files for processing"
        );
      }

      const confirmResult = await confirmResponse.json();

      // Step 4: Poll for results or show success message
      setCurrentStep("Processing complete!");
      setResult({
        success: true,
        message: `Successfully uploaded and queued ${successfulUploads.length} files for AI processing`,
        jobId: confirmResult.jobId,
        batchId: confirmResult.batchId,
        processedFiles: successfulUploads.length,
        failedFiles: uploadResults.length - successfulUploads.length,
        uploadResults: uploadResults,
      });
    } catch (error) {
      console.error("Upload process failed:", error);
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
      setCurrentStep("");
      setFiles([]);
      setPreprocessedFiles([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-xl border border-red-100">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-red-700 tracking-tight">
          Japanese Receipt OCR Extractor
        </h1>
        <form onSubmit={handleUpload} className="flex flex-col gap-6">
          <input
            type="text"
            placeholder="Uploader Name"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            className="border border-red-300 rounded-xl px-4 py-3 mb-2"
            required
          />
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-red-300 rounded-xl cursor-pointer bg-red-50 hover:bg-red-100 transition">
            <span className="text-red-600 font-medium mb-2">
              Select Receipt Images
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                setFiles(e.target.files);
                setPreprocessedFiles([]); // Clear preprocessed files
                setShowPreview(false); // Hide preview section
                setResult(null); // Clear previous results
              }}
              className="hidden"
            />
            <span className="text-sm text-gray-500">
              {files.length
                ? `${files.length} file(s) selected`
                : "No file selected"}
            </span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePreprocess}
              disabled={!files.length || preprocessingLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow transition disabled:opacity-50"
            >
              {preprocessingLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Preview Preprocessed"
              )}
            </button>
            <button
              type="submit"
              disabled={!files.length || !uploaderName || loading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow transition disabled:opacity-50 flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Upload and Extract"
              )}
            </button>
          </div>
          <p>{currentStep}</p>
        </form>

        {/* Preview Section */}
        {showPreview && preprocessedFiles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-red-600">
              Image Preview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Images */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-700">
                  Original Images
                </h3>
                <div className="space-y-3">
                  {Array.from(files).map((file, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        {file.name}
                      </p>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Original ${file.name}`}
                        className="w-full h-32 object-contain bg-gray-50 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Preprocessed Images */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-700">
                  Preprocessed Images
                </h3>
                <div className="space-y-3">
                  {preprocessedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        {file.name} (Processed)
                      </p>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preprocessed ${file.name}`}
                        className="w-full h-32 object-contain bg-gray-50 rounded"
                      />
                      <button
                        onClick={() =>
                          downloadFile(file, `preprocessed_${file.name}`)
                        }
                        className="mt-2 w-full bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded transition"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upload Preprocessed Button */}
            <div className="mt-6 text-center">
              <button
                onClick={downloadAllPreprocessed}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow transition"
              >
                Download All Preprocessed
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-3 text-red-600">
              Upload log
            </h2>
            <pre className="bg-red-50 border border-red-100 rounded-xl p-5 text-base overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Jobs</h2>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((jobData, index) => {
                const job = jobData.job;
                const status = job?.status || "unknown";

                const getStatusColor = (status) => {
                  switch (status) {
                    case "processing":
                      return "bg-yellow-100 text-yellow-800 border-yellow-200";
                    case "completed":
                      return "bg-green-100 text-green-800 border-green-200";
                    case "failed":
                      return "bg-red-100 text-red-800 border-red-200";
                    default:
                      return "bg-gray-100 text-gray-800 border-gray-200";
                  }
                };

                const getStatusIcon = (status) => {
                  switch (status) {
                    case "processing":
                      return (
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          ></path>
                        </svg>
                      );
                    case "completed":
                      return (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      );
                    case "failed":
                      return (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      );
                    default:
                      return (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      );
                  }
                };

                return (
                  <div
                    key={job?.jobId || index}
                    className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-700">
                        Job: {job?.jobId?.slice(0, 8)}...
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          status
                        )}`}
                      >
                        {getStatusIcon(status)}
                        <span className="ml-1 capitalize">{status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Batch ID:</span>{" "}
                        {job?.batchId || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Files:</span>{" "}
                        {job?.files?.length || 0}
                      </div>
                      <div>
                        <span className="font-medium">Uploader:</span>{" "}
                        {job?.metadata?.uploaderName || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {job?.createdAt
                          ? new Date(job.createdAt).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>

                    {job?.files && job.files.length > 0 && (
                      <div className="mb-3">
                        <span className="font-medium text-sm text-gray-700">
                          Files:
                        </span>
                        <div className="mt-1 space-y-1">
                          {job.files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded"
                            >
                              {file.originalName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        View full job data
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 overflow-x-auto bg-gray-50 p-2 rounded">
                        {JSON.stringify(job, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No jobs found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
