// Mock data for demonstration purposes
// In production, this would be replaced with Firebase/backend API calls

export const mockUsers = [
  {
    id: '1',
    username: 'superadmin',
    password: 'admin123',
    name: 'Super Administrator',
    role: 'super-admin'
  },
  {
    id: '2',
    username: 'market1',
    password: 'market123',
    name: 'Market Admin 1',
    role: 'market-admin',
    marketId: 'MKT001',
    marketName: 'Central Livestock Market'
  },
  {
    id: '3',
    username: 'market2',
    password: 'market123',
    name: 'Market Admin 2',
    role: 'market-admin',
    marketId: 'MKT002',
    marketName: 'East Zone Market'
  }
];

export const mockMarkets = [
  {
    id: 'MKT001',
    name: 'Central Livestock Market',
    location: 'Central District',
    adminId: '2',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'MKT002',
    name: 'East Zone Market',
    location: 'East District',
    adminId: '3',
    createdAt: new Date('2024-02-01').toISOString()
  }
];

export const mockReceipts = [
  {
    id: 'RCP001',
    marketId: 'MKT001',
    marketName: 'Central Livestock Market',
    sellerName: 'राम कुमार',
    sellerFatherName: 'श्याम लाल',
    sellerMobile: '9876543210',
    sellerAadhar: '1234-5678-9012',
    sellerAddress: 'Village Rampur, Tehsil Sadar',
    animalType: 'Cow',
    animalCount: 2,
    animalColor: 'White with brown patches',
    earTagNumber: 'TAG12345',
    vehicleNumber: 'UP-32-AB-1234',
    driverName: 'मोहन सिंह',
    fromLocation: 'Rampur Village',
    toLocation: 'City Market',
    animalPrice: 50000,
    marketFee: 500,
    date: new Date('2024-04-30').toISOString(),
    time: '10:30 AM',
    status: 'VALID',
    expiryTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // 7 hours from now
    createdBy: '2'
  },
  {
    id: 'RCP002',
    marketId: 'MKT001',
    marketName: 'Central Livestock Market',
    sellerName: 'सुरेश पटेल',
    sellerFatherName: 'रामेश्वर पटेल',
    sellerMobile: '9876543211',
    sellerAadhar: '2345-6789-0123',
    sellerAddress: 'Village Shivpur, Tehsil North',
    animalType: 'Bull',
    animalCount: 1,
    animalColor: 'Black',
    earTagNumber: 'TAG12346',
    vehicleNumber: 'UP-32-CD-5678',
    driverName: 'राजेश यादव',
    fromLocation: 'Shivpur Village',
    toLocation: 'Dairy Farm',
    animalPrice: 75000,
    marketFee: 750,
    date: new Date('2024-04-29').toISOString(),
    time: '11:45 AM',
    status: 'VALID',
    expiryTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    createdBy: '2'
  }
];

// Helper functions
export const authenticateUser = (username, password) => {
  return mockUsers.find(
    user => user.username === username && user.password === password
  );
};

export const getMarketById = (marketId) => {
  return mockMarkets.find(market => market.id === marketId);
};

export const getReceiptsByMarketId = (marketId) => {
  return mockReceipts.filter(receipt => receipt.marketId === marketId);
};

export const getAllReceipts = () => {
  return mockReceipts;
};

export const getReceiptById = (receiptId) => {
  return mockReceipts.find(receipt => receipt.id === receiptId);
};

export const isMarketOpen = () => {
  const now = new Date();
  const hours = now.getHours();
  // Market open from 8 AM to 4 PM
  return hours >= 8 && hours < 16;
};

export const calculateReceiptStatus = (receipt) => {
  const now = new Date();
  const expiryTime = new Date(receipt.expiryTime);
  
  if (now > expiryTime) {
    return 'EXPIRED';
  }
  
  // Add logic for suspicious receipts if needed
  return 'VALID';
};

// Calculate expiry time as 5 PM (17:00) of the same day
export const calculateExpiryTime = (createdDate) => {
  const date = new Date(createdDate);
  // Set time to 5 PM (17:00:00)
  date.setHours(17, 0, 0, 0);
  return date;
};

// Get valid until time string (always 5 PM)
export const getValidUntilTime = () => {
  return '05:00 PM';
};

export const generateReceiptId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RCP${timestamp}${random}`;
};

export const generateMarketId = () => {
  const count = mockMarkets.length + 1;
  return `MKT${String(count).padStart(3, '0')}`;
};
