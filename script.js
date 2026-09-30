import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================================================
// 1. FIREBASE CONFIGURATION (Replace with your actual Firebase config)
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCemGkC9X-qGXP85yfOHWAaA_U8I8svYu0",
  authDomain: "myprofile1124.firebaseapp.com",
  databaseURL: "https://myprofile1124-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "myprofile1124",
  storageBucket: "myprofile1124.firebasestorage.app",
  messagingSenderId: "317629844028",
  appId: "1:317629844028:web:98eae3b815e89012e7d139",
  measurementId: "G-2KEP28KTLR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Application State
let currentUser = null;
let activeTargetUser = null;
let currentTab = "chats"; // "chats" or "contacts"

let unsubscribeMessages = null;
let unsubscribeConversations = null;
let unsubscribeContacts = null;
let unreadListeners = {};

let allUsers = [];
let activeConversations = [];
let userContacts = [];
let isSignUpMode = false;

// DOM Elements
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const nameGroup = document.getElementById("name-group");
const authToggleBtn = document.getElementById("auth-toggle-btn");
const authToggleText = document.getElementById("auth-toggle-text");

const authNameInput = document.getElementById("auth-name");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");

const currentUserName = document.getElementById("current-user-name");
const currentUserEmail = document.getElementById("current-user-email");
const userInitials = document.getElementById("user-initials");

const chatsList = document.getElementById("chats-list");
const userSearch = document.getElementById("user-search");
const addUserBtn = document.getElementById("add-user-btn");
const startAddUserBtn = document.getElementById("start-add-user-btn");

const tabChatsBtn = document.getElementById("tab-chats-btn");
const tabContactsBtn = document.getElementById("tab-contacts-btn");
const contactsCountEl = document.getElementById("contacts-count");

const emptyState = document.getElementById("empty-state");
const activeChatWrapper = document.getElementById("active-chat-wrapper");
const activeChatTitle = document.getElementById("active-chat-title");
const chatInitials = document.getElementById("chat-initials");
const messagesContainer = document.getElementById("messages-container");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

const logoutBtn = document.getElementById("logout-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const mobileBackBtn = document.getElementById("mobile-back-btn");
const chatArea = document.getElementById("chat-area");

// Modal DOM
const addUserModal = document.getElementById("add-user-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalUsersList = document.getElementById("modal-users-list");
const modalUserSearch = document.getElementById("modal-user-search");

// ==========================================================================
// 2. HELPER FUNCTIONS: RESET INPUTS & SWITCH MODE
// ==========================================================================
function clearAuthInputs() {
  if (authNameInput) authNameInput.value = "";
  if (authEmailInput) authEmailInput.value = "";
  if (authPasswordInput) authPasswordInput.value = "";
}

function switchToSignInMode() {
  isSignUpMode = false;
  authTitle.textContent = "Welcome Back";
  authSubtitle.textContent = "Sign in to start messaging in real time";
  authSubmitBtn.textContent = "Sign In";
  nameGroup.classList.add("hidden");
  authToggleText.innerHTML = `Don't have an account? <a href="#" id="auth-toggle-btn">Sign Up</a>`;
}

function switchToSignUpMode() {
  isSignUpMode = true;
  authTitle.textContent = "Create Account";
  authSubtitle.textContent = "Register to start messaging";
  authSubmitBtn.textContent = "Sign Up";
  nameGroup.classList.remove("hidden");
  authToggleText.innerHTML = `Already have an account? <a href="#" id="auth-toggle-btn">Sign In</a>`;
}

// Delegate toggle event for dynamic links
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "auth-toggle-btn") {
    e.preventDefault();
    clearAuthInputs();
    if (isSignUpMode) {
      switchToSignInMode();
    } else {
      switchToSignUpMode();
    }
  }
});

