# PashuSetu - Livestock Market Digital Receipt System

**पशु बाजार डिजिटल रसीद प्रणाली**

A government-grade web application for digitally managing and verifying livestock market transactions, replacing traditional paper-based receipt systems with a secure, centralized, and audit-proof digital platform.

![PashuSetu Logo](logo.png)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## 🎯 Overview

PashuSetu is a comprehensive digital solution designed for livestock markets to:
- **Digitize** buying/selling transactions
- **Generate** secure digital receipts with QR codes
- **Verify** receipt authenticity publicly
- **Manage** multiple markets and administrators
- **Store** transaction documents securely
- **Maintain** complete audit trails

### Problem Statement
Traditional paper-based receipt systems in livestock markets face challenges:
- ❌ Easy to forge or manipulate
- ❌ Difficult to verify authenticity
- ❌ Poor record keeping
- ❌ No centralized oversight
- ❌ Environmental concerns

### Solution
PashuSetu provides:
- ✅ Digital receipts with QR codes
- ✅ Public verification system
- ✅ Secure cloud storage
- ✅ Centralized administration
- ✅ Complete audit trails
- ✅ Paperless transactions

---

## ✨ Key Features

### For Super Administrators
- 🏢 Create and manage multiple markets
- 👥 Create and manage market administrators
- 📊 View all receipts across all markets
- 📈 Monitor system-wide statistics
- 🔐 Control admin access (Active/Blocked/Suspended)
- ⏰ **Market Hours Control** - Set universal operating hours for all markets
- 📊 **Market Data Analytics** - Comprehensive analytics with multiple time periods
- 🔍 **Aadhar Tracking System** - Track and analyze transactions by Aadhar card number

### For Market Administrators
- 📝 Create digital receipts for transactions
- 📸 Upload animal photos and documents
- ✍️ Capture digital signatures
- 📋 View market-specific receipts
- 🏪 Manage daily market operations
- 🕐 **Market Status Display** - Real-time market open/closed status with operating hours

### For Public Users
- ✅ Verify receipt authenticity (no login required)
- 🔍 Search by Receipt ID or scan QR code
- 📄 View complete transaction details
- 🖼️ Access uploaded images and documents

### Technical Features
- 🌐 Bilingual interface (English/Hindi)
- 📱 Fully responsive design (mobile-first)
- 🔒 Role-based access control
- ☁️ Cloud-based image storage
- 🎨 Modern, intuitive UI
- ⚡ Real-time data synchronization
- 🔐 Secure authentication
- 📊 Comprehensive audit trails
- 🕐 **Universal Market Hours** - Centralized time control for all markets
- 📈 **Advanced Analytics** - Last 7 days, 30 days, quarter-wise, and year-wise reports
- 🔄 **Auto-redirect** - Logged-in users automatically redirected to dashboard
- 🔍 **Aadhar Tracking** - Search and analyze all transactions by Aadhar card with duplicate detection
- 📲 **PWA Support** - Install as native app on mobile and desktop
- 📴 **Offline Mode** - Access cached data when offline
- 🔔 **Push Notifications** - Stay updated with real-time alerts
- ⚡ **Fast Loading** - Service worker caching for instant load times

---

## 🛠️ Technology Stack

### Frontend
- **React** 19.2.5 - UI framework
- **React Router DOM** 7.14.2 - Navigation
- **React Context API** - State management
- **CSS-in-JS** - Styling

### Backend & Services
- **Firebase Authentication** - User authentication
- **Cloud Firestore** - NoSQL database
- **Cloudinary** - Image storage and CDN
- **Firebase Hosting** - Deployment (optional)

### Libraries
- **qrcode.react** - QR code generation
- **react-signature-canvas** - Digital signatures
- **Firebase SDK** - Backend integration

### Development Tools
- **Create React App** - Build tooling
- **npm** - Package management
- **Git** - Version control

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pashusetu-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Firebase and Cloudinary credentials.

4. **Start development server**
   ```bash
   npm start
   ```

5. **Access the application**
   ```
   http://localhost:3000
   ```

### Default Super Admin
After Firebase setup, create a super admin user:
- Email: `admin@pashusetu.com`
- Password: (set during Firebase setup)

---

## 📚 Documentation

