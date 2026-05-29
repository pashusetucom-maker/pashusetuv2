import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';

// Helper function to generate market ID
const generateMarketId = (marketName) => {
  // Get first 3 letters of market name (uppercase)
  const prefix = marketName
    .replace(/[^a-zA-Z]/g, '') // Remove non-alphabetic characters
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X'); // If less than 3 letters, pad with 'X'
  
  // Generate 4 random numbers (1000-9999)
  const randomNumbers = Math.floor(1000 + Math.random() * 9000); // 4 digit number
  
  return `${prefix}${randomNumbers}`;
};

// Markets
export const createMarket = async (marketData) => {
  try {
    // Generate market ID from market name
    const marketId = generateMarketId(marketData.name);
    
    // Check if market ID already exists (rare collision case)
    const existingMarket = await getDoc(doc(db, 'markets', marketId));
    if (existingMarket.exists()) {
      // If collision, regenerate with timestamp
      const timestamp = Date.now().toString().slice(-4);
      const newMarketId = `${marketData.name.substring(0, 3).toUpperCase()}${timestamp}`;
      
      await setDoc(doc(db, 'markets', newMarketId), {
        ...marketData,
        marketId: newMarketId,
        status: 'active', // active, blocked, suspended
        createdAt: Timestamp.now()
      });
      
      return newMarketId;
    }
    
    // Create market with generated ID
    await setDoc(doc(db, 'markets', marketId), {
      ...marketData,
      marketId: marketId,
      status: 'active', // active, blocked, suspended
      createdAt: Timestamp.now()
    });
    
    return marketId;
  } catch (error) {
    console.error('Create market error:', error);
    throw error;
  }
};

export const getAllMarkets = async () => {
  try {
    const marketsSnapshot = await getDocs(collection(db, 'markets'));
    return marketsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get markets error:', error);
    throw error;
  }
};

// Receipts
export const createReceipt = async (receiptData) => {
  try {
    // Use the receipt ID from receiptData if provided, otherwise generate a new one
    const receiptId = receiptData.id || `PS${Date.now().toString().slice(-8)}`;
    
    await setDoc(doc(db, 'receipts', receiptId), {
      ...receiptData,
      id: receiptId,
      createdAt: Timestamp.now(),
      status: 'VALID'
    });
    
    return receiptId;
  } catch (error) {
    console.error('Create receipt error:', error);
    throw error;
  }
};

export const getReceiptById = async (receiptId) => {
  try {
    const receiptDoc = await getDoc(doc(db, 'receipts', receiptId));
    if (receiptDoc.exists()) {
      return {
        id: receiptDoc.id,
        ...receiptDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Get receipt error:', error);
    throw error;
  }
};

export const getReceiptsByMarketId = async (marketId) => {
  try {
    const q = query(
      collection(db, 'receipts'),
      where('marketId', '==', marketId),
      orderBy('createdAt', 'desc')
    );
    
    const receiptsSnapshot = await getDocs(q);
    return receiptsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get receipts by market error:', error);
    throw error;
  }
};

export const getAllReceipts = async () => {
  try {
    const q = query(
      collection(db, 'receipts'),
      orderBy('createdAt', 'desc')
    );
    
    const receiptsSnapshot = await getDocs(q);
    return receiptsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get all receipts error:', error);
    throw error;
  }
};

export const updateReceiptStatus = async (receiptId, status) => {
  try {
    await updateDoc(doc(db, 'receipts', receiptId), {
      status,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Update receipt status error:', error);
    throw error;
  }
};

// Users
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};

// User Management Functions
export const updateUserStatus = async (userId, status) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: status, // active, blocked, suspended, deleted
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Update user status error:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'deleted',
      deletedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

export const blockUser = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'blocked',
      blockedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Block user error:', error);
    throw error;
  }
};

export const suspendUser = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'suspended',
      suspendedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    throw error;
  }
};

export const activateUser = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'active',
      activatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Activate user error:', error);
    throw error;
  }
};

// Delete receipt (Super Admin only)
export const deleteReceipt = async (receiptId) => {
  try {
    await deleteDoc(doc(db, 'receipts', receiptId));
    console.log('Receipt deleted successfully:', receiptId);
  } catch (error) {
    console.error('Delete receipt error:', error);
    throw error;
  }
};

// State-wise analytics
export const getReceiptsByState = async (state, role = 'buyer') => {
  try {
    const fieldName = role === 'buyer' ? 'buyerState' : 'sellerState';
    const q = query(
      collection(db, 'receipts'),
      where(fieldName, '==', state),
      orderBy('createdAt', 'desc')
    );
    
    const receiptsSnapshot = await getDocs(q);
    return receiptsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get receipts by state error:', error);
    throw error;
  }
};

// Get all receipts with state information
export const getAllReceiptsWithStates = async () => {
  try {
    const q = query(
      collection(db, 'receipts'),
      orderBy('createdAt', 'desc')
    );
    
    const receiptsSnapshot = await getDocs(q);
    return receiptsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get all receipts with states error:', error);
    throw error;
  }
};

// Frequent buyer/seller analytics
export const getFrequentBuyers = async (limit = 10) => {
  try {
    const receiptsSnapshot = await getDocs(collection(db, 'receipts'));
    const buyerMap = new Map();
    
    console.log('Total receipts in database:', receiptsSnapshot.docs.length);
    
    receiptsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Remove spaces from Aadhaar for consistent grouping
      const buyerKey = data.buyerAadhar ? data.buyerAadhar.replace(/\s/g, '') : null;
      
      if (buyerKey) {
        console.log('Processing receipt:', doc.id, 'Buyer Aadhaar:', buyerKey);
        
        if (buyerMap.has(buyerKey)) {
          const existing = buyerMap.get(buyerKey);
          existing.count += 1;
          existing.totalAmount += parseFloat(data.animalPrice || 0);
          existing.receipts.push({
            id: doc.id,
            date: data.createdAt,
            amount: data.animalPrice,
            animalType: data.animalType,
            animalCount: data.animalCount
          });
          console.log('Updated buyer:', buyerKey, 'New count:', existing.count);
        } else {
          buyerMap.set(buyerKey, {
            name: data.buyerName,
            mobile: data.buyerMobile,
            aadhar: data.buyerAadhar,
            village: data.buyerVillage,
            tehsil: data.buyerTehsil,
            state: data.buyerState || 'Madhya Pradesh',
            marketId: data.marketId,
            marketName: data.marketName,
            count: 1,
            totalAmount: parseFloat(data.animalPrice || 0),
            receipts: [{
              id: doc.id,
              date: data.createdAt,
              amount: data.animalPrice,
              animalType: data.animalType,
              animalCount: data.animalCount
            }]
          });
          console.log('New buyer added:', buyerKey, 'Count: 1');
        }
      }
    });
    
    console.log('Buyer map size:', buyerMap.size);
    
    // Convert to array and sort by count
    const buyers = Array.from(buyerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    console.log('Top buyers:', buyers.map(b => ({ name: b.name, count: b.count, receipts: b.receipts.length })));
    
    return buyers;
  } catch (error) {
    console.error('Get frequent buyers error:', error);
    throw error;
  }
};

export const getFrequentSellers = async (limit = 10) => {
  try {
    const receiptsSnapshot = await getDocs(collection(db, 'receipts'));
    const sellerMap = new Map();
    
    console.log('Total receipts in database:', receiptsSnapshot.docs.length);
    
    receiptsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Remove spaces from Aadhaar for consistent grouping
      const sellerKey = data.sellerAadhar ? data.sellerAadhar.replace(/\s/g, '') : null;
      
      if (sellerKey) {
        console.log('Processing receipt:', doc.id, 'Seller Aadhaar:', sellerKey);
        
        if (sellerMap.has(sellerKey)) {
          const existing = sellerMap.get(sellerKey);
          existing.count += 1;
          existing.totalAmount += parseFloat(data.animalPrice || 0);
          existing.receipts.push({
            id: doc.id,
            date: data.createdAt,
            amount: data.animalPrice,
            animalType: data.animalType,
            animalCount: data.animalCount
          });
          console.log('Updated seller:', sellerKey, 'New count:', existing.count);
        } else {
          sellerMap.set(sellerKey, {
            name: data.sellerName,
            mobile: data.sellerMobile,
            aadhar: data.sellerAadhar,
            village: data.sellerVillage,
            tehsil: data.sellerTehsil,
            state: data.sellerState || 'Madhya Pradesh',
            marketId: data.marketId,
            marketName: data.marketName,
            count: 1,
            totalAmount: parseFloat(data.animalPrice || 0),
            receipts: [{
              id: doc.id,
              date: data.createdAt,
              amount: data.animalPrice,
              animalType: data.animalType,
              animalCount: data.animalCount
            }]
          });
          console.log('New seller added:', sellerKey, 'Count: 1');
        }
      }
    });
    
    console.log('Seller map size:', sellerMap.size);
    
    // Convert to array and sort by count
    const sellers = Array.from(sellerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    console.log('Top sellers:', sellers.map(s => ({ name: s.name, count: s.count, receipts: s.receipts.length })));
    
    return sellers;
  } catch (error) {
    console.error('Get frequent sellers error:', error);
    throw error;
  }
};

// State-wise statistics
export const getStateWiseStatistics = async () => {
  try {
    const receiptsSnapshot = await getDocs(collection(db, 'receipts'));
    const stateStats = new Map();
    
    receiptsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Create a unique key for state + market combination
      const buyerState = data.buyerState || 'Madhya Pradesh';
      const marketId = data.marketId || 'unknown';
      const marketName = data.marketName || 'Unknown Market';
      const buyerKey = `${buyerState}_${marketId}`;
      
      if (stateStats.has(buyerKey)) {
        const stats = stateStats.get(buyerKey);
        stats.buyerCount += 1;
        stats.totalBuyerAmount += parseFloat(data.animalPrice || 0);
        stats.totalTransactions += 1;
      } else {
        stateStats.set(buyerKey, {
          state: buyerState,
          marketId: marketId,
          marketName: marketName,
          buyerCount: 1,
          sellerCount: 0,
          totalBuyerAmount: parseFloat(data.animalPrice || 0),
          totalSellerAmount: 0,
          totalTransactions: 1
        });
      }
      
      // Seller state stats
      const sellerState = data.sellerState || 'Madhya Pradesh';
      const sellerKey = `${sellerState}_${marketId}`;
      
      if (stateStats.has(sellerKey)) {
        const stats = stateStats.get(sellerKey);
        stats.sellerCount += 1;
        stats.totalSellerAmount += parseFloat(data.animalPrice || 0);
        if (sellerState !== buyerState) {
          stats.totalTransactions += 1;
        }
      } else {
        stateStats.set(sellerKey, {
          state: sellerState,
          marketId: marketId,
          marketName: marketName,
          buyerCount: 0,
          sellerCount: 1,
          totalBuyerAmount: 0,
          totalSellerAmount: parseFloat(data.animalPrice || 0),
          totalTransactions: 1
        });
      }
    });
    
    // Convert to array and sort by total transactions
    const statistics = Array.from(stateStats.values())
      .sort((a, b) => b.totalTransactions - a.totalTransactions);
    
    return statistics;
  } catch (error) {
    console.error('Get state-wise statistics error:', error);
    throw error;
  }
};
