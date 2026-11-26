
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCR-Io7nILzpu2lSxeKS57RoCAq5ifZCiY",
  authDomain: "tools-giang-day.firebaseapp.com",
  projectId: "tools-giang-day",
  storageBucket: "tools-giang-day.firebasestorage.app",
  messagingSenderId: "437301341837",
  appId: "1:437301341837:web:85b4f4f157b3b430167cc4"
};

// Khởi tạo Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Khởi tạo Firestore và Auth
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
