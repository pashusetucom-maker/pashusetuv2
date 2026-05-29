import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getReceiptById } from '../firebase/firestoreService';
import { calculateReceiptStatus } from '../utils/mockData';
import ImageViewer from './ImageViewer';

// Format Aadhaar number for display (XXXX XXXX XXXX)
const formatAadhaarForDisplay = (aadhaar) => {
  if (!aadhaar) return '';
  const cleaned = aadhaar.replace(/\s/g, '');
  return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
};

function VerifyReceipt() {
  const { receiptId } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenImageAlt, setFullscreenImageAlt] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [validUntilTime, setValidUntilTime] = useState('');

  // Calculate time remaining and valid until time
  useEffect(() => {
    if (!receipt) return;

    const calculateTimeRemaining = () => {
      const createdAt = receipt.createdAt?.toDate ? receipt.createdAt.toDate() : new Date(receipt.createdAt);
      // Set valid until to 5 PM (17:00) of the same day
      const validUntil = new Date(createdAt);
      validUntil.setHours(17, 0, 0, 0); // 5 PM
      const now = new Date();
      const diff = validUntil - now;

      // Set valid until time (formatted) - always 5 PM
      setValidUntilTime('05:00 PM');

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, expired: false });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [receipt]);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const receiptData = await getReceiptById(receiptId);
        
        if (receiptData) {
          const updatedReceipt = {
            ...receiptData,
            status: calculateReceiptStatus(receiptData)
          };
          setReceipt(updatedReceipt);
        }
      } catch (error) {
        console.error('Error fetching receipt:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading">Loading receipt details...</div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <h2 style={{ color: '#f44336', marginBottom: '20px' }}>Receipt Not Found</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            The receipt ID <strong>{receiptId}</strong> does not exist in the system.
          </p>
          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header no-print">
        <div className="header-content">
          <img src="/logo.png" alt="PashuSetu Logo" className="logo" />
          <h1>Receipt Verification</h1>
        </div>
      </div>

      <div className="container">
        {/* Digital Receipt Heading */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '20px',
          background: 'white',
          borderRadius: '8px',
          border: '2px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }} className="no-print">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px',
            marginBottom: '10px'
          }}>
            {/* Logo */}
            <img 
              src="/logo.png" 
              alt="PashuSetu Logo" 
              style={{ 
                height: '50px',
                width: 'auto'
              }} 
            />
            
            {/* Title */}
            <h1 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: 'bold',
              lineHeight: 1
            }}>
              <span style={{ color: '#2196F3' }}>Pashu</span>
              <span style={{ color: '#4CAF50' }}>Setu</span>
              <span style={{ color: '#1e3c72', fontSize: '24px', marginLeft: '8px' }}>Digital Receipt</span>
            </h1>
          </div>
          
          {/* Subtitle with SVG */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#666',
            fontWeight: '500'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#4CAF50"/>
            </svg>
            <span>पशुसेतु डिजिटल रसीद | Livestock Market Digital Receipt</span>
          </div>
        </div>

        {/* Thermal Receipt - 80mm */}
        <div className="compact-receipt">
          {/* Header: Logo → Text (Horizontal) */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', paddingBottom: '8px', borderBottom: '2px solid #000', marginBottom: '8px' }}>
            {/* Logo */}
            <div>
              <img src="/logo.png" alt="Logo" style={{ height: '70px', filter: 'grayscale(100%) contrast(1.2)' }} />
            </div>
            
            {/* Text */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#000', lineHeight: '1.2' }}>
                PashuSetu
              </div>
              <div style={{ fontSize: '15px', color: '#000', marginTop: '2px' }}>पशु बाजार डिजिटल रसीद</div>
            </div>
          </div>

          {/* Compact Info - Single Column */}
          <div className="compact-single-column">
            {/* Receipt ID at Top */}
            <div className="compact-item" style={{ borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '4px' }}>
              <span className="compact-label" style={{ maxWidth: '50%' }}>Receipt ID / रसीद ID:</span>
              <span className="compact-value">{receipt.id}</span>
            </div>
            
            <div className="compact-item">
              <span className="compact-label" style={{ maxWidth: '50%' }}>Market ID / बाजार ID:</span>
              <span className="compact-value">{receipt.marketId}</span>
            </div>
            
            <div className="compact-item">
              <span className="compact-label" style={{ maxWidth: '50%' }}>Admin ID / प्रशासक ID:</span>
              <span className="compact-value">{receipt.adminId || 'N/A'}</span>
            </div>
            
            <div className="compact-item">
              <span className="compact-label">Market / बाजार:</span>
              <span className="compact-value">{receipt.marketName}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label">Date / दिनांक:</span>
              <span className="compact-value">{new Date(receipt.date).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label">Time / समय:</span>
              <span className="compact-value">
                {new Date(receipt.createdAt?.toDate ? receipt.createdAt.toDate() : new Date(receipt.createdAt)).toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>
            <div className="compact-item">
              <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span>Valid for Transport</span>
                <span style={{ fontSize: '9px' }}>परिवहन वैधता</span>
              </span>
              <span className="compact-value">
                05:00 PM
              </span>
            </div>
            
            {/* Seller Details */}
            <div className="compact-item" style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px' }}>
              <span className="compact-label">Seller / विक्रेता:</span>
              <span className="compact-value">{receipt.sellerName}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label">Mobile / मोबाइल:</span>
              <span className="compact-value">{receipt.sellerMobile}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label">Aadhaar / आधार:</span>
              <span className="compact-value">{formatAadhaarForDisplay(receipt.sellerAadhar)}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label">Address / पता:</span>
              <span className="compact-value">{receipt.sellerAddress}{receipt.sellerState ? `, ${receipt.sellerState}` : ''}</span>
            </div>

            {/* Buyer Details */}
            <div className="compact-item" style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px' }}>
              <span className="compact-label">Buyer / क्रेता:</span>
              <span className="compact-value">{receipt.buyerName || 'N/A'}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label">Mobile / मोबाइल:</span>
              <span className="compact-value">{receipt.buyerMobile || 'N/A'}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label">Aadhaar / आधार:</span>
              <span className="compact-value">{formatAadhaarForDisplay(receipt.buyerAadhar) || 'N/A'}</span>
            </div>
            {receipt.buyerVillage && receipt.buyerTehsil && (
              <div className="compact-item">
                <span className="compact-label">Address / पता:</span>
                <span className="compact-value">Village {receipt.buyerVillage}, Tehsil {receipt.buyerTehsil}{receipt.buyerState ? `, ${receipt.buyerState}` : ''}</span>
              </div>
            )}

            {/* Animal Details */}
            <div className="compact-item" style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px' }}>
              <span className="compact-label">Animal / पशु:</span>
              <span className="compact-value">{receipt.animalType}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label">Count / संख्या:</span>
              <span className="compact-value">{receipt.animalCount}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label">Color / रंग:</span>
              <span className="compact-value">{receipt.animalColor}</span>
            </div>
            {receipt.earTagNumber && (
              <div className="compact-item">
                <span className="compact-label">Ear Tag / कान टैग:</span>
                <span className="compact-value">{receipt.earTagNumber}</span>
              </div>
            )}
            
            {/* Transport Details */}
            <div className="compact-item" style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px' }}>
              <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span>Transport</span>
                <span style={{ fontSize: '9px' }}>परिवहन</span>
              </span>
              <span className="compact-value">{receipt.transportMode === 'vehicle' ? 'Vehicle / वाहन' : 'Pedestrian / पैदल'}</span>
            </div>
            {receipt.transportMode === 'vehicle' ? (
              <>
                <div className="compact-item">
                  <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <span>Vehicle Number</span>
                    <span style={{ fontSize: '9px' }}>वाहन नंबर</span>
                  </span>
                  <span className="compact-value">{receipt.vehicleNumber}</span>
                </div>
                {receipt.vehicleOwnerName && (
                  <div className="compact-item">
                    <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span>Vehicle Owner</span>
                      <span style={{ fontSize: '9px' }}>वाहन मालिक</span>
                    </span>
                    <span className="compact-value">{receipt.vehicleOwnerName}</span>
                  </div>
                )}
                <div className="compact-item">
                  <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <span>Driver Name</span>
                    <span style={{ fontSize: '9px' }}>चालक का नाम</span>
                  </span>
                  <span className="compact-value">{receipt.driverName}</span>
                </div>
                <div className="compact-item">
                  <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <span>Driver Aadhaar</span>
                    <span style={{ fontSize: '9px' }}>चालक आधार</span>
                  </span>
                  <span className="compact-value">{formatAadhaarForDisplay(receipt.driverAadhar)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="compact-item">
                  <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <span>Transporter Name</span>
                    <span style={{ fontSize: '9px' }}>परिवहनकर्ता का नाम</span>
                  </span>
                  <span className="compact-value">{receipt.transporterName}</span>
                </div>
                <div className="compact-item">
                  <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <span>Transporter Aadhaar</span>
                    <span style={{ fontSize: '9px' }}>परिवहनकर्ता आधार</span>
                  </span>
                  <span className="compact-value">{formatAadhaarForDisplay(receipt.transporterAadhar)}</span>
                </div>
              </>
            )}
            <div className="compact-item">
              <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span>Route</span>
                <span style={{ fontSize: '9px' }}>मार्ग</span>
              </span>
              <span className="compact-value">{receipt.fromLocation} → {receipt.toLocation}</span>
            </div>
            
            {/* Payment Details */}
            <div className="compact-item" style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px' }}>
              <span className="compact-label">Price / मूल्य:</span>
              <span className="compact-value">₹{parseInt(receipt.animalPrice).toLocaleString()}</span>
            </div>
            <div className="compact-item">
              <span className="compact-label" style={{ maxWidth: '50%' }} >Reg. Fee / पंजी. शुल्क:</span>
              <span className="compact-value">₹{parseInt(receipt.registrationFee || receipt.marketFee).toLocaleString()}</span>
            </div>
            <div className="compact-item" style={{ fontWeight: 'bold', borderBottom: '2px solid #000' }}>
              <span className="compact-label">Total / कुल:</span>
              <span className="compact-value" style={{ fontWeight: 'bold' }}>₹{(parseInt(receipt.animalPrice) + parseInt(receipt.registrationFee || receipt.marketFee)).toLocaleString()}</span>
            </div>
          </div>

          {/* Signature Boxes */}
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #000' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '9px' }}>
              {/* Seller Signature */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold' }}>Seller Sign</div>
                  <div style={{ fontSize: '9px' }}>विक्रेता हस्ताक्षर</div>
                </div>
                <div style={{ border: '1px solid #000', width: '60%', height: '35px' }}></div>
              </div>
              
              {/* Buyer Signature */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold' }}>Buyer Sign</div>
                  <div style={{ fontSize: '9px' }}>क्रेता हस्ताक्षर</div>
                </div>
                <div style={{ border: '1px solid #000', width: '60%', height: '35px' }}></div>
              </div>
              
              {/* Registrar Signature */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold' }}>Registrar Sign</div>
                  <div style={{ fontSize: '9px' }}>रजिस्ट्रार हस्ताक्षर</div>
                </div>
                <div style={{ border: '1px solid #000', width: '60%', height: '35px' }}></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #000' }}>
            {/* QR Code at Bottom */}
            <div style={{ marginTop: '8px' }}>
              <QRCodeSVG 
                value={`${window.location.origin}/verify/${receipt.id}`}
                size={120}
                level="H"
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
              <div style={{ fontSize: '11px', color: '#000', marginTop: '8px', lineHeight: '1.6', fontWeight: 'bold' }}>
                • Scan QR to verify receipt online<br/>
                • Keep this receipt safe for verification<br/>
                • रसीद सत्यापन के लिए QR स्कैन करें
              </div>
            </div>

            {/* Rules and Regulations */}
            <div style={{ 
              marginTop: '12px', 
              paddingTop: '10px', 
              borderTop: '2px solid #000',
              textAlign: 'left',
              fontSize: '10px',
              lineHeight: '1.6',
              color: '#000'
            }}>
              <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '6px', fontSize: '11px' }}>
                ⚖️ नियम एवं शर्तें (म.प्र. के अनुसार):
              </div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• वैध डिजिटल रसीद व QR सत्यापन अनिवार्य है।</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• पशु क्रूरता निषेध है (मारना, ठेसना, घायल करना वर्जित)।</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• परिवहन के दौरान पर्याप्त स्थान, चारा व पानी देना अनिवार्य है।</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• एक वाहन में पशुओं की संख्या नियमानुसार सीमित रखें।</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• पशु स्वस्थ होने चाहिए; वैध फिटनेस प्रमाणपत्र आवश्यक है।</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• निर्धारित मार्ग (Route) से विचलन वर्जित है।</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• निर्धारित समय सीमा का पालन करें।</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• गलत/फर्जी जानकारी दंडनीय है।</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• जांच के समय QR स्कैन अनिवार्य है।</div>
              <div style={{ marginBottom: '6px', fontSize: '10px' }}>• पशुओं के साथ मानवीय व्यवहार रखें।</div>
              
              <div style={{ fontWeight: 'bold', marginTop: '6px', marginBottom: '4px', borderTop: '1px solid #000', paddingTop: '4px', fontSize: '11px' }}>
                🚶‍♂️ पैदल पशु परिवहन नियम:
              </div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• 1 व्यक्ति अधिकतम 2 पशु ही लेकर जा सकता है</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• पशुओं के बीच पर्याप्त दूरी (लगभग 3-4 फीट) रखें</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• एक साथ कई पशुओं को कसकर बांधना वर्जित है</div>
              <div style={{ marginBottom: '2px', fontSize: '10px' }}>• मारपीट/क्रूरता पूर्ण व्यवहार प्रतिबंधित है</div>
              <div style={{ fontSize: '10px' }}>• पानी व विश्राम देना आवश्यक है</div>
            </div>

            {/* Important Note - Bold & Prominent */}
            <div style={{ 
              marginTop: '12px', 
              paddingTop: '10px', 
              borderTop: '2px solid #000',
              textAlign: 'left',
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              border: '2px solid #000'
            }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: '#000', 
                lineHeight: '1.6',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '13px', marginBottom: '6px', textDecoration: 'underline' }}>
                  ⚠️ महत्वपूर्ण सूचना
                </div>
                <div style={{ fontSize: '11px', textAlign: 'justify' }}>
                  इस अवधि ({new Date(receipt.createdAt?.toDate ? receipt.createdAt.toDate() : new Date(receipt.createdAt)).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} से 05:00 PM) के भीतर पशु को उचित सुरक्षा और दिशा-निर्देशों के साथ गंतव्य तक ले जाएं। पशु क्रूरता निवारण अधिनियम का पालन अनिवार्य है, अन्यथा उचित कार्यवाही की जा सकती है।
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Images Section - Only visible on screen, not in print */}
        {(receipt.sellerSignatureUrl || receipt.buyerSignatureUrl || receipt.registrarSignatureUrl || 
          receipt.sellerAadhaarFrontPhotoUrl || receipt.sellerAadhaarBackPhotoUrl || 
          receipt.buyerAadhaarFrontPhotoUrl || receipt.buyerAadhaarBackPhotoUrl ||
          receipt.driverAadhaarFrontPhotoUrl || receipt.driverAadhaarBackPhotoUrl ||
          receipt.transporterAadhaarFrontPhotoUrl || receipt.transporterAadhaarBackPhotoUrl ||
          receipt.animalPhotoUrl || receipt.certificatePhotoUrl || receipt.khasraB1PhotoUrl ||
          receipt.transporterPhotoUrl || receipt.transportPermitPhotoUrl) && (
          <div className="card no-print" style={{ marginTop: '20px' }}>
            <h2 style={{ color: '#1e3c72', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#1e3c72"/>
              </svg>
              Documents & Images / दस्तावेज़ और फोटो
            </h2>
            
            {/* Signatures Section */}
            <h3 style={{ fontSize: '16px', color: '#666', marginBottom: '15px', marginTop: '10px', borderBottom: '2px solid #e0e0e0', paddingBottom: '8px' }}>
              📝 Digital Signatures / डिजिटल हस्ताक्षर
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              {receipt.sellerSignatureUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.sellerSignatureUrl === 'string' ? receipt.sellerSignatureUrl : receipt.sellerSignatureUrl?.url || '');
                  setFullscreenImageAlt('Seller Signature');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Seller / विक्रेता
                  </h4>
                  <img 
                    src={typeof receipt.sellerSignatureUrl === 'string' ? receipt.sellerSignatureUrl : receipt.sellerSignatureUrl?.url || ''} 
                    alt="Seller Signature" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Seller Signature');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '100px',
                      objectFit: 'contain',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      backgroundColor: '#fafafa',
                      padding: '5px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.buyerSignatureUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.buyerSignatureUrl === 'string' ? receipt.buyerSignatureUrl : receipt.buyerSignatureUrl?.url || '');
                  setFullscreenImageAlt('Buyer Signature');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Buyer / क्रेता
                  </h4>
                  <img 
                    src={typeof receipt.buyerSignatureUrl === 'string' ? receipt.buyerSignatureUrl : receipt.buyerSignatureUrl?.url || ''} 
                    alt="Buyer Signature" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Buyer Signature');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '100px',
                      objectFit: 'contain',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      backgroundColor: '#fafafa',
                      padding: '5px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.registrarSignatureUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.registrarSignatureUrl === 'string' ? receipt.registrarSignatureUrl : receipt.registrarSignatureUrl?.url || '');
                  setFullscreenImageAlt('Registrar Signature');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Registrar / रजिस्ट्रार
                  </h4>
                  <img 
                    src={typeof receipt.registrarSignatureUrl === 'string' ? receipt.registrarSignatureUrl : receipt.registrarSignatureUrl?.url || ''} 
                    alt="Registrar Signature" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Registrar Signature');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '100px',
                      objectFit: 'contain',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      backgroundColor: '#fafafa',
                      padding: '5px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}
            </div>

            {/* Documents Section */}
            <h3 style={{ fontSize: '16px', color: '#666', marginBottom: '15px', marginTop: '10px', borderBottom: '2px solid #e0e0e0', paddingBottom: '8px' }}>
              📄 Aadhaar Documents / आधार दस्तावेज़
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              {receipt.sellerAadhaarFrontPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.sellerAadhaarFrontPhotoUrl === 'string' ? receipt.sellerAadhaarFrontPhotoUrl : receipt.sellerAadhaarFrontPhotoUrl?.url || '');
                  setFullscreenImageAlt('Seller Aadhaar Front');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Seller Aadhaar Front / विक्रेता आधार फ्रंट
                  </h4>
                  <img 
                    src={typeof receipt.sellerAadhaarFrontPhotoUrl === 'string' ? receipt.sellerAadhaarFrontPhotoUrl : receipt.sellerAadhaarFrontPhotoUrl?.url || ''} 
                    alt="Seller Aadhaar Front" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Seller Aadhaar Front photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.sellerAadhaarBackPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.sellerAadhaarBackPhotoUrl === 'string' ? receipt.sellerAadhaarBackPhotoUrl : receipt.sellerAadhaarBackPhotoUrl?.url || '');
                  setFullscreenImageAlt('Seller Aadhaar Back');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Seller Aadhaar Back / विक्रेता आधार बैक
                  </h4>
                  <img 
                    src={typeof receipt.sellerAadhaarBackPhotoUrl === 'string' ? receipt.sellerAadhaarBackPhotoUrl : receipt.sellerAadhaarBackPhotoUrl?.url || ''} 
                    alt="Seller Aadhaar Back" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Seller Aadhaar Back photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.buyerAadhaarFrontPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.buyerAadhaarFrontPhotoUrl === 'string' ? receipt.buyerAadhaarFrontPhotoUrl : receipt.buyerAadhaarFrontPhotoUrl?.url || '');
                  setFullscreenImageAlt('Buyer Aadhaar Front');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Buyer Aadhaar Front / क्रेता आधार फ्रंट
                  </h4>
                  <img 
                    src={typeof receipt.buyerAadhaarFrontPhotoUrl === 'string' ? receipt.buyerAadhaarFrontPhotoUrl : receipt.buyerAadhaarFrontPhotoUrl?.url || ''} 
                    alt="Buyer Aadhaar Front" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Buyer Aadhaar Front photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.buyerAadhaarBackPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.buyerAadhaarBackPhotoUrl === 'string' ? receipt.buyerAadhaarBackPhotoUrl : receipt.buyerAadhaarBackPhotoUrl?.url || '');
                  setFullscreenImageAlt('Buyer Aadhaar Back');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Buyer Aadhaar Back / क्रेता आधार बैक
                  </h4>
                  <img 
                    src={typeof receipt.buyerAadhaarBackPhotoUrl === 'string' ? receipt.buyerAadhaarBackPhotoUrl : receipt.buyerAadhaarBackPhotoUrl?.url || ''} 
                    alt="Buyer Aadhaar Back" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Buyer Aadhaar Back photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}
            </div>

            {/* Animal & Certificates Section */}
            <h3 style={{ fontSize: '16px', color: '#666', marginBottom: '15px', marginTop: '10px', borderBottom: '2px solid #e0e0e0', paddingBottom: '8px' }}>
              🐄 Animal & Certificates / पशु और प्रमाणपत्र
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              {receipt.animalPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.animalPhotoUrl === 'string' ? receipt.animalPhotoUrl : receipt.animalPhotoUrl?.url || '');
                  setFullscreenImageAlt('Animal Photo');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Animal Photo / पशु की फोटो
                  </h4>
                  <img 
                    src={typeof receipt.animalPhotoUrl === 'string' ? receipt.animalPhotoUrl : receipt.animalPhotoUrl?.url || ''} 
                    alt="Animal" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Animal photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.certificatePhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.certificatePhotoUrl === 'string' ? receipt.certificatePhotoUrl : receipt.certificatePhotoUrl?.url || '');
                  setFullscreenImageAlt('Fitness Certificate');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Fitness Certificate / फिटनेस सर्टिफिकेट
                  </h4>
                  <img 
                    src={typeof receipt.certificatePhotoUrl === 'string' ? receipt.certificatePhotoUrl : receipt.certificatePhotoUrl?.url || ''} 
                    alt="Fitness Certificate" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Certificate photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.khasraB1PhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.khasraB1PhotoUrl === 'string' ? receipt.khasraB1PhotoUrl : receipt.khasraB1PhotoUrl?.url || '');
                  setFullscreenImageAlt('Khasra/B-1/KCC Document');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Khasra/B-1/KCC / खसरा/B-1/KCC
                  </h4>
                  <img 
                    src={typeof receipt.khasraB1PhotoUrl === 'string' ? receipt.khasraB1PhotoUrl : receipt.khasraB1PhotoUrl?.url || ''} 
                    alt="Khasra/B-1/KCC" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Khasra/B-1/KCC photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}
            </div>

            {/* Transport Documents Section */}
            <h3 style={{ fontSize: '16px', color: '#666', marginBottom: '15px', marginTop: '10px', borderBottom: '2px solid #e0e0e0', paddingBottom: '8px' }}>
              🚚 Transport Documents / परिवहन दस्तावेज़
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              {/* Vehicle RC Photo - for vehicle mode */}
              {receipt.vehicleRCPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.vehicleRCPhotoUrl === 'string' ? receipt.vehicleRCPhotoUrl : receipt.vehicleRCPhotoUrl?.url || '');
                  setFullscreenImageAlt('Vehicle RC (Registration Certificate)');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    🚗 Vehicle RC / वाहन RC [COMPULSORY]
                  </h4>
                  <img 
                    src={typeof receipt.vehicleRCPhotoUrl === 'string' ? receipt.vehicleRCPhotoUrl : receipt.vehicleRCPhotoUrl?.url || ''} 
                    alt="Vehicle RC" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Vehicle RC photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {/* Driver Aadhaar Photos - for vehicle mode */}
              {receipt.driverAadhaarFrontPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.driverAadhaarFrontPhotoUrl === 'string' ? receipt.driverAadhaarFrontPhotoUrl : receipt.driverAadhaarFrontPhotoUrl?.url || '');
                  setFullscreenImageAlt('Driver Aadhaar Front');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Driver Aadhaar Front / चालक आधार फ्रंट
                  </h4>
                  <img 
                    src={typeof receipt.driverAadhaarFrontPhotoUrl === 'string' ? receipt.driverAadhaarFrontPhotoUrl : receipt.driverAadhaarFrontPhotoUrl?.url || ''} 
                    alt="Driver Aadhaar Front" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Driver Aadhaar Front photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.driverAadhaarBackPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.driverAadhaarBackPhotoUrl === 'string' ? receipt.driverAadhaarBackPhotoUrl : receipt.driverAadhaarBackPhotoUrl?.url || '');
                  setFullscreenImageAlt('Driver Aadhaar Back');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Driver Aadhaar Back / चालक आधार बैक
                  </h4>
                  <img 
                    src={typeof receipt.driverAadhaarBackPhotoUrl === 'string' ? receipt.driverAadhaarBackPhotoUrl : receipt.driverAadhaarBackPhotoUrl?.url || ''} 
                    alt="Driver Aadhaar Back" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Driver Aadhaar Back photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {/* Transporter Aadhaar Photos - for pedestrian mode */}
              {receipt.transporterAadhaarFrontPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.transporterAadhaarFrontPhotoUrl === 'string' ? receipt.transporterAadhaarFrontPhotoUrl : receipt.transporterAadhaarFrontPhotoUrl?.url || '');
                  setFullscreenImageAlt('Transporter Aadhaar Front');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Transporter Aadhaar Front / परिवहनकर्ता आधार फ्रंट
                  </h4>
                  <img 
                    src={typeof receipt.transporterAadhaarFrontPhotoUrl === 'string' ? receipt.transporterAadhaarFrontPhotoUrl : receipt.transporterAadhaarFrontPhotoUrl?.url || ''} 
                    alt="Transporter Aadhaar Front" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Transporter Aadhaar Front photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.transporterAadhaarBackPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.transporterAadhaarBackPhotoUrl === 'string' ? receipt.transporterAadhaarBackPhotoUrl : receipt.transporterAadhaarBackPhotoUrl?.url || '');
                  setFullscreenImageAlt('Transporter Aadhaar Back');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Transporter Aadhaar Back / परिवहनकर्ता आधार बैक
                  </h4>
                  <img 
                    src={typeof receipt.transporterAadhaarBackPhotoUrl === 'string' ? receipt.transporterAadhaarBackPhotoUrl : receipt.transporterAadhaarBackPhotoUrl?.url || ''} 
                    alt="Transporter Aadhaar Back" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Transporter Aadhaar Back photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.transporterPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.transporterPhotoUrl === 'string' ? receipt.transporterPhotoUrl : receipt.transporterPhotoUrl?.url || '');
                  setFullscreenImageAlt('Transporter/Driver Photo');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Transporter/Driver / परिवहनकर्ता/चालक
                  </h4>
                  <img 
                    src={typeof receipt.transporterPhotoUrl === 'string' ? receipt.transporterPhotoUrl : receipt.transporterPhotoUrl?.url || ''} 
                    alt="Transporter/Driver" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Transporter photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}

              {receipt.transportPermitPhotoUrl && (
                <div style={{ 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onClick={() => {
                  setFullscreenImage(typeof receipt.transportPermitPhotoUrl === 'string' ? receipt.transportPermitPhotoUrl : receipt.transportPermitPhotoUrl?.url || '');
                  setFullscreenImageAlt('Transport Permit');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#1e3c72', fontWeight: '600' }}>
                    Transport Permit / परिवहन परमिट
                  </h4>
                  <img 
                    src={typeof receipt.transportPermitPhotoUrl === 'string' ? receipt.transportPermitPhotoUrl : receipt.transportPermitPhotoUrl?.url || ''} 
                    alt="Transport Permit" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load Transport Permit photo');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    style={{ 
                      maxWidth: '100%', 
                      height: '140px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ display: 'none', color: '#f44336', padding: '10px', fontSize: '11px' }}>
                    ❌ Failed to load
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Print Button - Compact with SVG */}
        <div style={{ marginTop: '20px', textAlign: 'center' }} className="no-print">
          <button 
            onClick={() => window.print()} 
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 8H5C3.34 8 2 9.34 2 11V17H6V21H18V17H22V11C22 9.34 20.66 8 19 8ZM16 19H8V14H16V19ZM19 12C18.45 12 18 11.55 18 11C18 10.45 18.45 10 19 10C19.55 10 20 10.45 20 11C20 11.55 19.55 12 19 12ZM18 3H6V7H18V3Z" fill="white"/>
            </svg>
            Print Receipt
          </button>
        </div>

        {/* Validity Timer Card - Professional Box Style */}
        {timeRemaining && (
          <div className="no-print" style={{
            background: '#f5f5f5',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '20px',
            border: '2px solid #000',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '12px',
              paddingBottom: '10px',
              borderBottom: '2px solid #000'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="#000"/>
                </svg>
                <span style={{ textDecoration: 'underline' }}>
                  रसीद परिवहन के लिए दिए गए समय तक ही वैध है<br/>
                  <span style={{ fontSize: '11px' }}>Receipt Valid for Transport Within Given Time Only</span>
                </span>
              </div>
            </div>

            {/* Content Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 768 ? 'repeat(3, 1fr)' : '1fr',
              gap: '15px',
              marginBottom: '12px'
            }}>
              {/* Timer Display */}
              <div style={{ 
                textAlign: 'center',
                padding: '10px',
                background: timeRemaining.expired ? '#ffebee' : '#e8f5e9',
                borderRadius: '6px',
                border: timeRemaining.expired ? '2px solid #f44336' : '2px solid #4CAF50'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  color: '#000', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}>
                  {timeRemaining.expired ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#f44336"/>
                      </svg>
                      समाप्त / EXPIRED
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 1H9V3H15V1ZM11 14H13V8H11V14ZM19.03 7.39L20.45 5.97C20.02 5.46 19.55 4.98 19.04 4.56L17.62 5.98C16.07 4.74 14.12 4 12 4C7.03 4 3 8.03 3 13C3 17.97 7.02 22 12 22C16.98 22 21 17.97 21 13C21 10.88 20.26 8.93 19.03 7.39ZM12 20C8.13 20 5 16.87 5 13C5 9.13 8.13 6 12 6C15.87 6 19 9.13 19 13C19 16.87 15.87 20 12 20Z" fill="#4CAF50"/>
                      </svg>
                      शेष समय / TIME LEFT
                    </>
                  )}
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  color: timeRemaining.expired ? '#f44336' : '#4CAF50',
                  display: 'flex',
                  gap: '5px',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    background: 'rgba(0, 0, 0, 0.05)', 
                    padding: '5px 8px', 
                    borderRadius: '4px',
                    minWidth: '40px'
                  }}>
                    {String(timeRemaining.hours).padStart(2, '0')}
                    <div style={{ fontSize: '9px', color: '#666' }}>HRS</div>
                  </div>
                  <span style={{ fontSize: '16px' }}>:</span>
                  <div style={{ 
                    background: 'rgba(0, 0, 0, 0.05)', 
                    padding: '5px 8px', 
                    borderRadius: '4px',
                    minWidth: '40px'
                  }}>
                    {String(timeRemaining.minutes).padStart(2, '0')}
                    <div style={{ fontSize: '9px', color: '#666' }}>MIN</div>
                  </div>
                  <span style={{ fontSize: '16px' }}>:</span>
                  <div style={{ 
                    background: 'rgba(0, 0, 0, 0.05)', 
                    padding: '5px 8px', 
                    borderRadius: '4px',
                    minWidth: '40px'
                  }}>
                    {String(timeRemaining.seconds).padStart(2, '0')}
                    <div style={{ fontSize: '9px', color: '#666' }}>SEC</div>
                  </div>
                </div>
              </div>

              {/* Valid Until Time */}
              <div style={{ 
                textAlign: 'center',
                padding: '10px',
                background: '#fff3e0',
                borderRadius: '6px',
                border: '2px solid #FF9800'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  color: '#000', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM16.2 16.2L11 13V7H12.5V12.2L17 14.9L16.2 16.2Z" fill="#FF9800"/>
                  </svg>
                  समय सीमा / TIME LIMIT
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF9800' }}>
                  {validUntilTime}
                </div>
                <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                  {new Date(receipt.createdAt?.toDate ? receipt.createdAt.toDate() : new Date(receipt.createdAt)).toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
                <div style={{ 
                  fontSize: '9px', 
                  color: '#d84315', 
                  marginTop: '6px',
                  fontWeight: 'bold',
                  lineHeight: '1.4',
                  padding: '4px',
                  background: 'rgba(255, 87, 34, 0.1)',
                  borderRadius: '3px'
                }}>
                  इस समय अवधि के भीतर पशु को गंतव्य तक पहुंचाना अनिवार्य है, अन्यथा कार्यवाही हो सकती है।
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ 
                textAlign: 'center',
                padding: '10px',
                background: '#e3f2fd',
                borderRadius: '6px',
                border: '2px solid #2196F3'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  color: '#000', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#2196F3"/>
                  </svg>
                  स्थिति / STATUS
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 16px',
                  background: timeRemaining.expired ? '#f44336' : '#4CAF50',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {timeRemaining.expired ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="white"/>
                      </svg>
                      EXPIRED
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="white"/>
                      </svg>
                      VALID
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Guidelines Section */}
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '6px',
              border: '2px solid #000',
              marginTop: '10px'
            }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: '#000',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
                textDecoration: 'underline'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L1 21H23L12 2ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="#FF9800"/>
                </svg>
                ⚖️ नियम एवं शर्तें | Terms & Conditions (As per M.P. Regulations)
              </div>
              
              <div style={{ fontSize: '9px', color: '#000', lineHeight: '1.7', textAlign: 'justify' }}>
                <strong>1.</strong> <strong>हिंदी:</strong> वैध डिजिटल रसीद एवं QR कोड सत्यापन अनिवार्य है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> A valid digital receipt along with QR code verification is mandatory at all times.<br/>
                
                <strong>2.</strong> <strong>हिंदी:</strong> पशुओं के प्रति किसी भी प्रकार की क्रूरता (मारना, ठेस पहुँचाना, घायल करना) पूर्णतः प्रतिबंधित है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Any form of animal cruelty (beating, injuring, or causing harm) is strictly prohibited.<br/>
                
                <strong>3.</strong> <strong>हिंदी:</strong> परिवहन के दौरान पशुओं को पर्याप्त स्थान, चारा एवं स्वच्छ पानी उपलब्ध कराना अनिवार्य है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Adequate space, proper feed, and clean drinking water must be ensured for animals during transportation.<br/>
                
                <strong>4.</strong> <strong>हिंदी:</strong> एक वाहन में पशुओं की संख्या निर्धारित नियमों के अनुसार सीमित रखी जानी चाहिए।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> The number of animals per vehicle must be restricted as per prescribed regulations.<br/>
                
                <strong>5.</strong> <strong>हिंदी:</strong> पशु स्वस्थ होने चाहिए तथा वैध फिटनेस प्रमाणपत्र होना आवश्यक है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Animals must be in good health and possess a valid fitness certificate.<br/>
                
                <strong>6.</strong> <strong>हिंदी:</strong> निर्धारित मार्ग (रूट) का पालन करना अनिवार्य है; मार्ग से विचलन वर्जित है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> The designated route must be strictly followed; deviation is not permitted.<br/>
                
                <strong>7.</strong> <strong>हिंदी:</strong> निर्धारित समय सीमा का पालन करना आवश्यक है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Compliance with the prescribed time limit is mandatory.<br/>
                
                <strong>8.</strong> <strong>हिंदी:</strong> गलत या फर्जी जानकारी देना दंडनीय अपराध है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Providing false or misleading information is punishable under law.<br/>
                
                <strong>9.</strong> <strong>हिंदी:</strong> निरीक्षण/जांच के समय QR कोड स्कैन कराना अनिवार्य है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> QR code scanning is compulsory during inspection or verification.<br/>
                
                <strong>10.</strong> <strong>हिंदी:</strong> पशुओं के साथ मानवीय एवं संवेदनशील व्यवहार किया जाना चाहिए।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Animals must be treated in a humane and compassionate manner.<br/>
                
                <div style={{ 
                  marginTop: '10px', 
                  paddingTop: '8px', 
                  borderTop: '2px solid #000',
                  fontWeight: 'bold'
                }}>
                  🚶‍♂️ पैदल पशु परिवहन नियम | Rules for Transporting Animals on Foot
                </div>
                
                <strong>1.</strong> <strong>हिंदी:</strong> एक व्यक्ति अधिकतम 2 पशु ही साथ ले जा सकता है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> One person is allowed to handle a maximum of two animals.<br/>
                
                <strong>2.</strong> <strong>हिंदी:</strong> पशुओं के बीच पर्याप्त दूरी (लगभग 3–4 फीट) बनाए रखना आवश्यक है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Adequate spacing (approximately 3–4 feet) between animals must be maintained.<br/>
                
                <strong>3.</strong> <strong>हिंदी:</strong> एक साथ कई पशुओं को कसकर बांधना पूर्णतः वर्जित है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Tying multiple animals tightly together is strictly prohibited.<br/>
                
                <strong>4.</strong> <strong>हिंदी:</strong> मारपीट या क्रूर व्यवहार पूरी तरह प्रतिबंधित है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Any form of beating or cruel treatment is completely forbidden.<br/>
                
                <strong>5.</strong> <strong>हिंदी:</strong> पशुओं को नियमित रूप से पानी एवं विश्राम उपलब्ध कराना अनिवार्य है।<br/>
                <strong style={{ marginLeft: '12px' }}>English:</strong> Animals must be provided with water and adequate rest at regular intervals.<br/>
                
                <div style={{ 
                  marginTop: '10px', 
                  paddingTop: '8px', 
                  borderTop: '2px solid #f44336',
                  background: '#ffebee',
                  padding: '8px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  color: '#d32f2f'
                }}>
                  ⚠️ अनुपालन | Compliance Note<br/>
                  <span style={{ fontSize: '9px', color: '#000', fontWeight: 'normal' }}>
                    <strong>हिंदी:</strong> उपरोक्त नियमों का उल्लंघन होने पर विधि अनुसार कार्यवाही की जाएगी।<br/>
                    <strong>English:</strong> Any violation of the above rules will invite legal action as per applicable laws.
                  </span>
                </div>
                
                <div style={{ 
                  marginTop: '8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  color: '#2196F3'
                }}>
                  📞 Helpline: XXXXXXXX
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Image Viewer */}
      {fullscreenImage && (
        <ImageViewer
          imageUrl={fullscreenImage}
          altText={fullscreenImageAlt}
          onClose={() => setFullscreenImage(null)}
        />
      )}
    </div>
  );
}

export default VerifyReceipt;
