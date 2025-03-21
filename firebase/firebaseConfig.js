// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAaym48NkjzEqj_gqhRcR1n3UZoQOBTuB4",
    authDomain: "budgetwise-26aa9.firebaseapp.com",
    projectId: "budgetwise-26aa9",
    storageBucket: "budgetwise-26aa9.firebasestorage.app",
    messagingSenderId: "1064316426559",
    appId: "1:1064316426559:web:0f748ec0e0c587e0775b8a",
    measurementId: "G-CVNJHPNH2Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);