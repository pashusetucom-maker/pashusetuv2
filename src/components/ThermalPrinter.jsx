// ThermalPrinter.jsx
// React.js 80mm Thermal Printer Perfect Fit
// Works for: POS / Bluetooth / USB Thermal Printer
// Auto fit full width with clean font
// 76mm width works best for most 80mm printers because printers usually have printable margins

import React, { useRef } from "react";

export default function ThermalPrinter() {
  const printRef = useRef();

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "", "width=400,height=600");
    
    win.document.write(`
      <html>
        <head>
          <title>Print Bill</title>
          <style>
            /* Page setup for 80mm thermal paper */
            @page {
              size: 80mm auto; /* Auto height for continuous paper */
              margin: 2mm; /* Minimal margins */
            }
            
            body {
              margin: 0;
              padding: 0;
              width: 76mm; /* 76mm works best for 80mm printers (printable area) */
              font-family: Arial, sans-serif;
              font-size: 13px;
              color: #000;
              background: white;
            }
            
            .bill {
              width: 100%;
              padding: 2mm;
            }
            
            .center {
              text-align: center;
            }
            
            .bold {
              font-weight: bold;
            }
            
            .line {
              border-top: 1px dashed black;
              margin: 5px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin: 5px 0;
            }
            
            th, td {
              padding: 4px 0;
              text-align: left;
              word-break: break-word;
            }
            
            .right {
              text-align: right;
            }
            
            .total {
              font-size: 15px;
              font-weight: bold;
            }
            
            h2 {
              margin: 5px 0;
              font-size: 20px;
            }
            
            p {
              margin: 3px 0;
              font-size: 12px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    
    win.document.close();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      {/* Receipt Preview */}
      <div 
        ref={printRef} 
        className="bill"
        style={{
          width: '76mm',
          margin: '0 auto',
          padding: '10px',
          border: '1px dashed #ccc',
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          background: 'white'
        }}
      >
        {/* Header */}
        <div className="center">
          <h2 style={{ margin: '5px 0', fontSize: '20px', fontWeight: 'bold' }}>
            PashuSetu
          </h2>
          <p style={{ margin: '3px 0', fontSize: '12px' }}>
            Thermal Bill Print
          </p>
          <p style={{ margin: '3px 0', fontSize: '11px' }}>
            पशु बाजार डिजिटल रसीद
          </p>
        </div>

        {/* Divider */}
        <div className="line" style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>

        {/* Invoice Details */}
        <p style={{ margin: '4px 0', fontSize: '12px' }}>
          <b>Invoice No:</b> 1001
        </p>
        <p style={{ margin: '4px 0', fontSize: '12px' }}>
          <b>Date:</b> 19-05-2026
        </p>
        <p style={{ margin: '4px 0', fontSize: '12px' }}>
          <b>Time:</b> 10:30 AM
        </p>

        {/* Divider */}
        <div className="line" style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ padding: '4px 0', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '4px 0', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '4px 0', textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0' }}>Medicine</td>
              <td style={{ padding: '4px 0', textAlign: 'right' }}>2</td>
              <td style={{ padding: '4px 0', textAlign: 'right' }}>₹200</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}>Injection</td>
              <td style={{ padding: '4px 0', textAlign: 'right' }}>1</td>
              <td style={{ padding: '4px 0', textAlign: 'right' }}>₹150</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}>Vitamins</td>
              <td style={{ padding: '4px 0', textAlign: 'right' }}>3</td>
              <td style={{ padding: '4px 0', textAlign: 'right' }}>₹300</td>
            </tr>
          </tbody>
        </table>

        {/* Divider */}
        <div className="line" style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>

        {/* Total */}
        <p 
          className="total right" 
          style={{ 
            fontSize: '15px', 
            fontWeight: 'bold', 
            textAlign: 'right',
            margin: '6px 0'
          }}
        >
          Total: ₹650
        </p>

        {/* Divider */}
        <div className="line" style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>

        {/* Footer */}
        <p className="center" style={{ textAlign: 'center', fontSize: '12px', margin: '6px 0' }}>
          Thank You for Your Business!
        </p>
        <p className="center" style={{ textAlign: 'center', fontSize: '11px', margin: '4px 0', color: '#666' }}>
          Visit Again | धन्यवाद
        </p>
      </div>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        style={{
          padding: "12px 24px",
          background: "black",
          color: "white",
          border: "none",
          cursor: "pointer",
          marginTop: 20,
          width: '100%',
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '6px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#333';
          e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'black';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        🖨️ Print Bill
      </button>

      {/* Info Box */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f0f8ff',
        border: '1px solid #2196F3',
        borderRadius: '8px',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1e3c72' }}>
          ℹ️ Thermal Printer Info:
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Optimized for 80mm thermal paper</li>
          <li>76mm width for best fit (accounts for margins)</li>
          <li>Works with POS, Bluetooth, USB printers</li>
          <li>Auto-adjusts for continuous paper feed</li>
          <li>Clean Arial font for better readability</li>
        </ul>
      </div>
    </div>
  );
}
