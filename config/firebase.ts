import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhoRRDK6uKylS-D21EAkZ9nGwt2RwGW_o",
  authDomain: "teachease-efecc.firebaseapp.com",
  projectId: "teachease-efecc",
  storageBucket: "teachease-efecc.appspot.com",
  messagingSenderId: "43351007947",
  appId: "1:43351007947:web:b7871b88f2a1d4c6eab14e",
  measurementId: "G-YPXJ2QPN6J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
