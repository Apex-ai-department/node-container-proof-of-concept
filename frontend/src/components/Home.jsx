import { useState } from "react";

async function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const threshold = 128;
          const binarized = avg > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = binarized;
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, {
              type: "image/jpeg",
            });
            resolve(processedFile);
          } else {
            reject("Failed to convert canvas to blob");
          }
        }, "image/jpeg", 0.8);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [uploaderName, setUploaderName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
        // Step 1: Generate pre-signed URLs
        setCurrentStep("Getting upload URLs...");
        const processedFiles = await Promise.all(
            Array.from(files).map((file) => preprocessImage(file))
        );

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
              onChange={(e) => setFiles(e.target.files)}
              className="hidden"
            />
            <span className="text-sm text-gray-500">
              {files.length
                ? `${files.length} file(s) selected`
                : "No file selected"}
            </span>
          </label>
          <button
            type="submit"
            disabled={!files.length || !uploaderName || loading}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow transition disabled:opacity-50 text-lg"
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
          <p>{currentStep}</p>
        </form>
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
      </div>
    </div>
  );
}
