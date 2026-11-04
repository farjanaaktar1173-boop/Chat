/* login/firebase-config.js — Firebase সংযোগ (আপনার প্রজেক্ট: room-7fbf7) */
window.MOI_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCTn3QEYtRMxm7Y91RSFSvbRJSRHcXMEdI",
    authDomain: "room-7fbf7.firebaseapp.com",
    databaseURL: "https://room-7fbf7-default-rtdb.firebaseio.com",
    projectId: "room-7fbf7",
    storageBucket: "room-7fbf7.firebasestorage.app",
    messagingSenderId: "417946695868",
    appId: "1:417946695868:web:34c6f63269aaf659b2b8b9"
};

firebase.initializeApp(window.MOI_FIREBASE_CONFIG);
window.MOI_AUTH = firebase.auth();
window.MOI_RTDB = firebase.database();
console.log('[MOI] Firebase connected');
