import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Firebase configuration for Interview AI
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAxtOG-bjMgBpBXCH0IxYqKCQd5orOach0",
  authDomain: "interview-33adc.firebaseapp.com",
  projectId: "interview-33adc",
  storageBucket: "interview-33adc.firebasestorage.app",
  messagingSenderId: "583826436173",
  appId: "1:583826436173:web:61af5624bc876675c96c04",
  measurementId: "G-LBQQQR18Y8"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication
export const auth = getAuth(app)

export default app
