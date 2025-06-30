// 📁 /api/generate-upload-urls.js
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { s3Client } from "../config/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateUploadUrls } from "./generateUploadUrls.js";
dotenv.config();

const bucketName = process.env.S3_BUCKET_NAME;

if (!bucketName) {
  throw new Error("S3_BUCKET_NAME environment variable is required.");
}

const generateFileName = (originalName, bytes = 32) => {
  const extension = path.extname(originalName);
  const randomName = crypto.randomBytes(bytes).toString("hex");
  return `${randomName}${extension}`;
};

// 🚀 NEW: Generate pre-signed URLs for multiple files

// 📁 /api/confirm-uploads.js

// 🚀 NEW: Confirm uploads and queue for processing

// 📁 Frontend React Component Example
const frontendExample = `
// MultiFileUpload.jsx
import React, { useState } from 'react';

function MultiFileUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [completed, setCompleted] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setProgress({});
    setCompleted(false);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setCompleted(false);
    
    try {
      // STEP 1: Get pre-signed URLs
      const fileInfos = files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));

      console.log('🔗 Getting upload URLs...');
      const urlResponse = await fetch('/api/generate-upload-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileInfos })
      });
      
      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URLs');
      }
      
      const { batchId, uploadUrls } = await urlResponse.json();
      console.log(\`📦 Got batch ID: \${batchId}\`);

      // STEP 2: Upload files in parallel using pre-signed URLs
      console.log('🚀 Starting parallel uploads...');
      const uploadPromises = uploadUrls.map(async (urlInfo, index) => {
        const file = files[index];
        
        try {
          setProgress(prev => ({ ...prev, [index]: 0 }));
          
          const uploadResponse = await fetch(urlInfo.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
            // Note: Progress tracking with fetch is limited, 
            // consider using XMLHttpRequest for detailed progress
          });

          if (uploadResponse.ok) {
            setProgress(prev => ({ ...prev, [index]: 100 }));
            return { 
              s3Key: urlInfo.s3Key, 
              success: true,
              originalName: file.name
            };
          } else {
            throw new Error(\`HTTP \${uploadResponse.status}\`);
          }
        } catch (error) {
          console.error(\`Upload failed for \${file.name}:\`, error);
          setProgress(prev => ({ ...prev, [index]: -1 })); // -1 indicates error
          return { 
            s3Key: urlInfo.s3Key, 
            success: false, 
            error: error.message,
            originalName: file.name
          };
        }
      });

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      console.log('📊 Upload results:', uploadResults);

      // STEP 3: Confirm successful uploads and queue for processing
      console.log('📋 Confirming uploads...');
      const confirmResponse = await fetch('/api/confirm-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batchId,
          uploadedFiles: uploadResults,
          metadata: {
            uploadedAt: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        })
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm uploads');
      }

      const confirmResult = await confirmResponse.json();
      console.log('✅ Upload process completed:', confirmResult);
      
      setCompleted(true);
      alert(\`Successfully uploaded and queued \${confirmResult.processedFiles} files for processing!\`);
      
    } catch (error) {
      console.error('❌ Upload process failed:', error);
      alert(\`Upload failed: \${error.message}\`);
    } finally {
      setUploading(false);
    }
  };

  const getProgressColor = (prog) => {
    if (prog === -1) return 'bg-red-500'; // Error
    if (prog === 100) return 'bg-green-500'; // Complete
    return 'bg-blue-500'; // In progress
  };

  const getProgressText = (prog) => {
    if (prog === -1) return 'Failed';
    if (prog === 100) return 'Complete';
    return \`\${prog}%\`;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Multi-File Upload</h2>
      
      <div className="mb-4">
        <input 
          type="file" 
          multiple 
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {files.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Selected {files.length} files:</p>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-1">
              <span className="text-sm truncate">{file.name}</span>
              <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={uploadFiles} 
        disabled={uploading || files.length === 0}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
      >
        {uploading ? 'Uploading...' : \`Upload \${files.length} Files\`}
      </button>

      {uploading && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Upload Progress:</h3>
          {Object.entries(progress).map(([index, prog]) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{files[parseInt(index)]?.name}</span>
                <span>{getProgressText(prog)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={\`h-2 rounded-full transition-all duration-300 \${getProgressColor(prog)}\`}
                  style={{ width: prog === -1 ? '100%' : \`\${Math.max(prog, 0)}%\` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {completed && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          🎉 All files uploaded successfully and queued for processing!
        </div>
      )}
    </div>
  );
}

export default MultiFileUpload;
`;

console.log('Frontend component code:', frontendExample);