/**
 * High-quality image compression utility
 * Target: 500-700KB with minimal quality loss
 */

export const compressImage = async (file, maxSizeKB = 700, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    // If file is already small enough, return as is
    if (file.size <= maxSizeKB * 1024) {
      console.log(`✓ File already optimized: ${(file.size / 1024).toFixed(2)}KB`);
      resolve(file);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (maintain aspect ratio)
        let width = img.width;
        let height = img.height;
        
        // Max dimensions for Aadhaar cards (good balance)
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // High-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to hit target size
        const tryCompress = (currentQuality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }
              
              const compressedSize = blob.size / 1024; // KB
              console.log(`Compressed: ${compressedSize.toFixed(2)}KB at quality ${currentQuality}`);
              
              // If size is good, create File and resolve
              if (compressedSize <= maxSizeKB || currentQuality <= 0.5) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                
                console.log(`✓ Compression complete: ${(file.size / 1024).toFixed(2)}KB → ${compressedSize.toFixed(2)}KB (${((1 - compressedSize / (file.size / 1024)) * 100).toFixed(1)}% reduction)`);
                resolve(compressedFile);
              } else {
                // Try with lower quality
                tryCompress(currentQuality - 0.1);
              }
            },
            'image/jpeg',
            currentQuality
          );
        };
        
        tryCompress(quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Batch compress multiple images
 */
export const compressImages = async (files, maxSizeKB = 700, quality = 0.85) => {
  const compressionPromises = files.map(file => compressImage(file, maxSizeKB, quality));
  return Promise.all(compressionPromises);
};
