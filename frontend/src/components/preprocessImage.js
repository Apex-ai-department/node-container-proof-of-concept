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

      // // Step 3: Apply binarization (Otsu's method)
      
      // // Count the number for each brightness level
      // const histogram = new Array(256).fill(0);
      // for (let i = 0; i < data.length; i += 4) {
      //   histogram[data[i]]++;
      // }

      // // Calculate threshold using Otsu's method
      // const totalPixels = width * height;
      // let sum = 0;
      // for (let i = 0; i < 256; i++) {
      //   sum += i * histogram[i];
      // }

      // let sumB = 0;
      // let wB = 0;
      // let wF = 0;
      // let maxVariance = 0;
      // let threshold = 128; // Default threshold

      // for (let t = 0; t < 256; t++) {
      //   wB += histogram[t];
      //   if (wB === 0) continue;

      //   wF = totalPixels - wB;
      //   if (wF === 0) break;

      //   sumB += t * histogram[t];
      //   const mB = sumB / wB;
      //   const mF = (sum - sumB) / wF;

      //   const variance = wB * wF * (mB - mF) * (mB - mF);
      //   if (variance > maxVariance) {
      //     maxVariance = variance;
      //     threshold = t;
      //   }
      // }

      // // Apply threshold
      // for (let i = 0; i < data.length; i += 4) {
      //   const gray = data[i];
      //   const binary = gray > threshold ? 255 : 0;
      //   data[i] = binary; // Red
      //   data[i + 1] = binary; // Green
      //   data[i + 2] = binary; // Blue
      // }

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