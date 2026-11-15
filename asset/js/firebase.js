// ========================================
// WMF FIREBASE CONFIGURATION
// Wise Media Freelance
// ========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// ========================================
// FIREBASE PROJECT CONFIGURATION
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyBRGVMYztAvCOP81pRmBmu4Yqk8QH9liBc",
    authDomain: "wise-media-freelance-2.firebaseapp.com",
    projectId: "wise-media-freelance-2",
    storageBucket: "wise-media-freelance-2.firebasestorage.app",
    messagingSenderId: "754673498973",
    appId: "1:754673498973:web:e397f40a2bffbb7585c6b4",
    measurementId: "G-CSPWZN9YMC"
};


// ========================================
// INITIALIZE FIREBASE
// ========================================

const app = initializeApp(firebaseConfig);


// ========================================
// INITIALIZE FIREBASE SERVICES
// ========================================

const auth = getAuth(app);

const db = getFirestore(app);


// ========================================
// EXPORT FIREBASE SERVICES
// ========================================

export {
    app,
    auth,
    db
};
