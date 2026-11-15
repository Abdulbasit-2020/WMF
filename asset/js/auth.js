// ========================================
// WMF AUTHENTICATION SYSTEM
// Wise Media Freelance
// ========================================

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// ========================================
// CLIENT REGISTRATION
// ========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();

        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        const terms = document.getElementById("terms").checked;

        const submitButton = registerForm.querySelector(
            'button[type="submit"]'
        );

        if (!fullName || !email || !phone || !password) {
            alert("Please complete all required fields.");
            return;
        }

        if (password.length < 8) {
            alert("Your password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Your passwords do not match.");
            return;
        }

        if (!terms) {
            alert("Please accept the terms and conditions.");
            return;
        }

        try {

            submitButton.disabled = true;
            submitButton.textContent = "Creating Account...";

            // Create Firebase Authentication account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // Save the client's display name
            await updateProfile(user, {
                displayName: fullName
            });

            // Create the client's Firestore profile
            await setDoc(doc(db, "users", user.uid), {

                uid: user.uid,
                fullName: fullName,
                email: email,
                phone: phone,

                role: "client",
                accountStatus: "active",

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()

            });

            alert("Your account has been created successfully!");

            window.location.href = "client-dashboard.html";

        } catch (error) {

            console.error("Registration error:", error);

            let message = "Registration failed. Please try again.";

            if (error.code === "auth/email-already-in-use") {
                message = "This email address is already registered.";
            } else if (error.code === "auth/invalid-email") {
                message = "Please enter a valid email address.";
            } else if (error.code === "auth/weak-password") {
                message = "Please choose a stronger password.";
            } else if (error.code === "permission-denied") {
                message = "Your account was created, but your profile could not be saved. Please contact support.";
            }

            alert(message);

            submitButton.disabled = false;
            submitButton.textContent = "Create Account";

        }

    });

}
