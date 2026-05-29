import React from 'react';
import ImageUpload from './ImageUpload';

/**
 * Grouped Aadhaar Card Upload Component
 * Handles both front and back photos
 */
function AadhaarUploadGroup({ 
  title,
  type, // 'seller', 'buyer', 'driver', 'transporter'
  onFrontImageSelect,
  onBackImageSelect,
  required = true
}) {
  const handleFrontImageSelect = (imageData) => {
    onFrontImageSelect(imageData);
  };

  const handleBackImageSelect = (imageData) => {
    onBackImageSelect(imageData);
  };

  const getTypeLabel = () => {
    const labels = {
      seller: { en: 'Seller', hi: 'विक्रेता' },
      buyer: { en: 'Buyer', hi: 'क्रेता' },
      driver: { en: 'Driver', hi: 'चालक' },
      transporter: { en: 'Transporter', hi: 'परिवहनकर्ता' }
    };
    return labels[type] || { en: 'Person', hi: 'व्यक्ति' };
  };

  const label = getTypeLabel();

  return (
    <div style={{
      background: 'white',
      border: '2px solid #e0e0e0',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '25px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #f0f0f0'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          📄
        </div>
        <div>
          <h3 style={{ margin: 0, color: '#1e3c72', fontSize: '18px' }}>
            {title || `${label.en} Aadhaar Card / ${label.hi} आधार कार्ड`}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
            Upload both sides • दोनों तरफ अपलोड करें
            {required && <span style={{ color: '#f44336', marginLeft: '5px' }}>*</span>}
          </p>
        </div>
      </div>

      {/* Image Uploads */}
      <div className="aadhaar-uploads-grid">
        <ImageUpload
          label={`📄 Front Side / सामने की तरफ ${required ? '*' : ''}`}
          onImageSelect={handleFrontImageSelect}
          folder={`aadhaar/${type}/front`}
          required={required}
          accept="image/*"
          maxSizeKB={700}
          enableCompression={true}
        />
        
        <ImageUpload
          label={`📄 Back Side / पीछे की तरफ ${required ? '*' : ''}`}
          onImageSelect={handleBackImageSelect}
          folder={`aadhaar/${type}/back`}
          required={required}
          accept="image/*"
          maxSizeKB={700}
          enableCompression={true}
        />
      </div>

      <style>{`
        .aadhaar-uploads-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        @media (max-width: 768px) {
          .aadhaar-uploads-grid {
            grid-template-columns: 1fr !important;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default AadhaarUploadGroup;
