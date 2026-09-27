import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc 
} from 'firebase/firestore';
import { DiaryEntry, WizardProfile } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyDrv-bqDNpd__ZbZ45KWSbXTybOZof8hDc",
  authDomain: "the-book-of-voldmorted-secrets.firebaseapp.com",
  projectId: "the-book-of-voldmorted-secrets",
  firestoreDatabaseId: "ai-studio-thediaryofsecret-c815b86d-00a9-4655-a07d-7fc9c3671447",
  storageBucket: "the-book-of-voldmorted-secrets.firebasestorage.app",
  messagingSenderId: "919893269579",
  appId: "1:919893269579:web:4550576b2b31b234e901ce"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Authentication & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore using the designated databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// --- AUTHENTICATION HELPERS ---

/**
 * Sign in with Google using Firebase Authentication popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Sign out current wizard user
 */
export async function signOutWizard(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

/**
 * Subscribe to Auth State changes
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// --- FIRESTORE DATABASE HELPERS (PERSIST & RETRIEVE CONVERSATIONS) ---

/**
 * Save or update user wizard profile in Firestore
 */
export async function saveUserProfileToCloud(user: User, profileData: Partial<WizardProfile>): Promise<void> {
  if (!user || !user.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userRef);
    const existing = existingSnap.exists() ? existingSnap.data() : {};

    await setDoc(userRef, {
      ...existing,
      uid: user.uid,
      displayName: user.displayName || profileData.name || 'Hogwarts Student',
      email: user.email || '',
      photoURL: user.photoURL || '',
      house: profileData.house || existing.house || 'Slytherin',
      bloodStatus: profileData.bloodStatus || existing.bloodStatus || 'Half-blood',
      grade: profileData.grade || existing.grade || 'Fifth Year',
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user profile to cloud:', error);
  }
}

/**
 * Get wizard profile from Firestore
 */
export async function getUserProfileFromCloud(userId: string): Promise<Partial<WizardProfile> | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as Partial<WizardProfile>;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile from cloud:', error);
    return null;
  }
}

/**
 * Store a diary conversation exchange with Tom Riddle into Firestore
 */
export async function saveDiaryEntryToCloud(userId: string, entry: DiaryEntry): Promise<void> {
  if (!userId || !entry || !entry.id) return;
  try {
    const entryRef = doc(db, 'users', userId, 'diaryEntries', entry.id);
    await setDoc(entryRef, {
      id: entry.id,
      userId,
      wizardName: entry.wizardName || 'Student',
      house: entry.house || 'Slytherin',
      timestamp: entry.timestamp || new Date().toISOString(),
      userText: entry.userText || '',
      ghostReply: entry.ghostReply || '',
      ghostAuthor: entry.ghostAuthor || 'Tom Marvolo Riddle',
      isEnchantedMemory: Boolean(entry.isEnchantedMemory),
      category: entry.category || 'Confession',
      inkColor: entry.inkColor || '#22c55e',
      drawingData: entry.drawingData || '',
      isAI: Boolean(entry.isAI),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving diary secret to Firestore:', error);
    throw error;
  }
}

/**
 * Real-time subscription to retrieve all diary conversations for the logged-in wizard
 */
export function subscribeToUserDiaryEntries(
  userId: string, 
  callback: (entries: DiaryEntry[]) => void
) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'diaryEntries');
  const q = query(entriesRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const entries: DiaryEntry[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      entries.push({
        id: data.id || docSnap.id,
        wizardId: data.userId || userId,
        wizardName: data.wizardName || 'Student',
        house: data.house || 'Slytherin',
        timestamp: data.timestamp || new Date().toISOString(),
        userText: data.userText || '',
        ghostReply: data.ghostReply || '',
        ghostAuthor: data.ghostAuthor || 'Tom Marvolo Riddle',
        isEnchantedMemory: Boolean(data.isEnchantedMemory),
        category: data.category || 'Confession',
        inkColor: data.inkColor || '#22c55e',
        drawingData: data.drawingData || '',
        isAI: Boolean(data.isAI),
      });
    });
    callback(entries);
  }, (error) => {
    console.error('Firestore diaryEntries subscription error:', error);
  });
}

/**
 * Delete a secret entry from cloud
 */
export async function deleteDiaryEntryFromCloud(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  try {
    const entryRef = doc(db, 'users', userId, 'diaryEntries', entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    console.error('Error deleting diary secret from cloud:', error);
  }
}
