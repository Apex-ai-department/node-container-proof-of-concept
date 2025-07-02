export async function preprocessImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
  
        // Step 0: Limit size for preprocessed image to prevent memory issues
        const maxSize = 1024;
        let { width, height } = img;
  
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
  
        // Step 1: Draw original image
        ctx.drawImage(img, 0, 0, width, height);
  
        // Step 2: Convert to grayscale
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
  
        for (let i = 0; i < data.length; i += 4) {
          const gray =
            0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray; // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue
        }
  
        // Apply the final processed image data
        const finalImageData = new ImageData(data, width, height);
        ctx.putImageData(finalImageData, 0, 0);
  
        // Convert to blob and create new file
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: "image/png",
                lastModified: Date.now(),
              });
              resolve(processedFile);
            } else {
              reject("Failed to convert canvas to blob!!");
            }
          },
          "image/png"
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }