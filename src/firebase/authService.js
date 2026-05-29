import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, db } from './config';

export const loginUser = async (email, password, rememberMe = true) => {
  try {
    // Set persistence based on remember me option
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    
    console.log('Attempting login with persistence:', rememberMe ? 'LOCAL' : 'SESSION');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Firebase Auth successful for:', user.email);
    
    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      console.error('User document not found in Firestore');
      await signOut(auth);
      throw new Error('User data not found in database. Please contact administrator.');
    }
    
    const userData = userDoc.data();
    console.log('User data fetched from Firestore:', userData.role);
    
    // Check if user is active
    if (userData.status && userData.status !== 'active') {
      console.warn('User account status:', userData.status);
      await signOut(auth);
      
      const statusMessages = {
        blocked: 'Your account has been blocked. Please contact administrator.',
        suspended: 'Your account has been suspended. Please contact administrator.',
        deleted: 'Your account has been deleted. Please contact administrator.'
      };
      throw new Error(statusMessages[userData.status] || 'Your account is not active. Please contact administrator.');
    }
    
    const fullUserData = {
      uid: user.uid,
      email: user.email,
      ...userData
    };
    
    console.log('Login successful for:', fullUserData.email, 'Role:', fullUserData.role);
    
    return fullUserData;
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    console.log('Signing out user...');
    await signOut(auth);
    console.log('Sign out successful');
    
    // Clear any local storage items
    localStorage.removeItem('lastRoute');
    sessionStorage.clear();
    
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const createUser = async (email, password, userData) => {
  let secondaryApp = null;
  let secondaryAuth = null;
  
  try {
    console.log('Step 1: Creating user in Firebase Auth using secondary app...');
    console.log('Email:', email);
    console.log('User data to save:', userData);
    
    // Create a secondary Firebase app instance to avoid logging out the current user
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };
    
    secondaryApp = initializeApp(firebaseConfig, 'Secondary');
    secondaryAuth = getAuth(secondaryApp);
    
    // Create user in Firebase Authentication using secondary app
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = userCredential.user;
    
    console.log('Step 2: User created in Auth with UID:', user.uid);
    
    // Generate Admin ID (3 letters from name + 4 random numbers)
    let adminId = '';
    if (userData.role === 'market-admin' && userData.name) {
      const nameLetters = userData.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
      const randomNumbers = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      adminId = nameLetters + randomNumbers;
      console.log('Generated Admin ID:', adminId);
    }
    
    // Prepare user data for Firestore
    const firestoreData = {
      ...userData,
      ...(adminId && { adminId }), // Add adminId only if it exists
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    console.log('Step 3: Saving to Firestore...');
    console.log('Document path: users/' + user.uid);
    console.log('Data to save:', firestoreData);
    
    // Save user data to Firestore (using main db instance)
    await setDoc(doc(db, 'users', user.uid), firestoreData);
    
    console.log('Step 4: Successfully saved to Firestore');
    
    // Verify the document was created
    const verifyDoc = await getDoc(doc(db, 'users', user.uid));
    if (verifyDoc.exists()) {
      console.log('Step 5: Verification successful - Document exists');
      console.log('Saved data:', verifyDoc.data());
    } else {
      console.error('Step 5: Verification FAILED - Document does not exist!');
      throw new Error('Failed to save user data to Firestore');
    }
    
    // Sign out from secondary auth and delete the secondary app
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    console.log('Secondary app cleaned up - main user session preserved');
    
    return user;
  } catch (error) {
    console.error('Create user error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Cleanup secondary app if it exists
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
        console.log('Secondary app deleted after error');
      } catch (deleteError) {
        console.error('Failed to delete secondary app:', deleteError);
      }
    }
    
    throw error;
  }
};
