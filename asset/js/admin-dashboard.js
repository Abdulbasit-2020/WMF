// ========================================
// WMF ADMIN DASHBOARD
// Wise Media Freelance
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
// DOM ELEMENTS
// ========================================

const adminName = document.getElementById("adminName");
const adminEmail = document.getElementById("adminEmail");

const adminLogoutButton =
  document.getElementById("adminLogoutButton");

const adminAccountStatus =
  document.getElementById("adminAccountStatus");

const totalClients = document.getElementById("totalClients");
const totalAuthors = document.getElementById("totalAuthors");
const totalOrders = document.getElementById("totalOrders");
const pendingOrders = document.getElementById("pendingOrders");

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

const clientSearchInput =
  document.getElementById("clientSearchInput");


// CLIENT DETAILS ELEMENTS

const clientDetailsModal =
  document.getElementById("clientDetailsModal");

const closeClientModal =
  document.getElementById("closeClientModal");

const detailFullName =
  document.getElementById("detailFullName");

const detailEmail =
  document.getElementById("detailEmail");

const detailPhone =
  document.getElementById("detailPhone");

const detailRole =
  document.getElementById("detailRole");

const detailStatus =
  document.getElementById("detailStatus");

const detailCreatedAt =
  document.getElementById("detailCreatedAt");

const clientBookingHistory =
  document.getElementById("clientBookingHistory");


// ========================================
// BUSINESS CLASSIFICATION
// ========================================

const CLIENT_CATEGORIES = [
  "creative",
  "digital-media",
  "website-development",
  "website-maintenance",
  "programming",
  "other"
];

const AUTHOR_CATEGORY = "writing";


// ========================================
// DATA STORAGE
// ========================================

let profiles = new Map();

let clientData = new Map();

let authorData = new Map();

let clientBookings = new Map();

let clientSearchData = [];


// ========================================
// GENERAL HELPERS
// ========================================

function getValue(value, fallback = "Not available") {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
}


function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  try {
    let date;

    if (typeof value.toDate === "function") {
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString();

  } catch (error) {
    return "Not available";
  }
}


function formatServiceName(value) {
  if (!value) {
    return "Not specified";
  }

  if (Array.isArray(value)) {
    return value
      .map(item => formatServiceName(item))
      .join(", ");
  }

  return String(value)
    .replace(/-/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}


function createCell(value) {
  const td = document.createElement("td");

  td.textContent = getValue(value);

  return td;
}


function showTableMessage(tableBody, message, columns) {
  tableBody.replaceChildren();

  const row = document.createElement("tr");

  const cell = document.createElement("td");

  cell.colSpan = columns;
  cell.textContent = message;

  row.appendChild(cell);

  tableBody.appendChild(row);
}


// ========================================
// ADMIN AUTHENTICATION
// ========================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  try {

    const tokenResult = await user.getIdTokenResult(true);

    const isAdmin = tokenResult.claims.admin === true;

    if (!isAdmin || !user.emailVerified) {

      alert("Access denied. Administrator privileges are required.");

      await signOut(auth);

      window.location.href = "./login.html";

      return;
    }

    adminAccountStatus.textContent =
      "Administrator account verified.";

    adminName.textContent = "Loading owner...";

    adminEmail.textContent = user.email || "No email available";

    await loadAdminDashboard(user);

  } catch (error) {

    console.error("Admin verification error:", error);

    adminAccountStatus.textContent =
      "Unable to verify administrator account.";

  }

});


// ========================================
// LOAD ADMIN PROFILE AND DASHBOARD
// ========================================

