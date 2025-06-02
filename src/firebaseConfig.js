// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBKAMzUG2Ekpm3Dbo65XWW9ndg-QRE0_Bo",
  authDomain: "transitcrew-305e5.firebaseapp.com",
  databaseURL: "https://transitcrew-305e5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "transitcrew-305e5",
  storageBucket: "transitcrew-305e5.appspot.com", // NOTE: fix typo here too!
  messagingSenderId: "420837871752",
  appId: "1:420837871752:web:4ad605d64d798d2ba08f3d",
  measurementId: "G-4753K67MRM"
};

// ✅ Initialize Firebase only once
const app = initializeApp(firebaseConfig);

// ✅ Setup Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
