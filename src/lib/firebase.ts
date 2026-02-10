
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD69BUnoycpMII3yrGSHadsaCai8lWAcKk",
    authDomain: "drag-your-task-3119f.firebaseapp.com",
    projectId: "drag-your-task-3119f",
    storageBucket: "drag-your-task-3119f.firebasestorage.app",
    messagingSenderId: "10639311590",
    appId: "1:10639311590:web:2032617a5bb3881a4cb127"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 서비스 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
