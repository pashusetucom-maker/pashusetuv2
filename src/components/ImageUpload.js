import React, { useState, useRef, useEffect } from 'react';
import { uploadImageToCloudinary } from '../utils/cloudinaryService';
import { compressImage } from '../utils/imageCompression';

function ImageUpload({ 
  label, 
  onImageSelect, 
  folder = 'receipts', 
  required = false, 
  accept = "image/*",
  maxSizeKB = 700,
  enableCompression = true 
}) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setOriginalSize(file.size);
    setUploadError(null);
    setUploadedUrl(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    try {
      let fileToUpload = file;
      
      // Compress if enabled and file is large
      if (enableCompression && file.size > maxSizeKB * 1024) {
        setCompressing(true);
        console.log(`📦 Compressing ${file.name}...`);
        
        fileToUpload = await compressImage(file, maxSizeKB, 0.85);
        setCompressedSize(fileToUpload.size);
        setCompressing(false);
        
        console.log(`✓ Compression done: ${(file.size / 1024).toFixed(2)}KB → ${(fileToUpload.size / 1024).toFixed(2)}KB`);
      }
      
      // Start background upload
      setUploading(true);
      setUploadProgress(10);
      
      console.log(`⬆️ Uploading to ${folder}...`);
      const result = await uploadImageToCloudinary(fileToUpload, folder);
      
      setUploadProgress(100);
      setUploadedUrl(result.url);
      setUploading(false);
      
      // Pass complete data to parent
      onImageSelect({
        file: fileToUpload,
        originalFile: file,
        url: result.url,
        publicId: result.publicId,
        uploaded: true,
        compressed: enableCompression && file.size > maxSizeKB * 1024,
        originalSize: file.size,
        finalSize: fileToUpload.size
      });
      
      console.log(`✅ Upload successful: ${result.url}`);
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      setUploadError(error.message);
      setUploading(false);
      setCompressing(false);
      setUploadProgress(0);
      
      // Still pass file for fallback
      onImageSelect({
        file: file,
        url: null,
        uploaded: false,
        error: error.message
      });
    }
  };

  const handleCameraCapture = () => {
    fileInputRef.current.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName('');
    setUploadedUrl(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploading(false);
    setCompressing(false);
    setOriginalSize(0);
    setCompressedSize(0);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simulate progress for better UX
  useEffect(() => {
    if (uploading && uploadProgress < 90) {
      const timer = setTimeout(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [uploading, uploadProgress]);

  return (
    <div className="image-upload-container" style={{ marginBottom: '20px' }}>
      <label className="image-upload-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
        {uploadedUrl && (
          <span style={{ color: '#4CAF50', fontSize: '12px', marginLeft: '8px' }}>
            ✓ Uploaded
            {compressedSize > 0 && (
              <span style={{ color: '#666', marginLeft: '5px' }}>
                ({(compressedSize / 1024).toFixed(0)}KB)
              </span>
            )}
          </span>
        )}
      </label>
      
      <div 
        className="image-upload-box" 
        onClick={!preview ? handleCameraCapture : undefined}
        style={{ 
          border: '2px dashed #ccc', 
          borderRadius: '8px', 
          padding: '20px', 
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          cursor: !preview ? 'pointer' : 'default',
          transition: 'all 0.3s',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (!preview) {
            e.currentTarget.style.borderColor = '#4CAF50';
            e.currentTarget.style.backgroundColor = '#f1f8e9';
          }
        }}
        onMouseLeave={(e) => {
          if (!preview) {
            e.currentTarget.style.borderColor = '#ccc';
            e.currentTarget.style.backgroundColor = '#f9f9f9';
          }
        }}
      >
        {preview ? (
          <div className="image-preview">
            <img 
              src={preview} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '200px', 
                borderRadius: '4px',
                marginBottom: '10px',
                opacity: (uploading || compressing) ? 0.6 : 1
              }} 
            />
            
            {/* Compression Status */}
            {compressing && (
              <div style={{
                padding: '8px',
                background: '#fff3cd',
                borderRadius: '4px',
                marginBottom: '10px',
                fontSize: '12px',
                color: '#856404'
              }}>
                📦 Compressing image...
              </div>
            )}
            
            {/* Upload Progress Bar */}
            {uploading && (
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#e0e0e0',
                borderRadius: '3px',
                marginBottom: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                  transition: 'width 0.3s ease',
                  borderRadius: '3px'
                }}></div>
              </div>
            )}
            
            {/* Upload Status */}
            {uploading && (
              <p style={{ fontSize: '12px', color: '#2196F3', marginBottom: '10px', fontWeight: '600' }}>
                ⏳ Uploading... {uploadProgress}%
              </p>
            )}
            
            {/* Success Message */}
            {uploadedUrl && !uploading && (
              <div style={{
                padding: '8px',
                background: '#d4edda',
                borderRadius: '4px',
                marginBottom: '10px',
                fontSize: '12px',
                color: '#155724'
              }}>
                ✅ Uploaded successfully!
                {compressedSize > 0 && originalSize > 0 && (
                  <div style={{ marginTop: '4px', fontSize: '11px' }}>
                    Size: {(originalSize / 1024).toFixed(0)}KB → {(compressedSize / 1024).toFixed(0)}KB 
                    ({((1 - compressedSize / originalSize) * 100).toFixed(0)}% smaller)
                  </div>
                )}
              </div>
            )}
            
            {/* Error Message */}
            {uploadError && (
              <p style={{ fontSize: '12px', color: '#f44336', marginBottom: '10px', padding: '8px', background: '#ffebee', borderRadius: '4px' }}>
                ⚠️ {uploadError}
              </p>
            )}
            
            <div>
              <button 
                type="button" 
                onClick={handleRemove}
                className="btn btn-danger btn-sm"
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
                disabled={uploading || compressing}
              >
                {(uploading || compressing) ? 'Processing...' : 'Remove'}
              </button>
            </div>
          </div>
        ) : (
          <div className="image-upload-placeholder">
            <div className="upload-icon" style={{ marginBottom: '10px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" fill="#2196F3"/>
                <path d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="#4CAF50"/>
              </svg>
            </div>
            <p style={{ marginBottom: '10px', color: '#1e3c72', fontSize: '16px', fontWeight: '600' }}>
              📸 Tap to Capture Photo
            </p>
            <p style={{ marginBottom: '0', color: '#666', fontSize: '13px' }}>
              Auto-compresses & uploads / स्वचालित अपलोड
            </p>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        required={required && !preview}
      />
      
      {fileName && (
        <p className="file-name" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          📄 {fileName}
        </p>
      )}
    </div>
  );
}

export default ImageUpload;