// ==========================================================================
// 3. AUTHENTICATION (Login, Register, Logout)
// ==========================================================================
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value.trim();
  const name = authNameInput.value.trim();

  try {
    if (isSignUpMode) {
      if (!name) return alert("Please enter your name");
      
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Save user to Firestore database
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name,
        email: email,
        createdAt: serverTimestamp()
      });

      alert("Registration successful! Returning to Sign In page.");
      clearAuthInputs();
      switchToSignInMode(); // Switch back to login page
    } else {
      // Sign In
      await signInWithEmailAndPassword(auth, email, password);
      clearAuthInputs(); // Clear inputs after successful login
    }
  } catch (err) {
    alert("Auth Error: " + err.message);
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    currentUserName.textContent = user.displayName || "User";
    currentUserEmail.textContent = user.email;
    userInitials.textContent = (user.displayName || user.email).charAt(0).toUpperCase();

    // Hide Auth, Show Main App Screen
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    resetToBlankState();

    fetchAllUsers();
    listenToContacts();
    listenToActiveConversations();
  } else {
    currentUser = null;
    
    // Show Sign In page on Logout
    switchToSignInMode();
    clearAuthInputs();

    authScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
    
    if (unsubscribeConversations) unsubscribeConversations();
    if (unsubscribeContacts) unsubscribeContacts();
    Object.values(unreadListeners).forEach(unsub => unsub());
    unreadListeners = {};
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    clearAuthInputs();
    switchToSignInMode();
  });
});

function resetToBlankState() {
  activeTargetUser = null;
  emptyState.classList.remove("hidden");
  activeChatWrapper.classList.add("hidden");
  chatArea.classList.remove("active-mobile");
  if (unsubscribeMessages) unsubscribeMessages();
}

// ==========================================================================
// 4. CONTACTS & CONVERSATIONS LISTENERS
// ==========================================================================
function fetchAllUsers() {
  const usersRef = collection(db, "users");
  onSnapshot(usersRef, (snapshot) => {
    allUsers = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.uid !== currentUser.uid) {
        allUsers.push(data);
      }
    });
    renderModalUsers(allUsers);
  });
}

function listenToContacts() {
  const contactsRef = collection(db, "users", currentUser.uid, "contacts");
  
  if (unsubscribeContacts) unsubscribeContacts();

  unsubscribeContacts = onSnapshot(contactsRef, (snapshot) => {
    userContacts = [];
    snapshot.forEach((docSnap) => {
      userContacts.push(docSnap.data());
    });
    contactsCountEl.textContent = userContacts.length;

    if (currentTab === "contacts") {
      renderContactsList(userContacts);
    }
  });
}

function listenToActiveConversations() {
  const userConversationsRef = collection(db, "users", currentUser.uid, "conversations");
  const q = query(userConversationsRef, orderBy("lastMessageTime", "desc"));

  if (unsubscribeConversations) unsubscribeConversations();

  unsubscribeConversations = onSnapshot(q, (snapshot) => {
    activeConversations = [];
    snapshot.forEach((docSnap) => {
      activeConversations.push(docSnap.data());
    });

    if (currentTab === "chats") {
      renderConversationsList(activeConversations);
    }
  });
}

// ==========================================================================
// 5. RENDERING LISTS
// ==========================================================================
function renderConversationsList(convs) {
  chatsList.innerHTML = "";

  if (convs.length === 0) {
    chatsList.innerHTML = `
      <div style="padding: 24px 16px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 0.9rem;">No active chats yet.</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">Click <b>Search & Add Users</b> to start chatting!</p>
      </div>`;
    return;
  }

  convs.forEach((conv) => {
    const item = document.createElement("div");
    item.className = `chat-item ${activeTargetUser?.uid === conv.targetUid ? "active" : ""}`;
    item.id = `user-item-${conv.targetUid}`;
    
    const formattedTime = conv.lastMessageTime?.toDate 
      ? formatShortTime(conv.lastMessageTime.toDate()) 
      : "";

    item.innerHTML = `
      <div class="avatar-container">
        <span>${conv.targetName.charAt(0).toUpperCase()}</span>
      </div>
      <div class="chat-item-details">
        <div class="chat-item-header">
          <h4 class="chat-item-title">${escapeHTML(conv.targetName)}</h4>
          <span class="chat-item-time">${formattedTime}</span>
        </div>
        <p class="chat-item-preview">${escapeHTML(conv.lastMessageText || "Sent a message")}</p>
      </div>
      <div class="chat-item-meta">
        <span class="unread-badge hidden" id="unread-badge-${conv.targetUid}">0</span>
      </div>
    `;

    item.addEventListener("click", () => {
      const targetUserObj = allUsers.find(u => u.uid === conv.targetUid) || {
        uid: conv.targetUid,
        name: conv.targetName,
        email: conv.targetEmail || ""
      };
      selectUserToChat(targetUserObj);
    });

    chatsList.appendChild(item);
    setupUnreadListener(conv.targetUid);
  });
}