async function loadAdminDashboard(user) {

  try {

    // LOAD ADMIN PROFILE

    const adminRef = doc(db, "users", user.uid);

    const adminSnapshot = await getDoc(adminRef);

    if (adminSnapshot.exists()) {

      const adminProfile = adminSnapshot.data();

      adminName.textContent =
        adminProfile.fullName || "WMF Administrator";

    } else {

      adminName.textContent = "WMF Administrator";

    }


    // LOAD USERS AND BOOKINGS

    const [usersSnapshot, ordersSnapshot] =
      await Promise.all([

        getDocs(collection(db, "users")),

        getDocs(collection(db, "orderRequests"))

      ]);


    // RESET DATA

    profiles = new Map();

    clientData = new Map();

    authorData = new Map();

    clientBookings = new Map();


    // ========================================
    // LOAD USER PROFILES
    // ========================================

    usersSnapshot.forEach((userDoc) => {

      profiles.set(userDoc.id, userDoc.data());

    });


    // ========================================
    // PROCESS BOOKINGS
    // ========================================

    let totalBookingCount = 0;

    let pendingBookingCount = 0;

    ordersSnapshot.forEach((orderDoc) => {

      const booking = orderDoc.data();

      totalBookingCount++;

      if (booking.status === "pending") {
        pendingBookingCount++;
      }

      const uid = booking.userId;

      if (!uid) {
        return;
      }


      // STORE ALL BOOKINGS BY USER

      if (!clientBookings.has(uid)) {
        clientBookings.set(uid, []);
      }

      clientBookings.get(uid).push({
        id: orderDoc.id,
        ...booking
      });


      // WRITING SERVICES = AUTHOR

      if (booking.serviceCategory === AUTHOR_CATEGORY) {

        if (!authorData.has(uid)) {

          authorData.set(uid, {
            bookings: [],
            services: new Set()
          });

        }

        const author = authorData.get(uid);

        author.bookings.push(booking);

        author.services.add(
          formatServiceName(booking.serviceType)
        );

      }


      // NON-WRITING SERVICES = CLIENT

      else if (
        CLIENT_CATEGORIES.includes(booking.serviceCategory)
      ) {

        if (!clientData.has(uid)) {

          clientData.set(uid, {
            bookings: [],
            services: new Set()
          });

        }

        const client = clientData.get(uid);

        client.bookings.push(booking);

        client.services.add(
          formatServiceName(booking.serviceType)
        );

      }

    });


    // ========================================
    // UPDATE DASHBOARD STATISTICS
    // ========================================

    totalClients.textContent = clientData.size;

    totalAuthors.textContent = authorData.size;

    totalOrders.textContent = totalBookingCount;

    pendingOrders.textContent = pendingBookingCount;


    // ========================================
    // RENDER TABLES
    // ========================================

    renderClientSearch("");

    renderAuthors();


    // ========================================
    // UPDATE STATUS MESSAGES
    // ========================================

    clientsStatus.textContent =
      `${clientData.size} client account(s) found.`;

    authorsStatus.textContent =
      `${authorData.size} author account(s) found.`;

    ordersStatus.textContent =
      `${totalBookingCount} booking(s) found. ` +
      `${pendingBookingCount} pending booking(s).`;


  } catch (error) {

    console.error("Dashboard loading error:", error);

    clientsStatus.textContent =
      "Unable to load client accounts.";

    authorsStatus.textContent =
      "Unable to load author accounts.";

    ordersStatus.textContent =
      "Unable to load booking information.";

    showTableMessage(
      clientsTableBody,
      "Unable to load client records.",
      6
    );

    showTableMessage(
      authorsTableBody,
      "Unable to load author records.",
      5
    );

  }

}


// ========================================
// PREPARE CLIENT SEARCH DATA
// ========================================

function prepareClientSearchData() {

  clientSearchData = [];

  clientData.forEach((data, uid) => {

    const profile = profiles.get(uid) || {};

    clientSearchData.push({

      uid,

      fullName: profile.fullName || "Not available",

      email: profile.email || "Not available",

      phone: profile.phone || "Not available",

      services: Array.from(data.services).join(", "),

      bookings: data.bookings.length

    });

  });

  clientSearchData.sort((a, b) =>
    a.fullName.localeCompare(b.fullName)
  );

}


// ========================================
// CLIENT SEARCH AND TABLE
// ========================================

function renderClientSearch(searchTerm = "") {

  prepareClientSearchData();

  clientsTableBody.replaceChildren();

  const term = searchTerm.trim().toLowerCase();

  const filteredClients = clientSearchData.filter(client => {

    const searchableText = [

      client.fullName,

      client.email,

      client.phone,

      client.services

    ].join(" ").toLowerCase();

    return searchableText.includes(term);

  });


  if (filteredClients.length === 0) {

    showTableMessage(
      clientsTableBody,
      term
        ? "No matching client accounts found."
        : "No client accounts found yet.",
      6
    );

    return;

  }


  filteredClients.forEach(client => {

    const row = document.createElement("tr");


    row.appendChild(createCell(client.fullName));

    row.appendChild(createCell(client.email));

    row.appendChild(createCell(client.phone));

    row.appendChild(createCell(client.services));

    row.appendChild(createCell(client.bookings));


    // ACTIONS CELL

    const actionsCell = document.createElement("td");

    const detailsButton = document.createElement("button");

    detailsButton.type = "button";

    detailsButton.className = "details-button";

    detailsButton.textContent = "View Details";

    detailsButton.addEventListener("click", () => {

      openClientDetails(client.uid);

    });

    actionsCell.appendChild(detailsButton);

    row.appendChild(actionsCell);


    clientsTableBody.appendChild(row);

  });

}


// ========================================
// CLIENT DETAILS
// ========================================

