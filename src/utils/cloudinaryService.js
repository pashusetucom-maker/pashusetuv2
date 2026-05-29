const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

// Add retry logic with exponential backoff
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadImageToCloudinary = async (file, folder = 'receipts', retries = 3) => {
  try {
    // Validate environment variables
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration missing. Please check .env file.');
    }

    // Validate file
    if (!file) {
      throw new Error('No file provided for upload');
    }

    console.log(`Uploading to folder: ${folder}, File type: ${file.type}, Size: ${file.size} bytes`);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', `pashusetu/${folder}`);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Cloudinary API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          
          // If it's a rate limit error, retry with delay
          if (response.status === 429 && attempt < retries) {
            const delayTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`Rate limited. Retrying in ${delayTime}ms... (Attempt ${attempt}/${retries})`);
            await delay(delayTime);
            continue;
          }
          
          // Provide detailed error message
          const errorMsg = errorData.error?.message || response.statusText;
          throw new Error(`Image upload failed (${response.status}): ${errorMsg}`);
        }

        const data = await response.json();
        console.log(`Upload successful: ${data.secure_url}`);
        
        return {
          url: data.secure_url,
          publicId: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height
        };
      } catch (error) {
        // If it's the last attempt or not a network error, throw
        if (attempt === retries || !error.message.includes('Failed to fetch')) {
          throw error;
        }
        
        // Retry with delay for network errors
        const delayTime = Math.pow(2, attempt) * 1000;
        console.log(`Network error. Retrying in ${delayTime}ms... (Attempt ${attempt}/${retries})`);
        await delay(delayTime);
      }
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to Cloudinary. Please check your internet connection.');
    }
    
    throw error;
  }
};

export const uploadBase64ToCloudinary = async (base64String, folder = 'signatures', retries = 3) => {
  try {
    // Validate environment variables
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration missing. Please check .env file.');
    }

    // Validate base64 string - check if it's empty or just whitespace
    if (!base64String || base64String.trim() === '' || base64String === 'data:,') {
      console.log(`Skipping empty signature upload for folder: ${folder}`);
      return null; // Return null for empty signatures instead of throwing error
    }

    console.log(`Uploading signature to folder: ${folder}`);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const formData = new FormData();
        formData.append('file', base64String);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', `pashusetu/${folder}`);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Cloudinary API error:', errorData);
          
          // If it's a rate limit error, retry with delay
          if (response.status === 429 && attempt < retries) {
            const delayTime = Math.pow(2, attempt) * 1000;
            console.log(`Rate limited. Retrying in ${delayTime}ms... (Attempt ${attempt}/${retries})`);
            await delay(delayTime);
            continue;
          }
          
          throw new Error(`Signature upload failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log(`Signature upload successful: ${data.secure_url}`);
        
        return data.secure_url;
      } catch (error) {
        // If it's the last attempt or not a network error, throw
        if (attempt === retries || !error.message.includes('Failed to fetch')) {
          throw error;
        }
        
        // Retry with delay for network errors
        const delayTime = Math.pow(2, attempt) * 1000;
        console.log(`Network error. Retrying in ${delayTime}ms... (Attempt ${attempt}/${retries})`);
        await delay(delayTime);
      }
    }
  } catch (error) {
    console.error('Cloudinary signature upload error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to Cloudinary. Please check your internet connection.');
    }
    
    throw error;
  }
};
