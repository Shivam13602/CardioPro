import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration with updated storageBucket
const firebaseConfig = {
  apiKey: "AIzaSyCWlfTWl2BiLPn0GO8HGNBqSnc6eqtbHSg",
  authDomain: "cardiopro-e0141.firebaseapp.com",
  projectId: "cardiopro-e0141",
  storageBucket: "cardiopro-e0141.appspot.com",
  messagingSenderId: "765894312952",
  appId: "1:765894312952:web:58d813fc2099bdde47cc0d",
  measurementId: "G-YM8M3NE4TD"
};

// Initialize Firebase with the configuration
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it for use in your app
const auth = getAuth(app);

export { app, auth };