function openClientDetails(uid) {

  const profile = profiles.get(uid);

  if (!profile) {

    alert("Client profile could not be found.");

    return;

  }


  // POPULATE PROFILE INFORMATION

  detailFullName.textContent =
    getValue(profile.fullName);

  detailEmail.textContent =
    getValue(profile.email);

  detailPhone.textContent =
    getValue(profile.phone);

  detailRole.textContent =
    getValue(profile.role);

  detailStatus.textContent =
    getValue(profile.accountStatus);

  detailCreatedAt.textContent =
    formatDate(profile.createdAt);


  // LOAD CLIENT BOOKINGS

  renderClientBookingHistory(uid);


  // OPEN MODAL

  clientDetailsModal.classList.add("active");

  document.body.style.overflow = "hidden";

  closeClientModal.focus();

}


// ========================================
// CLIENT BOOKING HISTORY
// ========================================

function renderClientBookingHistory(uid) {

  clientBookingHistory.replaceChildren();

  const bookings = clientBookings.get(uid) || [];


  if (bookings.length === 0) {

    const message = document.createElement("p");

    message.textContent = "No booking history found.";

    clientBookingHistory.appendChild(message);

    return;

  }


  // NEWEST BOOKINGS FIRST

  const sortedBookings = [...bookings].sort((a, b) => {

    const getTime = value => {

      if (!value) return 0;

      if (typeof value.toDate === "function") {
        return value.toDate().getTime();
      }

      const date = new Date(value);

      return Number.isNaN(date.getTime())
        ? 0
        : date.getTime();

    };

    return getTime(b.createdAt) - getTime(a.createdAt);

  });


  sortedBookings.forEach((booking, index) => {

    const card = document.createElement("div");

    card.className = "booking-card";


    const heading = document.createElement("h4");

    heading.textContent =
      `Booking ${index + 1}: ${getValue(booking.projectTitle, "Untitled Project")}`;

    card.appendChild(heading);


    const fields = [

      ["Service Category", formatServiceName(booking.serviceCategory)],

      ["Service Type", formatServiceName(booking.serviceType)],

      ["Project Title", booking.projectTitle],

      ["Deadline", booking.deadline],

      ["Budget", booking.budget],

      ["Project Description", booking.projectDescription],

      ["Project Stage", booking.projectStage],

      ["Website Type", booking.websiteType],

      ["Existing Website", booking.existingWebsite],

      ["Technologies", booking.technologies],

      ["Functionality", booking.functionality],

      ["Booking Status", booking.status],

      ["Booking Date", formatDate(booking.createdAt)]

    ];


    fields.forEach(([label, value]) => {

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      const paragraph = document.createElement("p");

      const strong = document.createElement("strong");

      strong.textContent = `${label}: `;

      const span = document.createElement("span");

      span.textContent = Array.isArray(value)
        ? value.join(", ")
        : String(value);

      paragraph.appendChild(strong);

      paragraph.appendChild(span);

      card.appendChild(paragraph);

    });


    clientBookingHistory.appendChild(card);

  });

}


// ========================================
// CLOSE CLIENT DETAILS MODAL
// ========================================

function closeClientDetails() {

  clientDetailsModal.classList.remove("active");

  document.body.style.overflow = "";

}


closeClientModal.addEventListener(
  "click",
  closeClientDetails
);


clientDetailsModal.addEventListener("click", (event) => {

  if (event.target === clientDetailsModal) {

    closeClientDetails();

  }

});


document.addEventListener("keydown", (event) => {

  if (
    event.key === "Escape" &&
    clientDetailsModal.classList.contains("active")
  ) {

    closeClientDetails();

  }

});


// ========================================
// CLIENT SEARCH EVENT
// ========================================

clientSearchInput.addEventListener("input", () => {

  renderClientSearch(clientSearchInput.value);

});


// ========================================
// AUTHOR TABLE
// ========================================

function renderAuthors() {

  authorsTableBody.replaceChildren();


  if (authorData.size === 0) {

    showTableMessage(
      authorsTableBody,
      "No author accounts found yet.",
      5
    );

    return;

  }


  const authors = [];


  authorData.forEach((data, uid) => {

    const profile = profiles.get(uid) || {};

    authors.push({

      fullName: profile.fullName || "Not available",

      email: profile.email || "Not available",

      phone: profile.phone || "Not available",

      services: Array.from(data.services).join(", "),

      bookings: data.bookings.length

    });

  });


  authors.sort((a, b) =>
    a.fullName.localeCompare(b.fullName)
  );


  authors.forEach(author => {

    const row = document.createElement("tr");

    row.appendChild(createCell(author.fullName));

    row.appendChild(createCell(author.email));

    row.appendChild(createCell(author.phone));

    row.appendChild(createCell(author.services));

    row.appendChild(createCell(author.bookings));

    authorsTableBody.appendChild(row);

  });

}


// ========================================
// ADMIN LOGOUT
// ========================================

adminLogoutButton.addEventListener("click", async () => {

  try {

    await signOut(auth);

    window.location.href = "./login.html";

  } catch (error) {

    console.error("Logout error:", error);

    alert("Unable to log out. Please try again.");

  }

});


// ========================================
// END OF ADMIN DASHBOARD
// ========================================
