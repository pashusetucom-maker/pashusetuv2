import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { createReceipt } from '../firebase/firestoreService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadBase64ToCloudinary } from '../utils/cloudinaryService';
import { INDIAN_STATES } from '../utils/indianStates';
import ImageUpload from './ImageUpload';
import AadhaarUploadGroup from './AadhaarUploadGroup';
import SignaturePad from './SignaturePad';
import ImageViewer from './ImageViewer';
import Header from './Header';

function CreateReceipt() {
  const { user } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenImageAlt, setFullscreenImageAlt] = useState('');
  
  // Helper function to format Aadhaar number for display
  const formatAadhaarForDisplay = (aadhaar) => {
    if (!aadhaar) return '';
    // Remove any existing spaces
    const digitsOnly = aadhaar.replace(/\s/g, '');
    // Format as XXXX XXXX XXXX
    return digitsOnly.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  };
  
  const [formData, setFormData] = useState({
    sellerName: '',
    sellerMobile: '',
    sellerAadhar: '',
    sellerVillage: '',
    sellerTehsil: '',
    sellerState: 'Madhya Pradesh', // Default state
    sellerKhasra: '',
    buyerName: '',
    buyerMobile: '',
    buyerAadhar: '',
    buyerVillage: '',
    buyerTehsil: '',
    buyerState: 'Madhya Pradesh', // Default state
    buyerKhasra: '',
    animalType: 'Cow',
    animalCount: 1,
    animalColor: '',
    earTagNumber: '',
    transportMode: 'vehicle', // 'vehicle' or 'pedestrian'
    vehicleNumber: '',
    vehicleOwnerName: '', // New field
    driverName: '',
    driverAadhar: '',
    transporterName: '',
    transporterAadhar: '',
    fromLocation: '',
    toLocation: '',
    animalPrice: '',
    registrationFee: ''
  });

  // Image and signature states (updated for background upload)
  const [sellerSignature, setSellerSignature] = useState(null);
  const [buyerSignature, setBuyerSignature] = useState(null);
  const [registrarSignature, setRegistrarSignature] = useState(null);
  
  // Grouped Aadhaar states
  const [sellerAadhaarFrontPhoto, setSellerAadhaarFrontPhoto] = useState(null);
  const [sellerAadhaarBackPhoto, setSellerAadhaarBackPhoto] = useState(null);
  const [buyerAadhaarFrontPhoto, setBuyerAadhaarFrontPhoto] = useState(null);
  const [buyerAadhaarBackPhoto, setBuyerAadhaarBackPhoto] = useState(null);
  const [driverAadhaarFrontPhoto, setDriverAadhaarFrontPhoto] = useState(null);
  const [driverAadhaarBackPhoto, setDriverAadhaarBackPhoto] = useState(null);
  const [transporterAadhaarFrontPhoto, setTransporterAadhaarFrontPhoto] = useState(null);
  const [transporterAadhaarBackPhoto, setTransporterAadhaarBackPhoto] = useState(null);
  
  // Other document states
  const [animalPhoto, setAnimalPhoto] = useState(null);
  const [certificatePhoto, setCertificatePhoto] = useState(null);
  const [sellerKhasraPhoto, setSellerKhasraPhoto] = useState(null);
  const [buyerKhasraPhoto, setBuyerKhasraPhoto] = useState(null);
  const [transportPermitPhoto, setTransportPermitPhoto] = useState(null);
  const [vehicleRCPhoto, setVehicleRCPhoto] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format Aadhaar numbers with spaces (XXXX XXXX XXXX)
    if (name === 'sellerAadhar' || name === 'buyerAadhar' || name === 'driverAadhar' || name === 'transporterAadhar') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '');
      
      // Limit to 12 digits
      const limitedDigits = digitsOnly.slice(0, 12);
      
      // Format with spaces: XXXX XXXX XXXX
      let formatted = '';
      for (let i = 0; i < limitedDigits.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formatted += ' ';
        }
        formatted += limitedDigits[i];
      }
      
      setFormData({
        ...formData,
        [name]: formatted
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user || !user.uid) {
      alert('कृपया पहले login करें / Please login first');
      return;
    }
    
    // Check market hours from Firebase
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'marketHours'));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        
        // Check if markets are enabled
        if (!settings.isEnabled) {
          alert('बाजार बंद है। रसीद जारी करना वर्तमान में अक्षम है।\n\nMarket is closed. Receipt issuance is currently disabled.');
          return;
        }
        
        // Check if current time is within operating hours
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        
        // Convert time strings to minutes for accurate comparison
        const timeToMinutes = (timeStr) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        const currentMinutes = timeToMinutes(currentTime);
        const openMinutes = timeToMinutes(settings.openTime);
        const closeMinutes = timeToMinutes(settings.closeTime);
        
        if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
          alert(`बाजार बंद है। रसीद केवल ${settings.openTime} से ${settings.closeTime} के बीच बनाई जा सकती है।\n\nMarket is closed. Receipts can only be created between ${settings.openTime} and ${settings.closeTime}.`);
          return;
        }
      } else {
        // Default check if settings don't exist
        const now = new Date();
        const currentHour = now.getHours();
        if (currentHour < 8 || currentHour >= 16) {
          alert('बाजार बंद है। रसीद केवल 08:00 से 16:00 के बीच बनाई जा सकती है।\n\nMarket is closed. Receipts can only be created between 08:00 and 16:00.');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking market hours:', error);
      // Continue with receipt creation if there's an error fetching settings
    }

    // Validate ear tag number (compulsory)
    if (!formData.earTagNumber || formData.earTagNumber.trim() === '') {
      alert('कृपया कान टैग नंबर दर्ज करें / Please enter ear tag number (Compulsory)');
      return;
    }

    // Validate Khasra numbers (compulsory for both seller and buyer)
    if (!formData.sellerKhasra || formData.sellerKhasra.trim() === '') {
      alert('कृपया विक्रेता का खसरा नंबर दर्ज करें / Please enter Seller Khasra number (Compulsory)');
      return;
    }

    if (!formData.buyerKhasra || formData.buyerKhasra.trim() === '') {
      alert('कृपया क्रेता का खसरा नंबर दर्ज करें / Please enter Buyer Khasra number (Compulsory)');
      return;
    }

    // Validate Seller Aadhaar (Compulsory) - Check if uploaded
    if (!sellerAadhaarFrontPhoto || !sellerAadhaarFrontPhoto.uploaded) {
      alert('कृपया विक्रेता का आधार फ्रंट फोटो upload होने दें / Please wait for Seller Aadhaar front photo to upload');
      return;
    }

    if (!sellerAadhaarBackPhoto || !sellerAadhaarBackPhoto.uploaded) {
      alert('कृपया विक्रेता का आधार बैक फोटो upload होने दें / Please wait for Seller Aadhaar back photo to upload');
      return;
    }

    // Validate Buyer Aadhaar (Compulsory) - Check if uploaded
    if (!buyerAadhaarFrontPhoto || !buyerAadhaarFrontPhoto.uploaded) {
      alert('कृपया क्रेता का आधार फ्रंट फोटो upload होने दें / Please wait for Buyer Aadhaar front photo to upload');
      return;
    }

    if (!buyerAadhaarBackPhoto || !buyerAadhaarBackPhoto.uploaded) {
      alert('कृपया क्रेता का आधार बैक फोटो upload होने दें / Please wait for Buyer Aadhaar back photo to upload');
      return;
    }

    // Validate Seller Khasra/B-1/KCC photo (Mandatory)
    if (!sellerKhasraPhoto || !sellerKhasraPhoto.uploaded) {
      alert('कृपया विक्रेता का खसरा/B-1/KCC दस्तावेज़ upload करें / Please upload Seller Khasra/B-1/KCC document (Compulsory)');
      return;
    }

    // Validate Buyer Khasra/B-1/KCC photo (Mandatory)
    if (!buyerKhasraPhoto || !buyerKhasraPhoto.uploaded) {
      alert('कृपया क्रेता का खसरा/B-1/KCC दस्तावेज़ upload करें / Please upload Buyer Khasra/B-1/KCC document (Compulsory)');
      return;
    }

    if (!animalPhoto || !animalPhoto.uploaded) {
      alert('कृपया पशु की फोटो upload होने दें / Please wait for animal photo to upload');
      return;
    }

    if (!certificatePhoto || !certificatePhoto.uploaded) {
      alert('कृपया फिटनेस सर्टिफिकेट upload होने दें / Please wait for fitness certificate to upload');
      return;
    }

    // Validate transport details based on mode
    if (formData.transportMode === 'vehicle') {
      if (!formData.vehicleNumber || formData.vehicleNumber.trim() === '') {
        alert('कृपया वाहन नंबर दर्ज करें / Please enter vehicle number');
        return;
      }
      if (!formData.vehicleOwnerName || formData.vehicleOwnerName.trim() === '') {
        alert('कृपया वाहन मालिक का नाम दर्ज करें / Please enter vehicle owner name');
        return;
      }
      if (!vehicleRCPhoto || !vehicleRCPhoto.uploaded) {
        alert('कृपया वाहन RC upload होने दें / Please wait for vehicle RC to upload');
        return;
      }
      if (!formData.driverName || formData.driverName.trim() === '') {
        alert('कृपया चालक का नाम दर्ज करें / Please enter driver name');
        return;
      }
      if (!formData.driverAadhar || formData.driverAadhar.trim() === '') {
        alert('कृपया चालक का आधार नंबर दर्ज करें / Please enter driver Aadhaar number');
        return;
      }
      if (!driverAadhaarFrontPhoto || !driverAadhaarFrontPhoto.uploaded) {
        alert('कृपया चालक का आधार फ्रंट फोटो upload होने दें / Please wait for driver Aadhaar front photo to upload');
        return;
      }
      if (!driverAadhaarBackPhoto || !driverAadhaarBackPhoto.uploaded) {
        alert('कृपया चालक का आधार बैक फोटो upload होने दें / Please wait for driver Aadhaar back photo to upload');
        return;
      }
      if (!transportPermitPhoto || !transportPermitPhoto.uploaded) {
        alert('कृपया परिवहन परमिट फोटो upload होने दें / Please wait for transport permit photo to upload');
        return;
      }
    } else if (formData.transportMode === 'pedestrian') {
      if (!formData.transporterName || formData.transporterName.trim() === '') {
        alert('कृपया परिवहनकर्ता का नाम दर्ज करें / Please enter transporter name');
        return;
      }
      if (!formData.transporterAadhar || formData.transporterAadhar.trim() === '') {
        alert('कृपया परिवहनकर्ता का आधार नंबर दर्ज करें / Please enter transporter Aadhaar number');
        return;
      }
      if (!transporterAadhaarFrontPhoto || !transporterAadhaarFrontPhoto.uploaded) {
        alert('कृपया परिवहनकर्ता का आधार फ्रंट फोटो upload होने दें / Please wait for transporter Aadhaar front photo to upload');
        return;
      }
      if (!transporterAadhaarBackPhoto || !transporterAadhaarBackPhoto.uploaded) {
        alert('कृपया परिवहनकर्ता का आधार बैक फोटो upload होने दें / Please wait for transporter Aadhaar back photo to upload');
        return;
      }
    }

    setLoading(true);

    try {
      const now = new Date();
      // Set expiry time to 5 PM (17:00) of the same day
      const expiryTime = new Date(now);
      expiryTime.setHours(17, 0, 0, 0); // 5 PM

      // Generate short receipt ID (8 characters)
      const shortReceiptId = `PS${Date.now().toString().slice(-6)}`;

      console.log('✅ All images already uploaded! Creating receipt...');
      
      // Remove spaces from Aadhaar numbers before saving
      const cleanedFormData = {
        ...formData,
        sellerAadhar: formData.sellerAadhar.replace(/\s/g, ''),
        buyerAadhar: formData.buyerAadhar.replace(/\s/g, ''),
        driverAadhar: formData.driverAadhar ? formData.driverAadhar.replace(/\s/g, '') : '',
        transporterAadhar: formData.transporterAadhar ? formData.transporterAadhar.replace(/\s/g, '') : ''
      };
      
      // Upload signatures (optional)
      let sellerSigUrl = null;
      if (sellerSignature && sellerSignature.trim() !== '') {
        console.log('Uploading seller signature...');
        sellerSigUrl = await uploadBase64ToCloudinary(sellerSignature, 'signatures/seller');
      }
      
      let buyerSigUrl = null;
      if (buyerSignature && buyerSignature.trim() !== '') {
        console.log('Uploading buyer signature...');
        buyerSigUrl = await uploadBase64ToCloudinary(buyerSignature, 'signatures/buyer');
      }
      
      let registrarSigUrl = null;
      if (registrarSignature && registrarSignature.trim() !== '') {
        console.log('Uploading registrar signature...');
        registrarSigUrl = await uploadBase64ToCloudinary(registrarSignature, 'signatures/registrar');
      }

      console.log('Using pre-uploaded image URLs...');

      const receipt = {
        id: shortReceiptId,
        marketId: user.marketId,
        marketName: user.marketName,
        adminId: user.adminId || 'N/A',
        adminName: user.name || user.email,
        ...cleanedFormData,
        sellerAddress: `Village ${cleanedFormData.sellerVillage}, Tehsil ${cleanedFormData.sellerTehsil}`,
        buyerAddress: `Village ${cleanedFormData.buyerVillage}, Tehsil ${cleanedFormData.buyerTehsil}`,
        date: now.toISOString(),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'VALID',
        expiryTime: expiryTime.toISOString(),
        createdBy: user.uid || user.id,
        createdByEmail: user.email,
        // Signature URLs
        sellerSignatureUrl: sellerSigUrl,
        buyerSignatureUrl: buyerSigUrl,
        registrarSignatureUrl: registrarSigUrl,
        // Pre-uploaded image URLs (from background upload)
        sellerAadhaarFrontPhotoUrl: sellerAadhaarFrontPhoto.url,
        sellerAadhaarBackPhotoUrl: sellerAadhaarBackPhoto.url,
        buyerAadhaarFrontPhotoUrl: buyerAadhaarFrontPhoto.url,
        buyerAadhaarBackPhotoUrl: buyerAadhaarBackPhoto.url,
        driverAadhaarFrontPhotoUrl: driverAadhaarFrontPhoto ? driverAadhaarFrontPhoto.url : null,
        driverAadhaarBackPhotoUrl: driverAadhaarBackPhoto ? driverAadhaarBackPhoto.url : null,
        transporterAadhaarFrontPhotoUrl: transporterAadhaarFrontPhoto ? transporterAadhaarFrontPhoto.url : null,
        transporterAadhaarBackPhotoUrl: transporterAadhaarBackPhoto ? transporterAadhaarBackPhoto.url : null,
        animalPhotoUrl: animalPhoto.url,
        certificatePhotoUrl: certificatePhoto.url,
        sellerKhasraPhotoUrl: sellerKhasraPhoto ? sellerKhasraPhoto.url : null,
        buyerKhasraPhotoUrl: buyerKhasraPhoto ? buyerKhasraPhoto.url : null,
        vehicleRCPhotoUrl: vehicleRCPhoto ? vehicleRCPhoto.url : null,
        transportPermitPhotoUrl: transportPermitPhoto ? transportPermitPhoto.url : null
      };

      // Save to Firebase
      console.log('Saving receipt to Firebase...');
      await createReceipt(receipt);
      console.log('✅ Receipt saved successfully:', shortReceiptId);

      setReceiptData(receipt);
      setShowQR(true);
      alert('रसीद सफलतापूर्वक बनाई गई! / Receipt created successfully!');
      
      // Scroll to top when receipt is generated
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('रसीद बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें। / Error creating receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewReceipt = () => {
    setShowQR(false);
    setReceiptData(null);
    setFormData({
      sellerName: '',
      sellerMobile: '',
      sellerAadhar: '',
      sellerVillage: '',
      sellerTehsil: '',
      sellerState: 'Madhya Pradesh',
      sellerKhasra: '',
      buyerName: '',
      buyerMobile: '',
      buyerAadhar: '',
      buyerVillage: '',
      buyerTehsil: '',
      buyerState: 'Madhya Pradesh',
      buyerKhasra: '',
      animalType: 'Cow',
      animalCount: 1,
      animalColor: '',
      earTagNumber: '',
      transportMode: 'vehicle',
      vehicleNumber: '',
      vehicleOwnerName: '',
      driverName: '',
      driverAadhar: '',
      transporterName: '',
      transporterAadhar: '',
      fromLocation: '',
      toLocation: '',
      animalPrice: '',
      registrationFee: ''
    });
    // Reset images and signature
    setSellerSignature(null);
    setBuyerSignature(null);
    setRegistrarSignature(null);
    setSellerAadhaarFrontPhoto(null);
    setSellerAadhaarBackPhoto(null);
    setBuyerAadhaarFrontPhoto(null);
    setBuyerAadhaarBackPhoto(null);
    setDriverAadhaarFrontPhoto(null);
    setDriverAadhaarBackPhoto(null);
    setTransporterAadhaarFrontPhoto(null);
    setTransporterAadhaarBackPhoto(null);
    setAnimalPhoto(null);
    setCertificatePhoto(null);
    setSellerKhasraPhoto(null);
    setBuyerKhasraPhoto(null);
    setTransportPermitPhoto(null);
    setVehicleRCPhoto(null);
  };

  if (showQR && receiptData) {
    return (
      <div>
        <div className="no-print">
          <Header title="Receipt Created Successfully" />
        </div>

        <div className="container">
          {/* Success Message Heading */}
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
              {/* Success Icon */}
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              
              {/* Title */}
              <h1 style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: 'bold',
                lineHeight: 1
              }}>
                <span style={{ color: '#4CAF50' }}>Receipt Created Successfully!</span>
              </h1>
            </div>
            
            {/* Subtitle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#666',
              fontWeight: '500'
            }}>
              <span>रसीद सफलतापूर्वक बनाई गई | Receipt ID: {receiptData.id}</span>
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
                <span className="compact-label" style={{ maxWidth: '50%' }}>Receipt ID/ रसीद ID:</span>
                <span className="compact-value">{receiptData.id}</span>
              </div>
              
              <div className="compact-item">
                <span className="compact-label" style={{ maxWidth: '50%' }}>Market ID / बाजार ID:</span>
                <span className="compact-value">{receiptData.marketId}</span>
              </div>
              
              <div className="compact-item">
                <span className="compact-label" style={{ maxWidth: '50%' }}>Admin ID / प्रशासक ID:</span>
                <span className="compact-value">{receiptData.adminId || 'N/A'}</span>
              </div>
              
              <div className="compact-item">
                <span className="compact-label">Market / बाजार:</span>
                <span className="compact-value">{receiptData.marketName}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Date / दिनांक:</span>
                <span className="compact-value">{new Date(receiptData.date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Time / समय:</span>
                <span className="compact-value">
                  {new Date(receiptData.createdAt || receiptData.date).toLocaleTimeString('en-IN', { 
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
                <span className="compact-value">{receiptData.sellerName}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Mobile / मोबाइल:</span>
                <span className="compact-value">{receiptData.sellerMobile}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Aadhaar / आधार:</span>
                <span className="compact-value">{formatAadhaarForDisplay(receiptData.sellerAadhar)}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Address / पता:</span>
                <span className="compact-value">Village {receiptData.sellerVillage}, Tehsil {receiptData.sellerTehsil}, {receiptData.sellerState || 'Madhya Pradesh'}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Khasra / खसरा:</span>
                <span className="compact-value">{receiptData.sellerKhasra}</span>
              </div>

              {/* Buyer Details */}
              <div className="compact-item" style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px' }}>
                <span className="compact-label">Buyer / क्रेता:</span>
                <span className="compact-value">{receiptData.buyerName}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Mobile / मोबाइल:</span>
                <span className="compact-value">{receiptData.buyerMobile}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Aadhaar / आधार:</span>
                <span className="compact-value">{formatAadhaarForDisplay(receiptData.buyerAadhar)}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Address / पता:</span>
                <span className="compact-value">Village {receiptData.buyerVillage}, Tehsil {receiptData.buyerTehsil}, {receiptData.buyerState || 'Madhya Pradesh'}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Khasra / खसरा:</span>
                <span className="compact-value">{receiptData.buyerKhasra}</span>
              </div>

              {/* Animal Details */}
              <div className="compact-item" style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px' }}>
                <span className="compact-label">Animal / पशु:</span>
                <span className="compact-value">{receiptData.animalType}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Count / संख्या:</span>
                <span className="compact-value">{receiptData.animalCount}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Color / रंग:</span>
                <span className="compact-value">{receiptData.animalColor}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label">Ear Tag / कान टैग:</span>
                <span className="compact-value">{receiptData.earTagNumber}</span>
              </div>
              
              {/* Transport Details */}
              <div className="compact-item" style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px' }}>
                <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                  <span>Transport</span>
                  <span style={{ fontSize: '9px' }}>परिवहन</span>
                </span>
                <span className="compact-value">{receiptData.transportMode === 'vehicle' ? 'Vehicle / वाहन' : 'Pedestrian / पैदल'}</span>
              </div>
              {receiptData.transportMode === 'vehicle' ? (
                <>
                  <div className="compact-item">
                    <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span>Vehicle Number</span>
                      <span style={{ fontSize: '9px' }}>वाहन नंबर</span>
                    </span>
                    <span className="compact-value">{receiptData.vehicleNumber}</span>
                  </div>
                  <div className="compact-item">
                    <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span>Vehicle Owner</span>
                      <span style={{ fontSize: '9px' }}>वाहन मालिक</span>
                    </span>
                    <span className="compact-value">{receiptData.vehicleOwnerName || 'N/A'}</span>
                  </div>
                  <div className="compact-item">
                    <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span>Driver Name</span>
                      <span style={{ fontSize: '9px' }}>चालक का नाम</span>
                    </span>
                    <span className="compact-value">{receiptData.driverName}</span>
                  </div>
                  <div className="compact-item">
                    <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span>Driver Aadhaar</span>
                      <span style={{ fontSize: '9px' }}>चालक आधार</span>
                    </span>
                    <span className="compact-value">{formatAadhaarForDisplay(receiptData.driverAadhar)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="compact-item">
                    <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span>Transporter Name</span>
                      <span style={{ fontSize: '9px' }}>परिवहनकर्ता का नाम</span>
                    </span>
                    <span className="compact-value">{receiptData.transporterName}</span>
                  </div>
                  <div className="compact-item">
                    <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span>Transporter Aadhaar</span>
                      <span style={{ fontSize: '9px' }}>परिवहनकर्ता आधार</span>
                    </span>
                    <span className="compact-value">{formatAadhaarForDisplay(receiptData.transporterAadhar)}</span>
                  </div>
                </>
              )}
              <div className="compact-item">
                <span className="compact-label" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                  <span>Route</span>
                  <span style={{ fontSize: '9px' }}>मार्ग</span>
                </span>
                <span className="compact-value">{receiptData.fromLocation} → {receiptData.toLocation}</span>
              </div>
              
              {/* Payment Details */}
              <div className="compact-item" style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px' }}>
                <span className="compact-label">Price / मूल्य:</span>
                <span className="compact-value">₹{parseInt(receiptData.animalPrice).toLocaleString()}</span>
              </div>
              <div className="compact-item">
                <span className="compact-label"style={{ maxWidth: '50%' }}>Reg. Fee / पंजी. शुल्क:</span>
                <span className="compact-value">₹{parseInt(receiptData.registrationFee).toLocaleString()}</span>
              </div>
              <div className="compact-item" style={{ fontWeight: 'bold', borderBottom: '2px solid #000' }}>
                <span className="compact-label">Total / कुल:</span>
                <span className="compact-value" style={{ fontWeight: 'bold' }}>₹{(parseInt(receiptData.animalPrice) + parseInt(receiptData.registrationFee)).toLocaleString()}</span>
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
                  value={`${window.location.origin}/verify/${receiptData.id}`}
                  size={120}
                  level="H"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
                <div style={{ fontSize: '11px', color: '#000', marginTop: '8px', lineHeight: '1.6', fontWeight: 'bold' }}>
                  • Scan QR to verify receipt online<br/>
                  • Valid until 5 PM (17:00) same day<br/>
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
                    इस अवधि ({new Date(receiptData.createdAt || receiptData.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} से 05:00 PM) के भीतर पशु को उचित सुरक्षा और दिशा-निर्देशों के साथ गंतव्य तक ले जाएं। पशु क्रूरता निवारण अधिनियम का पालन अनिवार्य है, अन्यथा उचित कार्यवाही की जा सकती है।
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section - Display uploaded documents */}
          {(receiptData.sellerSignatureUrl || receiptData.buyerSignatureUrl || receiptData.registrarSignatureUrl || receiptData.sellerAadhaarFrontPhotoUrl || receiptData.sellerAadhaarBackPhotoUrl || receiptData.buyerAadhaarFrontPhotoUrl || receiptData.buyerAadhaarBackPhotoUrl || receiptData.animalPhotoUrl || receiptData.certificatePhotoUrl || receiptData.sellerKhasraPhotoUrl || receiptData.buyerKhasraPhotoUrl || receiptData.transportPermitPhotoUrl) && (
            <div className="card no-print" style={{ marginTop: '20px' }}>
              <h2 style={{ color: '#1e3c72', marginBottom: '20px' }}>📁 Uploaded Documents / अपलोड किए गए दस्तावेज़</h2>
              
              {/* Signatures Section */}
              <h3 style={{ color: '#1e3c72', marginTop: '20px', marginBottom: '15px', fontSize: '18px' }}>✍️ Signatures / हस्ताक्षर</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                {receiptData.sellerSignatureUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.sellerSignatureUrl === 'string' ? receiptData.sellerSignatureUrl : receiptData.sellerSignatureUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Seller Signature / विक्रेता हस्ताक्षर');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '12px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#1e3c72' }}>
                      Seller / विक्रेता
                    </h4>
                    <img 
                      src={typeof receiptData.sellerSignatureUrl === 'string' ? receiptData.sellerSignatureUrl : receiptData.sellerSignatureUrl?.url || ''} 
                      alt="Seller Signature" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '80px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        objectFit: 'contain'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Click to view full size</p>
                  </div>
                )}

                {receiptData.buyerSignatureUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.buyerSignatureUrl === 'string' ? receiptData.buyerSignatureUrl : receiptData.buyerSignatureUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Buyer Signature / क्रेता हस्ताक्षर');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '12px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#1e3c72' }}>
                      Buyer / क्रेता
                    </h4>
                    <img 
                      src={typeof receiptData.buyerSignatureUrl === 'string' ? receiptData.buyerSignatureUrl : receiptData.buyerSignatureUrl?.url || ''} 
                      alt="Buyer Signature" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '80px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        objectFit: 'contain'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Click to view full size</p>
                  </div>
                )}

                {receiptData.registrarSignatureUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.registrarSignatureUrl === 'string' ? receiptData.registrarSignatureUrl : receiptData.registrarSignatureUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Registrar Signature / रजिस्ट्रार हस्ताक्षर');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '12px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#1e3c72' }}>
                      Registrar / रजिस्ट्रार
                    </h4>
                    <img 
                      src={typeof receiptData.registrarSignatureUrl === 'string' ? receiptData.registrarSignatureUrl : receiptData.registrarSignatureUrl?.url || ''} 
                      alt="Registrar Signature" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '80px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        objectFit: 'contain'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Click to view full size</p>
                  </div>
                )}
              </div>

              {/* Documents Section */}
              <h3 style={{ color: '#1e3c72', marginTop: '20px', marginBottom: '15px', fontSize: '18px' }}>📄 Aadhaar Documents / आधार दस्तावेज़</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {receiptData.sellerAadhaarFrontPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.sellerAadhaarFrontPhotoUrl === 'string' ? receiptData.sellerAadhaarFrontPhotoUrl : receiptData.sellerAadhaarFrontPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Seller Aadhaar Front / विक्रेता आधार फ्रंट');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📄 Seller Aadhaar Front / विक्रेता आधार फ्रंट
                    </h4>
                    <img 
                      src={typeof receiptData.sellerAadhaarFrontPhotoUrl === 'string' ? receiptData.sellerAadhaarFrontPhotoUrl : receiptData.sellerAadhaarFrontPhotoUrl?.url || ''} 
                      alt="Seller Aadhaar Front" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.sellerAadhaarBackPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.sellerAadhaarBackPhotoUrl === 'string' ? receiptData.sellerAadhaarBackPhotoUrl : receiptData.sellerAadhaarBackPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Seller Aadhaar Back / विक्रेता आधार बैक');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📄 Seller Aadhaar Back / विक्रेता आधार बैक
                    </h4>
                    <img 
                      src={typeof receiptData.sellerAadhaarBackPhotoUrl === 'string' ? receiptData.sellerAadhaarBackPhotoUrl : receiptData.sellerAadhaarBackPhotoUrl?.url || ''} 
                      alt="Seller Aadhaar Back" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.buyerAadhaarFrontPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.buyerAadhaarFrontPhotoUrl === 'string' ? receiptData.buyerAadhaarFrontPhotoUrl : receiptData.buyerAadhaarFrontPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Buyer Aadhaar Front / क्रेता आधार फ्रंट');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📄 Buyer Aadhaar Front / क्रेता आधार फ्रंट
                    </h4>
                    <img 
                      src={typeof receiptData.buyerAadhaarFrontPhotoUrl === 'string' ? receiptData.buyerAadhaarFrontPhotoUrl : receiptData.buyerAadhaarFrontPhotoUrl?.url || ''} 
                      alt="Buyer Aadhaar Front" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.buyerAadhaarBackPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.buyerAadhaarBackPhotoUrl === 'string' ? receiptData.buyerAadhaarBackPhotoUrl : receiptData.buyerAadhaarBackPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Buyer Aadhaar Back / क्रेता आधार बैक');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📄 Buyer Aadhaar Back / क्रेता आधार बैक
                    </h4>
                    <img 
                      src={typeof receiptData.buyerAadhaarBackPhotoUrl === 'string' ? receiptData.buyerAadhaarBackPhotoUrl : receiptData.buyerAadhaarBackPhotoUrl?.url || ''} 
                      alt="Buyer Aadhaar Back" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}
              </div>

              {/* Animal & Certificate Documents */}
              <h3 style={{ color: '#1e3c72', marginTop: '20px', marginBottom: '15px', fontSize: '18px' }}>🐄 Animal & Certificate / पशु और प्रमाणपत्र</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {receiptData.animalPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.animalPhotoUrl === 'string' ? receiptData.animalPhotoUrl : receiptData.animalPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Animal Photo / पशु की फोटो');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      🐄 Animal Photo / पशु की फोटो
                    </h4>
                    <img 
                      src={typeof receiptData.animalPhotoUrl === 'string' ? receiptData.animalPhotoUrl : receiptData.animalPhotoUrl?.url || ''} 
                      alt="Animal" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.certificatePhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.certificatePhotoUrl === 'string' ? receiptData.certificatePhotoUrl : receiptData.certificatePhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Fitness Certificate / फिटनेस सर्टिफिकेट');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📋 Fitness Certificate / सर्टिफिकेट
                    </h4>
                    <img 
                      src={typeof receiptData.certificatePhotoUrl === 'string' ? receiptData.certificatePhotoUrl : receiptData.certificatePhotoUrl?.url || ''} 
                      alt="Fitness Certificate" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.sellerKhasraPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.sellerKhasraPhotoUrl === 'string' ? receiptData.sellerKhasraPhotoUrl : receiptData.sellerKhasraPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Seller Khasra/B-1/KCC / विक्रेता खसरा/B-1/KCC');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📜 Seller Khasra / विक्रेता खसरा
                    </h4>
                    <img 
                      src={typeof receiptData.sellerKhasraPhotoUrl === 'string' ? receiptData.sellerKhasraPhotoUrl : receiptData.sellerKhasraPhotoUrl?.url || ''} 
                      alt="Seller Khasra/B-1/KCC" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.buyerKhasraPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.buyerKhasraPhotoUrl === 'string' ? receiptData.buyerKhasraPhotoUrl : receiptData.buyerKhasraPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Buyer Khasra/B-1/KCC / क्रेता खसरा/B-1/KCC');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📜 Buyer Khasra / क्रेता खसरा
                    </h4>
                    <img 
                      src={typeof receiptData.buyerKhasraPhotoUrl === 'string' ? receiptData.buyerKhasraPhotoUrl : receiptData.buyerKhasraPhotoUrl?.url || ''} 
                      alt="Buyer Khasra/B-1/KCC" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}
              </div>

              {/* Transport Documents */}
              <h3 style={{ color: '#1e3c72', marginTop: '20px', marginBottom: '15px', fontSize: '18px' }}>🚚 Transport Documents / परिवहन दस्तावेज़</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {receiptData.transportMode === 'vehicle' && receiptData.vehicleRCPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.vehicleRCPhotoUrl === 'string' ? receiptData.vehicleRCPhotoUrl : receiptData.vehicleRCPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Vehicle RC (Registration Certificate) / वाहन RC');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      🚗 Vehicle RC / वाहन RC [COMPULSORY]
                    </h4>
                    <img 
                      src={typeof receiptData.vehicleRCPhotoUrl === 'string' ? receiptData.vehicleRCPhotoUrl : receiptData.vehicleRCPhotoUrl?.url || ''} 
                      alt="Vehicle RC" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.transportMode === 'vehicle' && receiptData.driverAadhaarFrontPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.driverAadhaarFrontPhotoUrl === 'string' ? receiptData.driverAadhaarFrontPhotoUrl : receiptData.driverAadhaarFrontPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Driver Aadhaar Front / चालक आधार फ्रंट');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📄 Driver Aadhaar Front / चालक आधार फ्रंट
                    </h4>
                    <img 
                      src={typeof receiptData.driverAadhaarFrontPhotoUrl === 'string' ? receiptData.driverAadhaarFrontPhotoUrl : receiptData.driverAadhaarFrontPhotoUrl?.url || ''} 
                      alt="Driver Aadhaar Front" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.transportMode === 'vehicle' && receiptData.driverAadhaarBackPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.driverAadhaarBackPhotoUrl === 'string' ? receiptData.driverAadhaarBackPhotoUrl : receiptData.driverAadhaarBackPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Driver Aadhaar Back / चालक आधार बैक');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📄 Driver Aadhaar Back / चालक आधार बैक
                    </h4>
                    <img 
                      src={typeof receiptData.driverAadhaarBackPhotoUrl === 'string' ? receiptData.driverAadhaarBackPhotoUrl : receiptData.driverAadhaarBackPhotoUrl?.url || ''} 
                      alt="Driver Aadhaar Back" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.transportMode === 'pedestrian' && receiptData.transporterAadhaarFrontPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.transporterAadhaarFrontPhotoUrl === 'string' ? receiptData.transporterAadhaarFrontPhotoUrl : receiptData.transporterAadhaarFrontPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Transporter Aadhaar Front / परिवहनकर्ता आधार फ्रंट');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📄 Transporter Aadhaar Front / परिवहनकर्ता आधार फ्रंट
                    </h4>
                    <img 
                      src={typeof receiptData.transporterAadhaarFrontPhotoUrl === 'string' ? receiptData.transporterAadhaarFrontPhotoUrl : receiptData.transporterAadhaarFrontPhotoUrl?.url || ''} 
                      alt="Transporter Aadhaar Front" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.transportMode === 'pedestrian' && receiptData.transporterAadhaarBackPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.transporterAadhaarBackPhotoUrl === 'string' ? receiptData.transporterAadhaarBackPhotoUrl : receiptData.transporterAadhaarBackPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Transporter Aadhaar Back / परिवहनकर्ता आधार बैक');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📄 Transporter Aadhaar Back / परिवहनकर्ता आधार बैक
                    </h4>
                    <img 
                      src={typeof receiptData.transporterAadhaarBackPhotoUrl === 'string' ? receiptData.transporterAadhaarBackPhotoUrl : receiptData.transporterAadhaarBackPhotoUrl?.url || ''} 
                      alt="Transporter Aadhaar Back" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}

                {receiptData.transportPermitPhotoUrl && (
                  <div 
                    onClick={() => {
                      const url = typeof receiptData.transportPermitPhotoUrl === 'string' ? receiptData.transportPermitPhotoUrl : receiptData.transportPermitPhotoUrl?.url || '';
                      setFullscreenImage(url);
                      setFullscreenImageAlt('Transport Permit / परिवहन परमिट');
                    }}
                    style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#1e3c72' }}>
                      📋 Transport Permit / परिवहन परमिट
                    </h4>
                    <img 
                      src={typeof receiptData.transportPermitPhotoUrl === 'string' ? receiptData.transportPermitPhotoUrl : receiptData.transportPermitPhotoUrl?.url || ''} 
                      alt="Transport Permit" 
                      style={{ 
                        maxWidth: '100%', 
                        height: '140px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }} 
                    />
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>🔍 Click to enlarge</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Screen Image Viewer */}
          {fullscreenImage && (
            <ImageViewer
              imageUrl={fullscreenImage}
              altText={fullscreenImageAlt}
              onClose={() => setFullscreenImage(null)}
            />
          )}

          {/* Action Buttons - Bottom */}
          <div className="no-print" style={{ 
            marginTop: '30px', 
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={handlePrint} 
              className="btn btn-primary" 
              style={{ 
                minWidth: '200px',
                padding: '14px 24px',
                fontSize: '16px',
                fontWeight: '600',
                flex: '1 1 auto',
                maxWidth: '300px'
              }}
            >
              Print Receipt
            </button>
            <button 
              onClick={handleNewReceipt} 
              className="btn btn-secondary"
              style={{ 
                minWidth: '200px',
                padding: '14px 24px',
                fontSize: '16px',
                fontWeight: '600',
                flex: '1 1 auto',
                maxWidth: '300px'
              }}
            >
              Create Another Receipt
            </button>
          </div>

          <style>{`
            @media (max-width: 768px) {
              .no-print > button {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
              }
              .no-print {
                flex-direction: column !important;
                padding: 0 20px;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Create New Receipt" />

      <div className="container">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <h2 style={{ marginBottom: '20px', color: '#1e3c72' }}>Seller Information / विक्रेता की जानकारी</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Seller Name / विक्रेता का नाम <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleChange}
                  required
                  placeholder="Enter seller name / विक्रेता का नाम दर्ज करें"
                />
              </div>
              <div className="form-group">
                <label>Mobile Number / मोबाइल नंबर <span className="required-star">*</span></label>
                <input
                  type="tel"
                  name="sellerMobile"
                  value={formData.sellerMobile}
                  onChange={handleChange}
                  onInput={(e) => {
                    // Allow only numeric input
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  }}
                  required
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                  placeholder="10-digit mobile number / 10 अंकों का मोबाइल नंबर"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Aadhaar Number / आधार नंबर <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="sellerAadhar"
                  value={formData.sellerAadhar}
                  onChange={handleChange}
                  required
                  placeholder="XXXX XXXX XXXX"
                  maxLength="14"
                />
              </div>
              <div className="form-group">
                <label>Village / गाँव <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="sellerVillage"
                  value={formData.sellerVillage}
                  onChange={handleChange}
                  required
                  placeholder="Enter village name / गाँव का नाम दर्ज करें"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tehsil / तहसील <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="sellerTehsil"
                  value={formData.sellerTehsil}
                  onChange={handleChange}
                  required
                  placeholder="Enter tehsil name / तहसील का नाम दर्ज करें"
                />
              </div>
              <div className="form-group">
                <label>State / राज्य <span className="required-star">*</span></label>
                <select
                  name="sellerState"
                  value={formData.sellerState}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px', fontSize: '14px' }}
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Khasra / B-1 Number / खसरा नंबर <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="sellerKhasra"
                  value={formData.sellerKhasra}
                  onChange={handleChange}
                  required
                  placeholder="Enter Khasra number / खसरा नंबर दर्ज करें"
                />
              </div>
            </div>

            {/* Seller Aadhaar Card - Grouped Component */}
            <AadhaarUploadGroup
              title="Seller Aadhaar Card / विक्रेता आधार कार्ड"
              type="seller"
              required={true}
              onDataExtracted={(data) => {
                // Auto-fill form fields from OCR
                if (data.name) {
                  setFormData(prev => ({ ...prev, sellerName: data.name }));
                }
                if (data.aadhaarNumber) {
                  setFormData(prev => ({ ...prev, sellerAadhar: data.aadhaarNumber }));
                }
              }}
              onFrontImageSelect={setSellerAadhaarFrontPhoto}
              onBackImageSelect={setSellerAadhaarBackPhoto}
            />

            <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#1e3c72' }}>Buyer Information / क्रेता की जानकारी</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Buyer Name / क्रेता का नाम <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="buyerName"
                  value={formData.buyerName}
                  onChange={handleChange}
                  required
                  placeholder="Enter buyer name / क्रेता का नाम दर्ज करें"
                />
              </div>
              <div className="form-group">
                <label>Mobile Number / मोबाइल नंबर <span className="required-star">*</span></label>
                <input
                  type="tel"
                  name="buyerMobile"
                  value={formData.buyerMobile}
                  onChange={handleChange}
                  onInput={(e) => {
                    // Allow only numeric input
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  }}
                  required
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                  placeholder="10-digit mobile number / 10 अंकों का मोबाइल नंबर"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Aadhaar Number / आधार नंबर <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="buyerAadhar"
                  value={formData.buyerAadhar}
                  onChange={handleChange}
                  required
                  placeholder="XXXX XXXX XXXX"
                  maxLength="14"
                />
              </div>
              <div className="form-group">
                <label>Village / गाँव <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="buyerVillage"
                  value={formData.buyerVillage}
                  onChange={handleChange}
                  required
                  placeholder="Enter village name / गाँव का नाम दर्ज करें"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tehsil / तहसील <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="buyerTehsil"
                  value={formData.buyerTehsil}
                  onChange={handleChange}
                  required
                  placeholder="Enter tehsil name / तहसील का नाम दर्ज करें"
                />
              </div>
              <div className="form-group">
                <label>State / राज्य <span className="required-star">*</span></label>
                <select
                  name="buyerState"
                  value={formData.buyerState}
                  onChange={handleChange}
                  required
                  style={{ padding: '10px', fontSize: '14px' }}
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Khasra / B-1 Number / खसरा नंबर <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="buyerKhasra"
                  value={formData.buyerKhasra}
                  onChange={handleChange}
                  required
                  placeholder="Enter Khasra number / खसरा नंबर दर्ज करें"
                />
              </div>
            </div>

            {/* Buyer Aadhaar Card - Grouped Component */}
            <AadhaarUploadGroup
              title="Buyer Aadhaar Card / क्रेता आधार कार्ड"
              type="buyer"
              required={true}
              onDataExtracted={(data) => {
                // Auto-fill form fields from OCR
                if (data.name) {
                  setFormData(prev => ({ ...prev, buyerName: data.name }));
                }
                if (data.aadhaarNumber) {
                  setFormData(prev => ({ ...prev, buyerAadhar: data.aadhaarNumber }));
                }
              }}
              onFrontImageSelect={setBuyerAadhaarFrontPhoto}
              onBackImageSelect={setBuyerAadhaarBackPhoto}
            />

            <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#1e3c72' }}>Animal Details / पशु विवरण</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Animal Type / पशु प्रकार <span className="required-star">*</span></label>
                <select
                  name="animalType"
                  value={formData.animalType}
                  onChange={handleChange}
                  required
                >
                  <option value="Cow">Cow / गाय</option>
                  <option value="Bull">Bull / बैल</option>
                  <option value="Buffalo">Buffalo / भैंस</option>
                  <option value="Goat">Goat / बकरी</option>
                  <option value="Sheep">Sheep / भेड़</option>
                </select>
              </div>
              <div className="form-group">
                <label>Count / संख्या <span className="required-star">*</span></label>
                <input
                  type="number"
                  name="animalCount"
                  value={formData.animalCount}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Color / Identification / रंग / पहचान <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="animalColor"
                  value={formData.animalColor}
                  onChange={handleChange}
                  required
                  placeholder="e.g., White with brown patches / सफेद भूरे धब्बों के साथ"
                />
              </div>
              <div className="form-group">
                <label>Ear Tag Number / कान टैग नंबर <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="earTagNumber"
                  value={formData.earTagNumber}
                  onChange={handleChange}
                  required
                  placeholder="Compulsory / अनिवार्य"
                />
              </div>
            </div>

            <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#1e3c72' }}>Transport Details / परिवहन विवरण</h2>
            
            {/* Transport Mode Selection */}
            <div className="form-row">
              <div className="form-group">
                <label>Transport Mode / परिवहन का तरीका <span className="required-star">*</span></label>
                <select
                  name="transportMode"
                  value={formData.transportMode}
                  onChange={handleChange}
                  required
                >
                  <option value="vehicle">Vehicle / वाहन</option>
                  <option value="pedestrian">Pedestrian / पैदल</option>
                </select>
              </div>
            </div>

            {/* Conditional fields based on transport mode */}
            {formData.transportMode === 'vehicle' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Number / वाहन नंबर <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g., UP-32-AB-1234"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Owner Name / वाहन मालिक का नाम <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="vehicleOwnerName"
                      value={formData.vehicleOwnerName}
                      onChange={handleChange}
                      required
                      placeholder="Enter vehicle owner name / वाहन मालिक का नाम दर्ज करें"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Driver Name / चालक का नाम <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="driverName"
                      value={formData.driverName}
                      onChange={handleChange}
                      required
                      placeholder="Enter driver name / चालक का नाम दर्ज करें"
                    />
                  </div>
                  <div className="form-group">
                    <label>Driver Aadhaar Number / चालक आधार नंबर <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="driverAadhar"
                      value={formData.driverAadhar}
                      onChange={handleChange}
                      required
                      placeholder="XXXX XXXX XXXX"
                      maxLength="14"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>From Location / प्रारंभिक स्थान <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="fromLocation"
                      value={formData.fromLocation}
                      onChange={handleChange}
                      required
                      placeholder="Starting location / प्रारंभिक स्थान"
                    />
                  </div>
                  <div className="form-group">
                    <label>To Location / गंतव्य स्थान <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="toLocation"
                      value={formData.toLocation}
                      onChange={handleChange}
                      required
                      placeholder="Destination / गंतव्य"
                    />
                  </div>
                </div>

                {/* Driver Aadhaar Card - Grouped Component */}
                <AadhaarUploadGroup
                  title="Driver Aadhaar Card / चालक आधार कार्ड"
                  type="driver"
                  required={true}
                  onFrontImageSelect={setDriverAadhaarFrontPhoto}
                  onBackImageSelect={setDriverAadhaarBackPhoto}
                />
              </>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Transporter Name / परिवहनकर्ता का नाम <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="transporterName"
                      value={formData.transporterName}
                      onChange={handleChange}
                      required
                      placeholder="Enter transporter name / परिवहनकर्ता का नाम दर्ज करें"
                    />
                  </div>
                  <div className="form-group">
                    <label>Transporter Aadhaar Number / परिवहनकर्ता आधार नंबर <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="transporterAadhar"
                      value={formData.transporterAadhar}
                      onChange={handleChange}
                      required
                      placeholder="XXXX XXXX XXXX"
                      maxLength="14"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>From Location / प्रारंभिक स्थान <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="fromLocation"
                      value={formData.fromLocation}
                      onChange={handleChange}
                      required
                      placeholder="Starting location / प्रारंभिक स्थान"
                    />
                  </div>
                  <div className="form-group">
                    <label>To Location / गंतव्य स्थान <span className="required-star">*</span></label>
                    <input
                      type="text"
                      name="toLocation"
                      value={formData.toLocation}
                      onChange={handleChange}
                      required
                      placeholder="Destination / गंतव्य"
                    />
                  </div>
                </div>

                {/* Transporter Aadhaar Card - Grouped Component */}
                <AadhaarUploadGroup
                  title="Transporter Aadhaar Card / परिवहनकर्ता आधार कार्ड"
                  type="transporter"
                  required={true}
                  onFrontImageSelect={setTransporterAadhaarFrontPhoto}
                  onBackImageSelect={setTransporterAadhaarBackPhoto}
                />
              </>
            )}

            <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#1e3c72' }}>Transaction Details / लेनदेन विवरण</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Animal Price / पशु मूल्य (₹) <span className="required-star">*</span></label>
                <input
                  type="number"
                  name="animalPrice"
                  value={formData.animalPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="Enter price / मूल्य दर्ज करें"
                />
              </div>
              <div className="form-group">
                <label>Registration Fee / पंजीकरण शुल्क (₹) <span className="required-star">*</span></label>
                <input
                  type="number"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="Enter registration fee / पंजीकरण शुल्क दर्ज करें"
                />
              </div>
            </div>

            <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#1e3c72' }}>Documents & Signatures / दस्तावेज़ और हस्ताक्षर</h2>
            
            {/* Seller Signature */}
            <SignaturePad
              label="Seller Signature / Thumb (Optional) / विक्रेता हस्ताक्षर/अंगूठा (वैकल्पिक)"
              onSignatureChange={setSellerSignature}
              required={false}
            />

            {/* Buyer Signature */}
            <SignaturePad
              label="Buyer Signature / Thumb (Optional) / क्रेता हस्ताक्षर/अंगूठा (वैकल्पिक)"
              onSignatureChange={setBuyerSignature}
              required={false}
            />

            {/* Registrar Signature */}
            <SignaturePad
              label="Registrar Signature (Optional) / रजिस्ट्रार हस्ताक्षर (वैकल्पिक)"
              onSignatureChange={setRegistrarSignature}
              required={false}
            />

            {/* Animal Photo */}
            <ImageUpload
              label="🐄 Animal Photo * / पशु की फोटो *"
              onImageSelect={setAnimalPhoto}
              folder="animals"
              required={true}
              accept="image/*"
              maxSizeKB={700}
              enableCompression={true}
            />

            {/* Fitness Certificate */}
            <ImageUpload
              label="📋 Fitness Certificate * / फिटनेस सर्टिफिकेट *"
              onImageSelect={setCertificatePhoto}
              folder="certificates"
              required={true}
              accept="image/*"
              maxSizeKB={700}
              enableCompression={true}
            />

            {/* Seller Khasra/B-1/KCC Document - Mandatory */}
            <ImageUpload
              label="📜 Seller Khasra/B-1/KCC * / विक्रेता खसरा/B-1/KCC दस्तावेज़ * [COMPULSORY]"
              onImageSelect={setSellerKhasraPhoto}
              folder="khasra-b1-seller"
              required={true}
              accept="image/*"
              maxSizeKB={700}
              enableCompression={true}
            />

            {/* Buyer Khasra/B-1/KCC Document - Mandatory */}
            <ImageUpload
              label="📜 Buyer Khasra/B-1/KCC * / क्रेता खसरा/B-1/KCC दस्तावेज़ * [COMPULSORY]"
              onImageSelect={setBuyerKhasraPhoto}
              folder="khasra-b1-buyer"
              required={true}
              accept="image/*"
              maxSizeKB={700}
              enableCompression={true}
            />

            {/* Vehicle RC and Transport Permit - Only for vehicle mode */}
            {formData.transportMode === 'vehicle' && (
              <>
                <ImageUpload
                  label="🚗 Vehicle RC (Registration Certificate) * / वाहन RC (पंजीकरण प्रमाणपत्र) * [COMPULSORY]"
                  onImageSelect={setVehicleRCPhoto}
                  folder="vehicle-rc"
                  required={true}
                  accept="image/*"
                  maxSizeKB={700}
                  enableCompression={true}
                />
                <ImageUpload
                  label="📋 Transport Permit * / परिवहन परमिट *"
                  onImageSelect={setTransportPermitPhoto}
                  folder="transport-permits"
                  required={true}
                  accept="image/*"
                  maxSizeKB={700}
                  enableCompression={true}
                />
              </>
            )}

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ minWidth: '200px' }}
                disabled={loading}
              >
                {loading ? 'Creating Receipt... / रसीद बनाई जा रही है...' : 'Generate Receipt / रसीद बनाएं'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateReceipt;
