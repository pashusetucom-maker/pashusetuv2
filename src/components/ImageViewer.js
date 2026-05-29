import React from 'react';

function ImageViewer({ imageUrl, altText, onClose }) {
  if (!imageUrl) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        cursor: 'zoom-out'
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#333',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          zIndex: 10000
        }}
      >
        ×
      </button>

      {/* Image */}
      <img
        src={imageUrl}
        alt={altText}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '95%',
          maxHeight: '95%',
          objectFit: 'contain',
          borderRadius: '8px',
          boxShadow: '0 10px 50px rgba(0,0,0,0.5)',
          cursor: 'default'
        }}
      />

      {/* Image Title */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '10px 20px',
        borderRadius: '20px',
        color: '#333',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        {altText}
      </div>
    </div>
  );
}

export default ImageViewer;
