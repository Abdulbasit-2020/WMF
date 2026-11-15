// ========================================
// WMF BOOKING SYSTEM
// Wise Media Freelance
// ========================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// ========================================
// FORM ELEMENTS
// ========================================

const bookingForm = document.getElementById("bookingForm");

const bookingStatus = document.getElementById("bookingStatus");

const submitButton = document.getElementById("bookingSubmitButton");

const fullNameInput = document.getElementById("fullName");

const emailInput = document.getElementById("email");

const phoneInput = document.getElementById("phone");

let currentUser = null;
let currentClientProfile = null;


// ========================================
// DISPLAY STATUS MESSAGES
// ========================================

function showStatus(message, type = "info") {

    bookingStatus.textContent = message;

    bookingStatus.style.display = "block";

    if (type === "success") {
        bookingStatus.style.background = "#E8F7ED";
        bookingStatus.style.color = "#176B35";
    } else if (type === "error") {
        bookingStatus.style.background = "#FDECEC";
        bookingStatus.style.color = "#A12626";
    } else {
        bookingStatus.style.background = "#F3F4F6";
        bookingStatus.style.color = "#555555";
    }

}


// ========================================
// CHECK CLIENT AUTHENTICATION
// ========================================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;
    currentClientProfile = null;

    submitButton.disabled = true;

    if (!user) {

        showStatus(
            "Please log in to your client account before submitting a booking request."
        );

        return;
    }

    try {

        const profileRef = doc(db, "users", user.uid);

        const profileSnapshot = await getDoc(profileRef);

        if (!profileSnapshot.exists()) {

            showStatus(
                "Your client profile could not be found. Please contact support.",
                "error"
            );

            return;
        }

        const profile = profileSnapshot.data();

        if (
            profile.role !== "client" ||
            profile.accountStatus !== "active"
        ) {

            showStatus(
                "Your account is not authorized to submit booking requests.",
                "error"
            );

            return;
        }

        currentClientProfile = profile;

        // Populate authenticated client information.

        fullNameInput.value = profile.fullName || "";

        emailInput.value = user.email || profile.email || "";

        phoneInput.value = profile.phone || "";

        // Prevent changing account identity information here.

        fullNameInput.readOnly = true;

        emailInput.readOnly = true;

        showStatus(
            "Your client account is verified. You can now submit your booking request."
        );

        submitButton.disabled = false;

        submitButton.textContent = "Submit Booking Request";

    } catch (error) {

        console.error("Client verification error:", error);

        showStatus(
            "Unable to verify your client account. Please refresh the page and try again.",
            "error"
        );

    }

});


// ========================================
// SUBMIT BOOKING REQUEST
// ========================================

bookingForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!currentUser || !currentClientProfile) {

        showStatus(
            "Please log in with an active client account before submitting.",
            "error"
        );

        return;
    }

    if (!bookingForm.reportValidity()) {
        return;
    }

    const serviceCategory =
        document.getElementById("serviceCategory").value;

    const serviceType =
        document.getElementById("serviceType").value;

    const technicalSection =
        document.getElementById("technicalSection");

    const needsTechnicalDetails =
        technicalSection.classList.contains("active");

    const agreement =
        document.getElementById("agreement").checked;

    if (!serviceCategory || !serviceType) {

        showStatus(
            "Please select a service category and specific service.",
            "error"
        );

        return;
    }

    if (!agreement) {

        showStatus(
            "Please confirm the information provided before submitting.",
            "error"
        );

        return;
    }

    // Collect booking information.

    const bookingData = {

        userId: currentUser.uid,

        clientName: currentClientProfile.fullName,

        clientEmail: currentUser.email,

        clientPhone: phoneInput.value.trim(),

        country:
            document.getElementById("country").value.trim(),

        projectTitle:
            document.getElementById("projectTitle").value.trim(),

        serviceCategory: serviceCategory,

        serviceType: serviceType,

        deadline:
            document.getElementById("deadline").value,

        budget:
            document.getElementById("budget").value.trim(),

        projectDescription:
            document.getElementById("projectDescription").value.trim(),

        projectStage: needsTechnicalDetails
            ? document.getElementById("projectStage").value
            : "",

        websiteType: needsTechnicalDetails
            ? document.getElementById("websiteType").value
            : "",

        existingWebsite: needsTechnicalDetails
            ? document.getElementById("existingWebsite").value.trim()
            : "",

        technologies: needsTechnicalDetails
            ? document.getElementById("technologies").value.trim()
            : "",

        functionality: needsTechnicalDetails
            ? document.getElementById("functionality").value.trim()
            : "",

        agreement: true,

        status: "pending",

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp()

    };


    // Submit to Firestore.

    try {

        submitButton.disabled = true;

        submitButton.textContent = "Submitting Request...";

        showStatus(
            "Submitting your booking request. Please wait."
        );

        const bookingRef = await addDoc(
            collection(db, "orderRequests"),
            bookingData
        );

        console.log(
            "Booking request submitted:",
            bookingRef.id
        );

        showStatus(
            "Your booking request has been submitted successfully. Your request reference is: " +
            bookingRef.id +
            ". We will review it and update you.",
            "success"
        );

        bookingForm.reset();

        // Restore authenticated client information.

        fullNameInput.value = currentClientProfile.fullName || "";

        emailInput.value = currentUser.email || "";

        phoneInput.value = currentClientProfile.phone || "";

        // Reset dynamic service fields.

        document.getElementById("serviceType").innerHTML =
            '<option value="">Select a category first</option>';

        document.getElementById("serviceType").disabled = true;

        document.getElementById("technicalSection")
            .classList.remove("active");

        // Keep the deadline restriction.

        const deadlineInput =
            document.getElementById("deadline");

        const today = new Date();

        deadlineInput.min = new Date(
            today.getTime() - today.getTimezoneOffset() * 60000
        ).toISOString().split("T")[0];

        submitButton.disabled = false;

        submitButton.textContent = "Submit Another Booking Request";

    } catch (error) {

        console.error("Booking submission error:", error);

        let message =
            "Your booking request could not be submitted. Please try again.";

        if (error.code === "permission-denied") {

            message =
                "Permission denied. Your booking could not be saved. Please contact support.";

        } else if (error.code === "unavailable") {

            message =
                "The service is temporarily unavailable. Please check your internet connection and try again.";

        }

        showStatus(message, "error");

        submitButton.disabled = false;

        submitButton.textContent = "Submit Booking Request";

    }

});