Comprehensive guides are available in the `docs/` folder:

### Setup Guides
- **[Firebase Setup](pashusetu-app/docs/FIREBASE_SETUP.md)** - Complete Firebase configuration guide
- **[Cloudinary Setup](pashusetu-app/docs/CLOUDINARY_SETUP.md)** - Image storage configuration
- **[Local Deployment](pashusetu-app/docs/LOCAL_DEPLOYMENT.md)** - Run the app locally

### Feature Documentation
- **[Features Guide](pashusetu-app/docs/FEATURES.md)** - Detailed feature documentation
- **[Firestore Indexes](pashusetu-app/docs/FIRESTORE_INDEXES.md)** - Database index setup guide
- **[Aadhar Tracking](pashusetu-app/docs/AADHAR_TRACKING.md)** - Aadhar tracking system documentation

### Quick Links
- [Environment Variables](#environment-variables)
- [Firestore Security Rules](#firestore-security-rules)
- [Troubleshooting](#troubleshooting)

---

## 👥 User Roles

### 1. Super Admin
**Access:** Full system control

**Capabilities:**
- Create and manage markets
- Create and manage market admins
- View all receipts
- Monitor system statistics
- Control admin access
- **Set universal market hours** (enable/disable, opening/closing times)
- **View comprehensive analytics** (last 7/30 days, quarter-wise, year-wise)

**Dashboard:** `/super-admin`

### 2. Market Admin
**Access:** Assigned market only

**Capabilities:**
- Create digital receipts
- View market receipts
- Upload transaction documents
- Capture signatures
- Manage daily operations
- **View real-time market status** (open/closed with operating hours)

**Dashboard:** `/market-admin`

### 3. Public User
**Access:** Verification only (no login)

**Capabilities:**
- Verify receipt authenticity
- View receipt details
- Access via Receipt ID or QR code

**Verification:** `/verify`

---

## 📸 Screenshots

### Login Page
- Bilingual interface
- Buyer and seller guidelines
- Instagram-style design
- Direct verification link

### Super Admin Dashboard
- Market statistics
- Admin management
- Receipt overview
- Quick actions

### Create Receipt
- Comprehensive form
- Image uploads
- Digital signatures
- QR code generation

### Receipt Verification
- Public access
- Detailed information
- Image display
- Print-friendly

---

## 📁 Project Structure

```
pashusetu-app/
├── docs/                          # Documentation
│   ├── FIREBASE_SETUP.md
│   ├── CLOUDINARY_SETUP.md
│   ├── LOCAL_DEPLOYMENT.md
│   └── FEATURES.md
├── public/                        # Static files
│   ├── logo.png
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/                # React components
│   │   ├── Login.js              # Login page
│   │   ├── SuperAdminDashboard.js
│   │   ├── MarketAdminDashboard.js
│   │   ├── CreateReceipt.js      # Receipt creation form
│   │   ├── ViewReceipts.js       # Receipt list
│   │   ├── VerifyReceipt.js      # Public verification
│   │   ├── VerifyReceiptInput.js # Verification input
│   │   ├── CreateMarket.js       # Market creation
│   │   ├── CreateAdmin.js        # Admin creation
│   │   ├── ManageAdmins.js       # Admin management
│   │   ├── Header.js             # Header component
│   │   ├── ImageUpload.js        # Image upload
│   │   ├── ImageViewer.js        # Image viewer
│   │   └── SignaturePad.js       # Signature capture
│   ├── context/                   # React Context
│   │   └── AuthContext.js        # Authentication context
│   ├── firebase/                  # Firebase services
│   │   ├── config.js             # Firebase config
│   │   ├── authService.js        # Auth operations
│   │   └── firestoreService.js   # Database operations
│   ├── utils/                     # Utility functions
│   │   ├── cloudinaryService.js  # Image upload
│   │   └── mockData.js           # Helper functions
│   ├── App.js                     # Main app component
│   ├── App.css                    # Global styles
│   └── index.js                   # Entry point
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies
├── firestore.rules                # Firestore security rules
├── firestore.indexes.json         # Firestore indexes
└── README.md                      # This file
```

---

## 🔐 Security

### Authentication
- Firebase Authentication with email/password
- Secure password hashing
- Session management
- Token-based authentication

### Authorization
- Role-based access control (RBAC)
- Firestore security rules
- Market-based data isolation
- Admin status checking

### Data Protection
- Encrypted data transmission (HTTPS)
- Secure cloud storage
- No client-side secrets
- Audit trail preservation
- No delete operations (soft delete only)

### Input Validation
- Email format validation
- Mobile number validation
- Aadhaar number validation
- File type and size validation
- XSS protection

---

## 🔧 Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=pashusetu_receipts
```

**Important:** Never commit `.env` to version control!

---

## 🔥 Firestore Security Rules

Security rules are defined in `firestore.rules`:

- **Users Collection:** Super admin can manage, users can read own data
- **Markets Collection:** Super admin full access, market admins read own market
- **Receipts Collection:** Market-based access control, public verification allowed
- **Audit Trail:** No delete operations, all changes logged

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## 📊 Firestore Indexes

Required composite indexes are defined in `firestore.indexes.json`:

1. **Receipts by Market and Date**
   - `marketId` (Ascending)
   - `createdAt` (Descending)

2. **Receipts by Status**
   - `status` (Ascending)
   - `createdAt` (Descending)

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Firebase Connection Error**
- Verify `.env` file exists and has correct values
- Check Firebase project is active
- Restart development server after changing `.env`

**2. Cloudinary Upload Failed**
- Verify cloud name and upload preset
- Check upload preset is set to "Unsigned"
- Ensure file size is under 10 MB

**3. Login Failed**
- Verify user exists in Firebase Authentication
- Check user document exists in Firestore
- Ensure user status is "active"

**4. Permission Denied**
- Verify Firestore security rules are deployed
- Check user role in Firestore document
- Ensure user has correct permissions

For more troubleshooting, see [Local Deployment Guide](pashusetu-app/docs/LOCAL_DEPLOYMENT.md).

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use meaningful variable names
- Add comments for complex logic
- Follow React best practices
- Maintain bilingual support
- Test before submitting

---

## 📄 License

This project is proprietary software developed for government use.

**Copyright © 2026 PashuSetu**

All rights reserved. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

## 📞 Support

### Documentation
- [Firebase Setup Guide](pashusetu-app/docs/FIREBASE_SETUP.md)
- [Cloudinary Setup Guide](pashusetu-app/docs/CLOUDINARY_SETUP.md)
- [Local Deployment Guide](pashusetu-app/docs/LOCAL_DEPLOYMENT.md)
- [Features Documentation](pashusetu-app/docs/FEATURES.md)

### Contact
For support or inquiries:
- **Email:** support@pashusetu.com
- **Emergency Helpline:** 1800-XXX-XXXX (Toll Free)
- **Office:** Contact your district collector office or SPCA office

### Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Cloudinary for image management
- React team for the amazing framework
- Open source community for libraries and tools

---

## 📈 Roadmap

### Version 1.0 (Current)
- ✅ Digital receipt creation
- ✅ Public verification
- ✅ Multi-market support
- ✅ Admin management
- ✅ Image uploads
- ✅ Digital signatures
- ✅ **Universal market hours control**
- ✅ **Market data analytics** (7/30 days, quarter, year)
- ✅ **Auto-redirect for logged-in users**
- ✅ **Real-time market status display**
- ✅ **PWA Support** - Install as app, offline mode, push notifications

### Version 2.0 (Planned)
- 📱 Native mobile apps (iOS/Android)
- 📧 Email notifications
- 💬 SMS alerts
- 📊 Advanced analytics
- 🌍 Multi-language support
- 📄 PDF export
- 🔍 Advanced search
- 🔄 Background sync for offline receipts

### Version 3.0 (Future)
- 🤖 AI-powered verification
- 🔗 Government database integration
- 💳 Payment gateway integration
- 📈 Predictive analytics
- 🌐 API for third-party integration

---

## 📝 Changelog

### v1.0.0 (2026-05-01)
- Initial release
- Complete receipt management system
- Public verification
- Multi-market support
- Admin management
- Image and signature support
- Bilingual interface
- Responsive design

---

**Made with ❤️ for Indian Livestock Markets**

**पशु बाजारों के लिए डिजिटल समाधान**