function renderContactsList(contacts) {
  chatsList.innerHTML = "";

  if (contacts.length === 0) {
    chatsList.innerHTML = `
      <div style="padding: 24px 16px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 0.9rem;">No added contacts yet.</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">Click the <b>+ icon</b> to add users!</p>
      </div>`;
    return;
  }

  contacts.forEach((c) => {
    const item = document.createElement("div");
    item.className = `chat-item ${activeTargetUser?.uid === c.uid ? "active" : ""}`;
    item.id = `user-item-${c.uid}`;

    item.innerHTML = `
      <div class="avatar-container">
        <span>${c.name.charAt(0).toUpperCase()}</span>
      </div>
      <div class="chat-item-details">
        <h4 class="chat-item-title">${escapeHTML(c.name)}</h4>
        <p class="chat-item-preview">${escapeHTML(c.email)}</p>
      </div>
      <div class="chat-item-meta">
        <span class="unread-badge hidden" id="unread-badge-${c.uid}">0</span>
      </div>
    `;

    item.addEventListener("click", () => selectUserToChat(c));
    chatsList.appendChild(item);
    setupUnreadListener(c.uid);
  });
}

function setupUnreadListener(targetUid) {
  const chatId = getChatId(currentUser.uid, targetUid);
  const messagesRef = collection(db, "chats", chatId, "messages");
  
  const q = query(
    messagesRef, 
    where("senderId", "==", targetUid),
    where("isRead", "==", false)
  );

  if (unreadListeners[targetUid]) unreadListeners[targetUid]();

  unreadListeners[targetUid] = onSnapshot(q, (snapshot) => {
    const unreadCount = snapshot.size;
    const badgeEl = document.getElementById(`unread-badge-${targetUid}`);
    const itemEl = document.getElementById(`user-item-${targetUid}`);

    if (badgeEl && itemEl) {
      if (unreadCount > 0 && activeTargetUser?.uid !== targetUid) {
        badgeEl.textContent = unreadCount > 99 ? "99+" : unreadCount;
        badgeEl.classList.remove("hidden");
        itemEl.classList.add("has-unread");
      } else {
        badgeEl.classList.add("hidden");
        itemEl.classList.remove("has-unread");
      }
    }
  });
}

// Sidebar Tab Switches
tabChatsBtn.addEventListener("click", () => {
  currentTab = "chats";
  tabChatsBtn.classList.add("active");
  tabContactsBtn.classList.remove("active");
  renderConversationsList(activeConversations);
});

tabContactsBtn.addEventListener("click", () => {
  currentTab = "contacts";
  tabContactsBtn.classList.add("active");
  tabChatsBtn.classList.remove("active");
  renderContactsList(userContacts);
});

// ==========================================================================
// 6. ADD USER MODAL & FUNCTIONALITY
// ==========================================================================
function openAddUserModal() {
  addUserModal.classList.remove("hidden");
  renderModalUsers(allUsers);
}

function closeAddUserModal() {
  addUserModal.classList.add("hidden");
}

function renderModalUsers(usersToRender) {
  modalUsersList.innerHTML = "";

  if (usersToRender.length === 0) {
    modalUsersList.innerHTML = `<p style="padding: 12px; text-align: center; color: var(--text-muted);">No users found matching query.</p>`;
    return;
  }

  usersToRender.forEach((u) => {
    const isAdded = userContacts.some(c => c.uid === u.uid);

    const card = document.createElement("div");
    card.className = "user-search-card";
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
        <div class="avatar-container" style="width: 36px; height: 36px;">
          <span>${u.name.charAt(0).toUpperCase()}</span>
        </div>
        <div style="min-width: 0;">
          <h4 style="font-size: 0.88rem; font-weight: 600;" class="chat-item-title">${escapeHTML(u.name)}</h4>
          <p style="font-size: 0.75rem; color: var(--text-secondary);" class="chat-item-preview">${escapeHTML(u.email)}</p>
        </div>
      </div>
      <button class="btn ${isAdded ? "btn-secondary" : "btn-primary"} add-contact-btn" id="add-btn-${u.uid}">
        ${isAdded ? '<i class="fa-solid fa-comment"></i> Chat' : '<i class="fa-solid fa-user-plus"></i> Add'}
      </button>
    `;

    const actionBtn = card.querySelector(`#add-btn-${u.uid}`);
    actionBtn.addEventListener("click", async () => {
      if (!isAdded) {
        await addContact(u);
      }
      closeAddUserModal();
      selectUserToChat(u);
    });

    modalUsersList.appendChild(card);
  });
}

