// ========================================
// WMF ADMIN DASHBOARD
// Wise Media Freelance
// Firebase Authentication & Firestore
// ========================================

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// ========================================
// HTML ELEMENTS
// ========================================

const adminName = document.getElementById("adminName");
const adminEmail = document.getElementById("adminEmail");

const adminLogoutButton =
  document.getElementById("adminLogoutButton");

const adminAccountStatus =
  document.getElementById("adminAccountStatus");

const totalClients =
  document.getElementById("totalClients");

const totalAuthors =
  document.getElementById("totalAuthors");

const totalOrders =
  document.getElementById("totalOrders");

const pendingOrders =
  document.getElementById("pendingOrders");

const clientsStatus =
  document.getElementById("clientsStatus");

const authorsStatus =
  document.getElementById("authorsStatus");

const ordersStatus =
  document.getElementById("ordersStatus");


// ========================================
// ADMIN AUTHENTICATION
// ========================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.replace("./login.html");
    return;

  }

  try {

    // Refresh Firebase ID token.

    const tokenResult = await user.getIdTokenResult(true);

    // Verify administrator privileges.

    if (tokenResult.claims.admin !== true) {

      alert("Access denied. Administrator privileges required.");

      window.location.replace("./login.html");

      return;

    }

    // Verify email.

    if (!user.emailVerified) {

      alert("Please verify your email address.");

      await signOut(auth);

      window.location.replace("./login.html");

      return;

    }

    // Administrator authenticated.

    console.log("WMF ADMIN AUTHENTICATED");

    console.log("Admin UID:", user.uid);

    console.log("Admin email:", user.email);

    console.log("Admin claim:", tokenResult.claims.admin);


    // Load administrator information.

    await loadAdminProfile(user);

    // Load dashboard statistics.

    await loadDashboardStatistics();

  } catch (error) {

    console.error("Admin authentication error:", error);

    if (adminAccountStatus) {

      adminAccountStatus.textContent =
        "Unable to verify administrator access. Please refresh.";

    }

  }

});


// ========================================
// LOAD ADMIN PROFILE
// ========================================

async function loadAdminProfile(user) {

  try {

    const userRef = doc(db, "users", user.uid);

    const userSnap = await getDoc(userRef);

    if (adminName) {

      adminName.textContent = userSnap.exists()
        ? userSnap.data().fullName || "WMF Administrator"
        : "WMF Administrator";

    }

    if (adminEmail) {

      adminEmail.textContent = user.email || "";

    }

    if (adminAccountStatus) {

      adminAccountStatus.textContent =
        "Administrator account verified successfully.";

    }

  } catch (error) {

    console.error("Admin profile error:", error);

    if (adminAccountStatus) {

      adminAccountStatus.textContent =
        "Administrator authenticated, but profile information could not load.";

    }

  }

}


// ========================================
// LOAD DASHBOARD STATISTICS
// ========================================

async function loadDashboardStatistics() {

  try {

    // Fetch booking requests.

    const ordersSnapshot =
      await getDocs(collection(db, "orderRequests"));


    // Unique account collections.

    const authorAccounts = new Set();

    const clientAccounts = new Set();


    // Order statistics.

    let orderCount = 0;

    let pendingCount = 0;


    // Process booking records.

    ordersSnapshot.forEach((orderDoc) => {

      const order = orderDoc.data();

      orderCount++;


      // Count pending bookings.

      if (order.status === "pending") {

        pendingCount++;

      }


      // Identify the account and service category.

      const userId = order.userId;

      const serviceCategory = order.serviceCategory;


      // Ignore incomplete classification records.

      if (
        typeof userId !== "string" ||
        !userId.trim() ||
        typeof serviceCategory !== "string" ||
        !serviceCategory.trim()
      ) {

        return;

      }


      // Writing Services = Author.

      if (serviceCategory === "writing") {

        authorAccounts.add(userId);

      }

      // Every other service category = Client.

      else {

        clientAccounts.add(userId);

      }

    });


    // Calculate unique account totals.

    const authorCount = authorAccounts.size;

    const clientCount = clientAccounts.size;


    // ========================================
    // DISPLAY CLIENT STATISTICS
    // ========================================

    if (totalClients) {

      totalClients.textContent = clientCount;

    }

    if (clientsStatus) {

      clientsStatus.textContent =
        `${clientCount} account(s) with non-writing service requests found.`;

    }


    // ========================================
    // DISPLAY AUTHOR STATISTICS
    // ========================================

    if (totalAuthors) {

      totalAuthors.textContent = authorCount;

    }

    if (authorsStatus) {

      authorsStatus.textContent =
        `${authorCount} account(s) with writing service requests found.`;

    }


    // ========================================
    // DISPLAY ORDER STATISTICS
    // ========================================

    if (totalOrders) {

      totalOrders.textContent = orderCount;

    }

    if (pendingOrders) {

      pendingOrders.textContent = pendingCount;

    }

    if (ordersStatus) {

      ordersStatus.textContent =
        `${orderCount} booking request(s) found, including ${pendingCount} pending request(s).`;

    }


    // ========================================
    // CONSOLE REPORT
    // ========================================

    console.log("WMF DASHBOARD STATISTICS LOADED");

    console.log("Unique Author Accounts:", authorCount);

    console.log("Unique Client Accounts:", clientCount);

    console.log("Total Booking Requests:", orderCount);

    console.log("Pending Booking Requests:", pendingCount);

    console.log(
      "Accounts in both groups:",
      [...authorAccounts].filter(uid =>
        clientAccounts.has(uid)
      ).length
    );

  } catch (error) {

    console.error("Dashboard statistics error:", error);

    if (clientsStatus) {

      clientsStatus.textContent =
        "Unable to load client statistics.";

    }

    if (authorsStatus) {

      authorsStatus.textContent =
        "Unable to load author statistics.";

    }

    if (ordersStatus) {

      ordersStatus.textContent =
        "Unable to load booking statistics.";

    }

  }

}


// ========================================
// ADMIN LOGOUT
// ========================================

if (adminLogoutButton) {

  adminLogoutButton.addEventListener("click", async () => {

    const confirmLogout = confirm(
      "Are you sure you want to log out of the WMF Admin Dashboard?"
    );

    if (!confirmLogout) return;

    try {

      await signOut(auth);

      window.location.replace("./login.html");

    } catch (error) {

      console.error("Admin logout error:", error);

      alert("Unable to log out. Please try again.");

    }

  });

}


// ========================================
// END OF WMF ADMIN DASHBOARD
// ========================================
