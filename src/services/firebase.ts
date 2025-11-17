import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlDHWgHEaU5-3oP0GUrPCcCFDQJGhSnM4",
  authDomain: "smart-resume-analyzer-a7425.firebaseapp.com",
  projectId: "smart-resume-analyzer-a7425",
  storageBucket: "smart-resume-analyzer-a7425.firebasestorage.app",
  messagingSenderId: "234913563313",
  appId: "1:234913563313:web:510c78a2d874be125e9890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
