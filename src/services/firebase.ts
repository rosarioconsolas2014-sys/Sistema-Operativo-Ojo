import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

// Project default values from AI Studio provisioning
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBcuX4ybg4yyBdGQxotHStNDuGebMD2KeU",
  authDomain: "curious-bazaar-q0z9n.firebaseapp.com",
  projectId: "curious-bazaar-q0z9n",
  storageBucket: "curious-bazaar-q0z9n.firebasestorage.app",
  messagingSenderId: "980616264682",
  appId: "1:980616264682:web:9aa193b9d611dd72fcd093",
};

const DEFAULT_DATABASE_ID = "ai-studio-windowsdesktopsi-9f7b591b-5b33-4484-97f8-dcb5316efa35";

/**
 * Firebase configuration sourced primarily from Vite environment variables (VITE_FIREBASE_*),
 * with fallback to firebase-applet-config.json and default project credentials.
 */
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    appletConfig.apiKey ||
    DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    appletConfig.authDomain ||
    DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    appletConfig.projectId ||
    DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    appletConfig.storageBucket ||
    DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    appletConfig.messagingSenderId ||
    DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    appletConfig.appId ||
    DEFAULT_FIREBASE_CONFIG.appId,
};

/**
 * Firestore Database ID: Vite env variable with fallback to applet config and default ID.
 */
export const databaseId: string =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ||
  appletConfig.firestoreDatabaseId ||
  DEFAULT_DATABASE_ID;

// Initialize Firebase app singleton
export const app: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

/**
 * Firebase Authentication instance for user accounts, session state, and identity.
 */
export const auth: Auth = getAuth(app);

/**
 * Cloud Firestore database instance, initialized with the specific database ID.
 */
export const db: Firestore = getFirestore(app, databaseId);

/**
 * Firebase Cloud Storage instance for user binary files (wallpapers, paint drawings, explorer documents).
 */
export const storage: FirebaseStorage = getStorage(app);

// Operation types for Firestore error handling and diagnostics
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Robust error handling helper conforming to FirestoreErrorInfo format
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Tests connection to Cloud Firestore on boot
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is currently offline or unreachable.');
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Authentication Helpers
// ---------------------------------------------------------------------------

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signUpUser(email: string, pass: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function signInUser(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ---------------------------------------------------------------------------
// Firebase Storage Helpers (for Paint canvas, Wallpapers, Explorer uploads)
// ---------------------------------------------------------------------------

export async function uploadUserBinaryFile(
  userId: string,
  pathUnderUser: string,
  data: Blob | Uint8Array | ArrayBuffer
): Promise<string> {
  const storageRef = ref(storage, `users/${userId}/${pathUnderUser}`);
  await uploadBytes(storageRef, data);
  return getDownloadURL(storageRef);
}

export async function uploadUserDataUrl(
  userId: string,
  pathUnderUser: string,
  dataUrl: string
): Promise<string> {
  const storageRef = ref(storage, `users/${userId}/${pathUnderUser}`);
  await uploadString(storageRef, dataUrl, 'data_url');
  return getDownloadURL(storageRef);
}

export async function deleteUserFile(
  userId: string,
  pathUnderUser: string
): Promise<void> {
  const storageRef = ref(storage, `users/${userId}/${pathUnderUser}`);
  await deleteObject(storageRef);
}
