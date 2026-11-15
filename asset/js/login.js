// ========================================
// WMF CLIENT LOGIN SYSTEM
// Wise Media Freelance
// ========================================

import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// ========================================
// LOGIN ELEMENTS
// ========================================

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");

const loginMessage = document.getElementById("loginMessage");

const forgotPasswordLink = document.getElementById("forgotPassword");


// ========================================
// DISPLAY MESSAGE
// ========================================

function showMessage(message, type = "error") {

    if (!loginMessage) return;

    loginMessage.textContent = message;

    loginMessage.className = "auth-message " + type;

}


// ========================================
// VERIFY CLIENT PROFILE
// ========================================

async function verifyClientProfile(user) {

    const userRef = doc(db, "users", user.uid);

    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {

        throw new Error("PROFILE_NOT_FOUND");

    }

    const profile = userSnapshot.data();

    if (profile.role !== "client") {

        throw new Error("INVALID_ROLE");

    }

    if (profile.accountStatus !== "active") {

        throw new Error("ACCOUNT_INACTIVE");

    }

    return true;

}


// ========================================
// CLIENT LOGIN
// ========================================

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = emailInput.value.trim().toLowerCase();

        const password = passwordInput.value;

        if (!email || !password) {

            showMessage("Please enter your email address and password.");

            return;

        }

        try {

            loginButton.disabled = true;

            loginButton.textContent = "Signing In...";

            showMessage("Checking your account...", "success");

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            await verifyClientProfile(user);

            showMessage(
                "Login successful! Redirecting to your dashboard...",
                "success"
            );

            window.location.replace("client-dashboard.html");

        } catch (error) {

            console.error("Client login error:", error);

            let message = "Unable to sign in. Please try again.";

            if (error.code === "auth/invalid-credential") {

                message = "Incorrect email address or password.";

            } else if (error.code === "auth/user-not-found") {

                message = "No account was found with this email address.";

            } else if (error.code === "auth/wrong-password") {

                message = "Incorrect password. Please try again.";

            } else if (error.code === "auth/invalid-email") {

                message = "Please enter a valid email address.";

            } else if (error.code === "auth/user-disabled") {

                message = "This account has been disabled. Please contact support.";

            } else if (error.message === "PROFILE_NOT_FOUND") {

                message = "Your account profile could not be found. Please contact support.";

            } else if (error.message === "INVALID_ROLE") {

                message = "This account is not registered as a client account.";

            } else if (error.message === "ACCOUNT_INACTIVE") {

                message = "Your account is not currently active. Please contact support.";

            } else if (error.code === "permission-denied") {

                message = "Unable to verify your account permissions. Please try again.";

            } else if (error.code === "unavailable") {

                message = "Connection problem. Please check your internet and try again.";

            }

            // End the session if authentication succeeded
            // but profile verification failed.

            if (auth.currentUser) {

                await signOut(auth).catch(signOutError => {
                    console.error("Session cleanup error:", signOutError);
                });

            }

            showMessage(message);

            loginButton.disabled = false;

            loginButton.textContent = "Login";

        }

    });

}


// ========================================
// FORGOT PASSWORD
// ========================================

if (forgotPasswordLink) {

    forgotPasswordLink.addEventListener("click", async (event) => {

        event.preventDefault();

        const email = emailInput.value.trim().toLowerCase();

        if (!email) {

            showMessage(
                "Please enter your email address first, then select Forgot Password."
            );

            emailInput.focus();

            return;

        }

        try {

            forgotPasswordLink.textContent = "Sending...";

            await sendPasswordResetEmail(auth, email);

            showMessage(
                "If an account exists for this email address, a password reset email will be sent. Please check your inbox and spam folder.",
                "success"
            );

        } catch (error) {

            console.error("Password reset error:", error);

            let message = "Unable to send the password reset email. Please try again.";

            if (error.code === "auth/invalid-email") {

                message = "Please enter a valid email address.";

            } else if (error.code === "auth/too-many-requests") {

                message = "Too many attempts. Please wait before trying again.";

            }

            showMessage(message);

        } finally {

            forgotPasswordLink.textContent = "Forgot Password?";

        }

    });

}
