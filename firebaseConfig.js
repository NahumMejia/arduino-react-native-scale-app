// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-I4gdTBy9aComSIXQNs1qOAimay7dALs",
  authDomain: "arduinobascula.firebaseapp.com",
  projectId: "arduinobascula",
  storageBucket: "arduinobascula.firebasestorage.app",
  messagingSenderId: "897300868857",
  appId: "1:897300868857:web:68148604348d013b5a3c28"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);