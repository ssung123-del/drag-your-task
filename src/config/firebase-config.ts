type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const fallbackConfig: FirebaseConfig = {
  apiKey: "AIzaSyD69BUnoycpMII3yrGSHadsaCai8lWAcKk",
  authDomain: "drag-your-task-3119f.firebaseapp.com",
  projectId: "drag-your-task-3119f",
  storageBucket: "drag-your-task-3119f.firebasestorage.app",
  messagingSenderId: "10639311590",
  appId: "1:10639311590:web:2032617a5bb3881a4cb127",
};

const envConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const hasCompleteEnvConfig = Object.values(envConfig).every(Boolean);

if (!hasCompleteEnvConfig && import.meta.env.DEV) {
  console.warn(
    "[firebase] Missing VITE_FIREBASE_* environment variables. Falling back to embedded config."
  );
}

export const firebaseConfig: FirebaseConfig = hasCompleteEnvConfig
  ? envConfig
  : fallbackConfig;
