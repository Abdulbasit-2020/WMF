// ========================================
// WMF CLIENT DASHBOARD
// Wise Media Freelance
// ========================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// ========================================
// DASHBOARD ELEMENTS
// ========================================

const fullNameElement = document.getElementById("clientFullName");
const emailElement = document.getElementById("clientEmail");
const statusElement = document.getElementById("clientStatus");
const memberSinceElement = document.getElementById("memberSince");

const welcomeNameElement = document.getElementById("welcomeName");
const dashboardNotice = document.getElementById("dashboardNotice");

const logoutButton = document.getElementById("logoutButton");


// ========================================
// DISPLAY MESSAGE
// ========================================

function showNotice(message) {

    if (dashboardNotice) {
        dashboardNotice.innerHTML = message;
    }

}


// ========================================
// LOAD CLIENT PROFILE
// ========================================

async function loadClientProfile(user) {

    try {

        const userRef = doc(db, "users", user.uid);

        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {

            showNotice(
                "<strong>Profile not found.</strong><br>" +
                "Your authentication account exists, but your " +
                "client profile could not be found. Please contact support."
            );

            return;

        }

        const profile = userSnapshot.data();

        // Display full name
        const fullName = profile.fullName || user.displayName || "Client";

        if (fullNameElement) {
            fullNameElement.textContent = fullName;
        }

        if (welcomeNameElement) {
            welcomeNameElement.textContent = fullName;
        }

        // Display email
        if (emailElement) {
            emailElement.textContent = profile.email || user.email || "Unavailable";
        }

        // Display account status
        if (statusElement) {
            statusElement.textContent = profile.accountStatus || "Unknown";
        }

        // Display registration date
        if (memberSinceElement) {

            const createdAt = profile.createdAt;

            if (createdAt && typeof createdAt.toDate === "function") {

                memberSinceElement.textContent =
                    createdAt.toDate().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    });

            } else {

                memberSinceElement.textContent = "Unavailable";

            }

        }

        showNotice(
            "<strong>Account connected successfully.</strong><br>" +
            "Your personal account information is now loaded."
        );

    } catch (error) {

        console.error("Dashboard profile error:", error);

        showNotice(
            "<strong>Unable to load your profile.</strong><br>" +
            "Please refresh the page or try again later."
        );

    }

}


// ========================================
// AUTHENTICATION CHECK
// ========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace("login.html");

        return;

    }

    await loadClientProfile(user);

});


// ========================================
// CLIENT LOGOUT
// ========================================

if (logoutButton) {

    logoutButton.addEventListener("click", async (event) => {

        event.preventDefault();

        const confirmLogout = confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmLogout) {
            return;
        }

        try {

            await signOut(auth);

            window.location.replace("login.html");

        } catch (error) {

            console.error("Logout error:", error);

            alert("Unable to log out. Please try again.");

        }

    });

}
