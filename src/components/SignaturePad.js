import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

function SignaturePad({ label, onSignatureChange, required = false }) {
  const sigCanvas = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigCanvas.current.clear();
    setIsEmpty(true);
    onSignatureChange(null);
  };

  const handleEnd = () => {
    if (!sigCanvas.current.isEmpty()) {
      setIsEmpty(false);
      const dataURL = sigCanvas.current.toDataURL();
      onSignatureChange(dataURL);
    }
  };

  return (
    <div className="signature-pad-container" style={{ marginBottom: '20px' }}>
      <label className="signature-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      
      <div className="signature-canvas-wrapper" style={{ 
        border: '2px solid #ccc', 
        borderRadius: '8px', 
        display: 'inline-block',
        backgroundColor: 'white'
      }}>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'signature-canvas',
            width: 400,
            height: 150,
            style: { border: 'none' }
          }}
          onEnd={handleEnd}
        />
      </div>
      
      <div>
        <button 
          type="button" 
          onClick={handleClear}
          className="btn btn-secondary btn-sm"
          style={{ 
            marginTop: '10px',
            padding: '5px 15px',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Signature
        </button>
      </div>
      
      {required && isEmpty && (
        <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
          Signature is required
        </p>
      )}
    </div>
  );
}

export default SignaturePad;