async function addContact(targetUser) {
  try {
    await setDoc(doc(db, "users", currentUser.uid, "contacts", targetUser.uid), {
      uid: targetUser.uid,
      name: targetUser.name,
      email: targetUser.email,
      addedAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error adding contact:", err);
  }
}

addUserBtn.addEventListener("click", openAddUserModal);
startAddUserBtn.addEventListener("click", openAddUserModal);
closeModalBtn.addEventListener("click", closeAddUserModal);

modalUserSearch.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allUsers.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
  renderModalUsers(filtered);
});

userSearch.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  if (currentTab === "chats") {
    const filtered = activeConversations.filter(c => c.targetName.toLowerCase().includes(term));
    renderConversationsList(filtered);
  } else {
    const filtered = userContacts.filter(c => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term));
    renderContactsList(filtered);
  }
});

// ==========================================================================
// 7. REALTIME CHAT & MESSAGING
// ==========================================================================
function getChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

async function selectUserToChat(targetUser) {
  activeTargetUser = targetUser;

  document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
  const currentItem = document.getElementById(`user-item-${targetUser.uid}`);
  if (currentItem) currentItem.classList.add("active");

  emptyState.classList.add("hidden");
  activeChatWrapper.classList.remove("hidden");
  chatArea.classList.add("active-mobile");

  activeChatTitle.textContent = targetUser.name;
  chatInitials.textContent = targetUser.name.charAt(0).toUpperCase();

  listenToDirectMessages();
  markMessagesAsRead(targetUser.uid);
}

function listenToDirectMessages() {
  if (unsubscribeMessages) unsubscribeMessages();

  const chatId = getChatId(currentUser.uid, activeTargetUser.uid);
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    const msgs = [];
    snapshot.forEach((docSnap) => {
      msgs.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderMessages(msgs);
    markMessagesAsRead(activeTargetUser.uid);
  });
}

async function markMessagesAsRead(targetUid) {
  if (!currentUser || !targetUid) return;
  const chatId = getChatId(currentUser.uid, targetUid);
  const messagesRef = collection(db, "chats", chatId, "messages");
  
  const q = query(
    messagesRef, 
    where("senderId", "==", targetUid),
    where("isRead", "==", false)
  );

  onSnapshot(q, (snapshot) => {
    snapshot.forEach((docSnap) => {
      updateDoc(doc(db, "chats", chatId, "messages", docSnap.id), {
        isRead: true
      }).catch(() => {});
    });
  }, { once: true });
}

function renderMessages(msgs) {
  messagesContainer.innerHTML = "";

  msgs.forEach((msg) => {
    const isOutgoing = msg.senderId === currentUser.uid;
    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper ${isOutgoing ? "outgoing" : "incoming"}`;

    const formattedTime = msg.createdAt?.toDate 
      ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
      : "Just now";

    wrapper.innerHTML = `
      <div class="message-bubble">
        ${escapeHTML(msg.text)}
        <span class="message-time">${formattedTime}</span>
      </div>
    `;

    messagesContainer.appendChild(wrapper);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !activeTargetUser) return;

  const chatId = getChatId(currentUser.uid, activeTargetUser.uid);
  messageInput.value = "";

  // 1. Add Message
  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId: currentUser.uid,
    receiverId: activeTargetUser.uid,
    text: text,
    isRead: false,
    createdAt: serverTimestamp()
  });

  // 2. Update Sender Conversation
  await setDoc(doc(db, "users", currentUser.uid, "conversations", activeTargetUser.uid), {
    targetUid: activeTargetUser.uid,
    targetName: activeTargetUser.name,
    targetEmail: activeTargetUser.email || "",
    lastMessageText: text,
    lastMessageTime: serverTimestamp()
  });

  // 3. Update Receiver Conversation
  await setDoc(doc(db, "users", activeTargetUser.uid, "conversations", currentUser.uid), {
    targetUid: currentUser.uid,
    targetName: currentUser.displayName || "User",
    targetEmail: currentUser.email || "",
    lastMessageText: text,
    lastMessageTime: serverTimestamp()
  });
}

// Helpers
themeToggleBtn?.addEventListener("click", () => {
  const isDark = document.body.getAttribute("data-theme") === "dark";
  document.body.setAttribute("data-theme", isDark ? "light" : "dark");
});

mobileBackBtn?.addEventListener("click", () => {
  chatArea.classList.remove("active-mobile");
});

function formatShortTime(date) {
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function escapeHTML(str) {
  return str ? str.replace(/[&<>'"]/g, tag => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag)) : "";
} 