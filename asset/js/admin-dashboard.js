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

const clientsTableBody =
document.getElementById("clientsTableBody");

const authorsTableBody =
document.getElementById("authorsTableBody");

// ========================================
// SERVICE CLASSIFICATION
// ========================================

const CLIENT_CATEGORIES = [
"creative",
"digital-media",
"website-development",
"website-maintenance",
"programming",
"other"
];

// ========================================
// ADMIN AUTHENTICATION
// ========================================

onAuthStateChanged(auth, async (user) => {

if (!user) {

window.location.replace("./login.html");
return;

}

try {

const tokenResult = await user.getIdTokenResult(true);

if (tokenResult.claims.admin !== true) {

  alert("Access denied. Administrator privileges required.");

  window.location.replace("./login.html");
  return;

}

if (!user.emailVerified) {

  alert("Please verify your email address.");

  await signOut(auth);

  window.location.replace("./login.html");
  return;

}

console.log("WMF ADMIN AUTHENTICATED");
console.log("Admin UID:", user.uid);
console.log("Admin email:", user.email);

await loadAdminProfile(user);

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
// FORMAT SERVICE NAMES
// ========================================

function formatServiceName(service) {

if (typeof service !== "string" || !service.trim()) {

return "Unspecified";

}

return service
.replace(/[-_]/g, " ")
.replace(/\b\w/g, letter => letter.toUpperCase());

}

// ========================================
// CREATE SAFE TABLE CELL
// ========================================

function createCell(value) {

const cell = document.createElement("td");

cell.textContent = value || "Not provided";

return cell;

}

// ========================================
// DISPLAY ACCOUNT TABLE
// ========================================

function displayAccountTable(
tableBody,
accountSet,
accountData,
profiles,
accountType
) {

if (!tableBody) return;

tableBody.replaceChildren();

if (accountSet.size === 0) {

const row = document.createElement("tr");

const cell = document.createElement("td");

cell.colSpan = 5;

cell.textContent =
  `No ${accountType.toLowerCase()} accounts found yet.`;

row.appendChild(cell);

tableBody.appendChild(row);

return;

}

const sortedAccounts = [...accountSet].sort((a, b) => {

const profileA = profiles.get(a) || {};
const profileB = profiles.get(b) || {};

return String(profileA.fullName || "")
  .localeCompare(String(profileB.fullName || ""));

});

sortedAccounts.forEach(uid => {

const row = document.createElement("tr");

const profile = profiles.get(uid) || {};

const details = accountData.get(uid) || {
  services: new Set(),
  bookings: 0
};

const fullName =
  profile.fullName || "Profile unavailable";

const email =
  profile.email || "Not available";

const phone =
  profile.phone || "Not available";

const services =
  [...details.services].join(", ") || "Not specified";

const bookings =
  String(details.bookings);

row.appendChild(createCell(fullName));
row.appendChild(createCell(email));
row.appendChild(createCell(phone));
row.appendChild(createCell(services));
row.appendChild(createCell(bookings));

tableBody.appendChild(row);

});

}

// ========================================
// LOAD DASHBOARD STATISTICS
// AND ACCOUNT MANAGEMENT TABLES
// ========================================

async function loadDashboardStatistics() {

try {

// Fetch users and booking requests.

const [usersSnapshot, ordersSnapshot] =
  await Promise.all([

    getDocs(collection(db, "users")),

    getDocs(collection(db, "orderRequests"))

  ]);


// ========================================
// ACCOUNT PROFILE COLLECTION
// ========================================

const profiles = new Map();

usersSnapshot.forEach(userDoc => {

  profiles.set(userDoc.id, userDoc.data());

});


// ========================================
// ACCOUNT CLASSIFICATION
// ========================================

const authorAccounts = new Set();

const clientAccounts = new Set();

const authorData = new Map();

const clientData = new Map();


// ========================================
// ORDER STATISTICS
// ========================================

let orderCount = 0;

let pendingCount = 0;


// ========================================
// PROCESS BOOKING RECORDS
// ========================================

ordersSnapshot.forEach(orderDoc => {

  const order = orderDoc.data();

  orderCount++;

  if (order.status === "pending") {

    pendingCount++;

  }

  const userId = order.userId;

  const category = order.serviceCategory;

  if (
    typeof userId !== "string" ||
    !userId.trim() ||
    typeof category !== "string"
  ) {

    return;

  }

  const normalizedCategory = category.trim();

  let accountSet;
  let dataMap;

  if (normalizedCategory === "writing") {

    accountSet = authorAccounts;
    dataMap = authorData;

  } else if (
    CLIENT_CATEGORIES.includes(normalizedCategory)
  ) {

    accountSet = clientAccounts;
    dataMap = clientData;

  } else {

    console.warn(
      "Unrecognized service category:",
      normalizedCategory
    );

    return;

  }


  // Register account.

  accountSet.add(userId);


  // Initialize account information.

  if (!dataMap.has(userId)) {

    dataMap.set(userId, {

      services: new Set(),

      bookings: 0

    });

  }


  const account = dataMap.get(userId);

  account.bookings++;


  // Save requested service.

  const serviceName =
    formatServiceName(
      order.serviceType || normalizedCategory
    );

  account.services.add(serviceName);

});


// ========================================
// DISPLAY CLIENT TABLE
// ========================================

displayAccountTable(
  clientsTableBody,
  clientAccounts,
  clientData,
  profiles,
  "Client"
);


// ========================================
// DISPLAY AUTHOR TABLE
// ========================================

displayAccountTable(
  authorsTableBody,
  authorAccounts,
  authorData,
  profiles,
  "Author"
);


// ========================================
// DISPLAY CLIENT STATISTICS
// ========================================

if (totalClients) {

  totalClients.textContent = clientAccounts.size;

}

if (clientsStatus) {

  clientsStatus.textContent =
    `${clientAccounts.size} account(s) with non-writing service requests found.`;

}


// ========================================
// DISPLAY AUTHOR STATISTICS
// ========================================

if (totalAuthors) {

  totalAuthors.textContent = authorAccounts.size;

}

if (authorsStatus) {

  authorsStatus.textContent =
    `${authorAccounts.size} account(s) with writing service requests found.`;

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

console.log("WMF DASHBOARD LOADED SUCCESSFULLY");

console.log("Registered Profiles:", profiles.size);

console.log("Unique Author Accounts:", authorAccounts.size);

console.log("Unique Client Accounts:", clientAccounts.size);

console.log("Total Booking Requests:", orderCount);

console.log("Pending Booking Requests:", pendingCount);

console.log(
  "Accounts in both groups:",
  [...authorAccounts].filter(uid =>
    clientAccounts.has(uid)
  ).length
);

} catch (error) {

console.error(
  "Dashboard statistics error:",
  error
);

if (clientsStatus) {

  clientsStatus.textContent =
    "Unable to load client information.";

}

if (authorsStatus) {

  authorsStatus.textContent =
    "Unable to load author information.";

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
