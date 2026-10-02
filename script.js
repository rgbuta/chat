import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, updateDoc, getDocs, deleteDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================================================
// 1. FIREBASE CONFIG - myprofile1124 - KEEP YOURS BOSS
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

// STATE
let currentUser = null;
let activeTargetUser = null;
let currentTab = "chats";
let unsubscribeMessages = null;
let unsubscribeConversations = null;
let unsubscribeContacts = null;
let unsubscribeTyping = null;
let unsubscribeIncomingCall = null;
let unreadListeners = {};
let allUsers = [];
let activeConversations = [];
let userContacts = [];
let isSignUpMode = false;
let selectedImageData = null;
let activeReplyTarget = null;
let typingTimeout = null;

// VIDEO CALL STATE - FIXED
let pc = null;
let localStream = null;
let remoteStream = null;
let currentCallId = null;
let isCaller = false;
let callType = 'video';
let incomingCallData = null;
const servers = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302'] }
  ]
};

// DOM
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const nameGroup = document.getElementById("name-group");
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
const typingIndicatorBar = document.getElementById("typing-indicator-bar");
const typingUserText = document.getElementById("typing-user-text");
const replyBanner = document.getElementById("reply-banner");
const replySenderName = document.getElementById("reply-sender-name");
const replyPreviewText = document.getElementById("reply-preview-text");
const cancelReplyBtn = document.getElementById("cancel-reply-btn");
const imageFileInput = document.getElementById("image-file-input");
const imagePreviewBar = document.getElementById("image-preview-bar");
const imagePreviewImg = document.getElementById("image-preview-img");
const removeImageBtn = document.getElementById("remove-image-btn");
const logoutBtn = document.getElementById("logout-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const mobileBackBtn = document.getElementById("mobile-back-btn");
const chatArea = document.getElementById("chat-area");
const addUserModal = document.getElementById("add-user-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalUsersList = document.getElementById("modal-users-list");
const modalUserSearch = document.getElementById("modal-user-search");
const lightboxModal = document.getElementById("lightbox-modal");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCloseBtn = document.getElementById("lightbox-close-btn");
const lightboxDownloadBtn = document.getElementById("lightbox-download-btn");

// VIDEO CALL DOM
const videoCallModal = document.getElementById("video-call-modal");
const remoteVideo = document.getElementById("remoteVideo");
const localVideo = document.getElementById("localVideo");
const callStatus = document.getElementById("call-status");
const muteBtn = document.getElementById("mute-btn");
const cameraBtn = document.getElementById("camera-btn");
const screenBtn = document.getElementById("screen-btn");
const endCallBtn = document.getElementById("end-call-btn");
const videoCallBtn = document.getElementById("video-call-btn");
const voiceCallBtn = document.getElementById("voice-call-btn");
const incomingPopup = document.getElementById("incoming-call-popup");
const incomingName = document.getElementById("incoming-name");
const incomingInitials = document.getElementById("incoming-initials");
const incomingTypeEl = document.getElementById("incoming-type");
const acceptCallBtn = document.getElementById("accept-call-btn");
const declineCallBtn = document.getElementById("decline-call-btn");

// ==========================================================================
// 2. AUTH - FIXED LOGIN
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
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "auth-toggle-btn") {
    e.preventDefault();
    clearAuthInputs();
    if (isSignUpMode) switchToSignInMode();
    else switchToSignUpMode();
  }
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value.trim();
  const name = authNameInput.value.trim();
  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = "Loading...";
  try {
    if (isSignUpMode) {
      if (!name) { alert("Please enter your name"); throw new Error("No name"); }
      if (password.length < 6) { alert("Password dapat 6 characters pataas boss!"); throw new Error("Short pass"); }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid, name: name, email: email, createdAt: serverTimestamp()
      });
      alert("✅ Registration success! Now Sign In boss.");
      clearAuthInputs();
      switchToSignInMode();
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    console.error("AUTH ERROR:", err.code, err.message);
    if (err.message!== "No name" && err.message!== "Short pass") {
      let msg = err.message;
      if (err.code === "auth/user-not-found") msg = "User not found - mag Sign Up ka muna boss!";
      if (err.code === "auth/wrong-password") msg = "Mali password boss!";
      if (err.code === "auth/invalid-credential") msg = "Mali email or password boss - check mo!";
      if (err.code === "auth/configuration-not-found") msg = "Boss, hindi pa enabled Email/Password sa Firebase! Firebase Console > Authentication > Sign-in method > Enable Email/Password";
      alert("❌ " + msg);
    }
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignUpMode? "Sign Up" : "Sign In";
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    currentUserName.textContent = user.displayName || "User";
    currentUserEmail.textContent = user.email;
    userInitials.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    resetToBlankState();
    fetchAllUsers();
    listenToContacts();
    listenToActiveConversations();
    listenForIncomingCalls();
  } else {
    currentUser = null;
    switchToSignInMode();
    clearAuthInputs();
    authScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
    if (unsubscribeConversations) unsubscribeConversations();
    if (unsubscribeContacts) unsubscribeContacts();
    if (unsubscribeTyping) unsubscribeTyping();
    if (unsubscribeIncomingCall) unsubscribeIncomingCall();
    Object.values(unreadListeners).forEach(unsub => unsub());
    unreadListeners = {};
  }
});

logoutBtn.addEventListener("click", () => {
  if (currentUser && activeTargetUser) setTypingState(false);
  if (pc) endCall();
  signOut(auth).then(() => { clearAuthInputs(); switchToSignInMode(); });
});

function resetToBlankState() {
  activeTargetUser = null;
  emptyState.classList.remove("hidden");
  activeChatWrapper.classList.add("hidden");
  chatArea.classList.remove("active-mobile");
  clearImageAttachment();
  cancelReply();
  if (unsubscribeMessages) unsubscribeMessages();
  if (unsubscribeTyping) unsubscribeTyping();
}

// CONTACTS & CONVERSATIONS - FIXED CLICKABLE
function fetchAllUsers() {
  const usersRef = collection(db, "users");
  onSnapshot(usersRef, (snapshot) => {
    allUsers = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.uid!== currentUser.uid) allUsers.push(data);
    });
    renderModalUsers(allUsers);
    // Also re-render current tab
    if(currentTab === "contacts") renderContactsList(userContacts);
  });
}
function listenToContacts() {
  const contactsRef = collection(db, "users", currentUser.uid, "contacts");
  if (unsubscribeContacts) unsubscribeContacts();
  unsubscribeContacts = onSnapshot(contactsRef, (snapshot) => {
    userContacts = [];
    snapshot.forEach((docSnap) => userContacts.push(docSnap.data()));
    contactsCountEl.textContent = userContacts.length;
    if (currentTab === "contacts") renderContactsList(userContacts);
  });
}
function listenToActiveConversations() {
  const userConversationsRef = collection(db, "users", currentUser.uid, "conversations");
  const q = query(userConversationsRef, orderBy("lastMessageTime", "desc"));
  if (unsubscribeConversations) unsubscribeConversations();
  unsubscribeConversations = onSnapshot(q, (snapshot) => {
    activeConversations = [];
    snapshot.forEach((docSnap) => activeConversations.push(docSnap.data()));
    if (currentTab === "chats") renderConversationsList(activeConversations);
  });
}
function renderConversationsList(convs) {
  chatsList.innerHTML = "";
  if (convs.length === 0) {
    chatsList.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--text-muted)"><p style="font-size:0.9rem">No active chats yet.</p><p style="font-size:0.8rem;margin-top:4px">Click <b>Search & Add Users</b> to start!</p></div>`;
    return;
  }
  convs.forEach((conv) => {
    const item = document.createElement("div");
    item.className = `chat-item ${activeTargetUser?.uid === conv.targetUid? "active" : ""}`;
    item.id = `user-item-${conv.targetUid}`;
    const formattedTime = conv.lastMessageTime?.toDate? formatShortTime(conv.lastMessageTime.toDate()) : "";
    item.innerHTML = `<div class="avatar-container"><span>${conv.targetName.charAt(0).toUpperCase()}</span></div><div class="chat-item-details"><div class="chat-item-header"><h4 class="chat-item-title">${escapeHTML(conv.targetName)}</h4><span class="chat-item-time">${formattedTime}</span></div><p class="chat-item-preview">${escapeHTML(conv.lastMessageText || "")}</p></div><div class="chat-item-meta"><span class="unread-badge hidden" id="unread-badge-${conv.targetUid}">0</span></div>`;
    item.addEventListener("click", () => {
      const target = allUsers.find(u => u.uid === conv.targetUid) || { uid: conv.targetUid, name: conv.targetName, email: conv.targetEmail || "" };
      selectUserToChat(target);
    });
    chatsList.appendChild(item);
    setupUnreadListener(conv.targetUid);
  });
}
function renderContactsList(contacts) {
  chatsList.innerHTML = "";
  if (contacts.length === 0) {
    chatsList.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted)"><p>No contacts yet.</p></div>`;
    return;
  }
  contacts.forEach((c) => {
    const item = document.createElement("div");
    item.className = `chat-item ${activeTargetUser?.uid === c.uid? "active" : ""}`;
    item.id = `user-item-${c.uid}`;
    item.innerHTML = `<div class="avatar-container"><span>${c.name.charAt(0).toUpperCase()}</span></div><div class="chat-item-details"><h4 class="chat-item-title">${escapeHTML(c.name)}</h4><p class="chat-item-preview">${escapeHTML(c.email)}</p></div><div class="chat-item-meta"><span class="unread-badge hidden" id="unread-badge-${c.uid}">0</span></div>`;
    item.addEventListener("click", () => selectUserToChat(c));
    chatsList.appendChild(item);
    setupUnreadListener(c.uid);
  });
}
function setupUnreadListener(targetUid) {
  const chatId = getChatId(currentUser.uid, targetUid);
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, where("senderId", "==", targetUid), where("isRead", "==", false));
  if (unreadListeners[targetUid]) unreadListeners[targetUid]();
  unreadListeners[targetUid] = onSnapshot(q, (snapshot) => {
    const badgeEl = document.getElementById(`unread-badge-${targetUid}`);
    const itemEl = document.getElementById(`user-item-${targetUid}`);
    if (badgeEl && itemEl) {
      if (snapshot.size > 0 && activeTargetUser?.uid!== targetUid) {
        badgeEl.textContent = snapshot.size > 99? "99+" : snapshot.size;
        badgeEl.classList.remove("hidden");
        itemEl.classList.add("has-unread");
      } else {
        badgeEl.classList.add("hidden");
        itemEl.classList.remove("has-unread");
      }
    }
  });
}
tabChatsBtn.addEventListener("click", () => {
  currentTab = "chats"; tabChatsBtn.classList.add("active"); tabContactsBtn.classList.remove("active");
  renderConversationsList(activeConversations);
});
tabContactsBtn.addEventListener("click", () => {
  currentTab = "contacts"; tabContactsBtn.classList.add("active"); tabChatsBtn.classList.remove("active");
  renderContactsList(userContacts);
});

// MODAL
function openAddUserModal() { addUserModal.classList.remove("hidden"); renderModalUsers(allUsers); }
function closeAddUserModal() { addUserModal.classList.add("hidden"); }
function renderModalUsers(usersToRender) {
  modalUsersList.innerHTML = "";
  if (usersToRender.length === 0) { modalUsersList.innerHTML = `<p style="padding:12px;text-align:center;color:var(--text-muted)">No users found.</p>`; return; }
  usersToRender.forEach((u) => {
    const isAdded = userContacts.some(c => c.uid === u.uid);
    const card = document.createElement("div");
    card.className = "user-search-card";
    card.innerHTML = `<div style="display:flex;align-items:center;gap:10px;min-width:0"><div class="avatar-container" style="width:36px;height:36px"><span>${u.name.charAt(0).toUpperCase()}</span></div><div style="min-width:0"><h4 style="font-size:0.88rem;font-weight:600">${escapeHTML(u.name)}</h4><p style="font-size:0.75rem;color:var(--text-secondary)">${escapeHTML(u.email)}</p></div></div><button class="btn ${isAdded? "btn-secondary" : "btn-primary"}" id="add-btn-${u.uid}">${isAdded? '💬 Chat' : '➕ Add'}</button>`;
    card.querySelector(`#add-btn-${u.uid}`).addEventListener("click", async () => { if (!isAdded) await addContact(u); closeAddUserModal(); selectUserToChat(u); });
    modalUsersList.appendChild(card);
  });
}
async function addContact(targetUser) {
  await setDoc(doc(db, "users", currentUser.uid, "contacts", targetUser.uid), { uid: targetUser.uid, name: targetUser.name, email: targetUser.email, addedAt: serverTimestamp() });
}
addUserBtn.addEventListener("click", openAddUserModal);
startAddUserBtn.addEventListener("click", openAddUserModal);
closeModalBtn.addEventListener("click", closeAddUserModal);
modalUserSearch.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  renderModalUsers(allUsers.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)));
});
userSearch.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  if (currentTab === "chats") renderConversationsList(activeConversations.filter(c => c.targetName.toLowerCase().includes(term)));
  else renderContactsList(userContacts.filter(c => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)));
});

// PHOTO & LIGHTBOX
imageFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert("File too large! 2MB max boss"); imageFileInput.value = ""; return; }
  const reader = new FileReader();
  reader.onload = (event) => { selectedImageData = event.target.result; imagePreviewImg.src = selectedImageData; imagePreviewBar.classList.remove("hidden"); };
  reader.readAsDataURL(file);
});
removeImageBtn.addEventListener("click", clearImageAttachment);
function clearImageAttachment() { selectedImageData = null; imageFileInput.value = ""; imagePreviewImg.src = ""; imagePreviewBar.classList.add("hidden"); }
function openLightbox(src) { lightboxImg.src = src; lightboxDownloadBtn.href = src; lightboxModal.classList.remove("hidden"); }
function closeLightbox() { lightboxModal.classList.add("hidden"); lightboxImg.src = ""; }
lightboxCloseBtn.addEventListener("click", closeLightbox);
lightboxModal.addEventListener("click", (e) => { if (e.target === lightboxModal || e.target.classList.contains("lightbox-content-container")) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" &&!lightboxModal.classList.contains("hidden")) closeLightbox(); });

// REPLY & TYPING
function startReply(msg) {
  const senderName = msg.senderId === currentUser.uid? "Yourself" : (activeTargetUser?.name || "User");
  const previewText = msg.text || (msg.imageUrl? "📷 Photo" : "Message");
  activeReplyTarget = { messageId: msg.id, senderName: senderName, text: previewText };
  replySenderName.textContent = senderName;
  replyPreviewText.textContent = previewText;
  replyBanner.classList.remove("hidden");
  messageInput.focus();
}
function cancelReply() { activeReplyTarget = null; replyBanner.classList.add("hidden"); }
cancelReplyBtn.addEventListener("click", cancelReply);
function getChatId(uid1, uid2) { return uid1 < uid2? `${uid1}_${uid2}` : `${uid2}_${uid1}`; }
async function setTypingState(isTyping) {
  if (!currentUser ||!activeTargetUser) return;
  const chatId = getChatId(currentUser.uid, activeTargetUser.uid);
  try { await setDoc(doc(db, "chats", chatId, "typing", currentUser.uid), { isTyping: isTyping, updatedAt: serverTimestamp() }, { merge: true }); } catch (err) {}
}
function listenToTypingStatus() {
  if (unsubscribeTyping) unsubscribeTyping();
  if (!activeTargetUser) return;
  const chatId = getChatId(currentUser.uid, activeTargetUser.uid);
  const typingRef = doc(db, "chats", chatId, "typing", activeTargetUser.uid);
  unsubscribeTyping = onSnapshot(typingRef, (docSnap) => {
    if (docSnap.exists() && docSnap.data().isTyping) { typingUserText.textContent = `${activeTargetUser.name} is typing...`; typingIndicatorBar.classList.remove("hidden"); }
    else typingIndicatorBar.classList.add("hidden");
  });
}
messageInput.addEventListener("input", () => {
  if (!activeTargetUser) return;
  setTypingState(true);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => setTypingState(false), 2000);
});

// CHAT SELECT & MESSAGES - FIXED LOADING
async function selectUserToChat(targetUser) {
  if (activeTargetUser) setTypingState(false);
  activeTargetUser = targetUser;
  document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
  const currentItem = document.getElementById(`user-item-${targetUser.uid}`);
  if (currentItem) currentItem.classList.add("active");
  emptyState.classList.add("hidden");
  activeChatWrapper.classList.remove("hidden");
  chatArea.classList.add("active-mobile");
  activeChatTitle.textContent = targetUser.name;
  chatInitials.textContent = targetUser.name.charAt(0).toUpperCase();
  clearImageAttachment(); cancelReply();
  listenToDirectMessages(); listenToTypingStatus(); markMessagesAsRead(targetUser.uid);
}
function listenToDirectMessages() {
  if (unsubscribeMessages) unsubscribeMessages();
  const chatId = getChatId(currentUser.uid, activeTargetUser.uid);
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    const msgs = []; snapshot.forEach((docSnap) => { msgs.push({ id: docSnap.id,...docSnap.data() }); });
    renderMessages(msgs); markMessagesAsRead(activeTargetUser.uid);
  }, (err) => {
    console.error("Messages load error:", err);
    messagesContainer.innerHTML = `<p style="color:red;padding:12px">Error loading messages: ${err.message}<br>Check Firestore rules!</p>`;
  });
}
async function markMessagesAsRead(targetUid) {
  if (!currentUser ||!targetUid) return;
  const chatId = getChatId(currentUser.uid, targetUid);
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, where("senderId", "==", targetUid), where("isRead", "==", false));
  try { const snapshot = await getDocs(q); snapshot.forEach((docSnap) => { updateDoc(doc(db, "chats", chatId, "messages", docSnap.id), { isRead: true }); }); } catch (err) {}
}
function renderMessages(msgs) {
  messagesContainer.innerHTML = "";
  if(msgs.length===0){
    messagesContainer.innerHTML = `<div style="text-align:center;padding:40px;color:#65676b"><div style="font-size:28px">💬</div><p>No messages yet<br>Say hi to ${activeTargetUser.name}!</p></div>`;
    return;
  }
  const lastMsgIndex = msgs.length - 1;
  msgs.forEach((msg, idx) => {
    const isOutgoing = msg.senderId === currentUser.uid;
    const isLast = idx === lastMsgIndex;
    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper ${isOutgoing? "outgoing" : "incoming"}`;
    wrapper.id = `msg-container-${msg.id}`;
    const formattedTime = msg.createdAt?.toDate? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now";
    let quotedHTML = msg.replyTo? `<div class="quoted-reply-box" id="quoted-box-${msg.id}"><span class="quoted-sender">${escapeHTML(msg.replyTo.senderName)}</span><p class="quoted-text">${escapeHTML(msg.replyTo.text)}</p></div>` : "";
    let photoHTML = msg.imageUrl? `<img src="${msg.imageUrl}" alt="Photo" class="message-img" id="msg-img-${msg.id}" />` : "";
    let textHTML = msg.text? `<div>${escapeHTML(msg.text)}</div>` : "";
    let seenHTML = "";
    if (isOutgoing && isLast) { seenHTML = msg.isRead? `<span class="seen-status read">✓✓ Seen</span>` : `<span class="seen-status">✓ Sent</span>`; }
    wrapper.innerHTML = `<div class="message-row"><div class="message-bubble">${quotedHTML}${photoHTML}${textHTML}<div class="message-meta-row"><span class="message-time">${formattedTime}</span>${seenHTML}</div></div><div class="message-actions"><button class="reply-action-btn" id="reply-btn-${msg.id}">↩️</button></div></div>`;
    wrapper.querySelector(`#reply-btn-${msg.id}`).addEventListener("click", () => startReply(msg));
    if (msg.replyTo?.messageId) {
      wrapper.querySelector(`#quoted-box-${msg.id}`)?.addEventListener("click", () => {
        const targetEl = document.getElementById(`msg-container-${msg.replyTo.messageId}`);
        if (targetEl) { targetEl.scrollIntoView({ behavior: "smooth", block: "center" }); targetEl.style.backgroundColor = "rgba(0,132,255,0.15)"; setTimeout(() => targetEl.style.backgroundColor = "transparent", 1500); }
      });
    }
    if (msg.imageUrl) wrapper.querySelector(`#msg-img-${msg.id}`)?.addEventListener("click", () => openLightbox(msg.imageUrl));
    messagesContainer.appendChild(wrapper);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => { if (e.key === "Enter" &&!e.shiftKey) { e.preventDefault(); sendMessage(); } });
async function sendMessage() {
  const text = messageInput.value.trim(); const imageToSend = selectedImageData;
  if ((!text &&!imageToSend) ||!activeTargetUser) return;
  const chatId = getChatId(currentUser.uid, activeTargetUser.uid);
  const replyPayload = activeReplyTarget? {...activeReplyTarget } : null;
  messageInput.value = ""; clearImageAttachment(); cancelReply(); setTypingState(false);
  const previewText = imageToSend? (text? `📷 Photo: ${text}` : "📷 Photo") : text;
  await addDoc(collection(db, "chats", chatId, "messages"), { senderId: currentUser.uid, receiverId: activeTargetUser.uid, text: text || "", imageUrl: imageToSend || null, replyTo: replyPayload, isRead: false, createdAt: serverTimestamp() });
  await setDoc(doc(db, "users", currentUser.uid, "conversations", activeTargetUser.uid), { targetUid: activeTargetUser.uid, targetName: activeTargetUser.name, targetEmail: activeTargetUser.email || "", lastMessageText: previewText, lastMessageTime: serverTimestamp() });
  await setDoc(doc(db, "users", activeTargetUser.uid, "conversations", currentUser.uid), { targetUid: currentUser.uid, targetName: currentUser.displayName || "User", targetEmail: currentUser.email || "", lastMessageText: previewText, lastMessageTime: serverTimestamp() });
}

// ==========================================================================
// 10. VIDEO CALL SYSTEM - FIXED NULL ERROR BOSS! ⭐⭐⭐
// ==========================================================================
async function startCall(type) {
  if (!activeTargetUser) return alert("Pumili ka muna ng ka-chat boss! Click mo contact!");
  if (pc) return alert("May active call ka pa boss - end muna!");
  callType = type; isCaller = true;
  currentCallId = doc(collection(db, "calls")).id;
  const callDoc = doc(db, "calls", currentCallId);
  console.log("Starting call", type, currentCallId);
  try {
    // 1. Create call doc first with ringing status
    await setDoc(callDoc, {
      callerId: currentUser.uid,
      callerName: currentUser.displayName || currentUser.email.split('@')[0],
      receiverId: activeTargetUser.uid,
      receiverName: activeTargetUser.name,
      type: type,
      status: "ringing",
      createdAt: serverTimestamp()
    });

    // 2. Create peer and get media
    await createPeerConnection(callDoc, type);

    // 3. FIX: Use pc.localDescription to ensure type is valid!
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === 'video' });
    await pc.setLocalDescription(offer);

    // IMPORTANT FIX - use localDescription not offer directly
    const finalOffer = pc.localDescription;
    console.log("Offer created with type:", finalOffer.type);

    await updateDoc(callDoc, {
      offer: {
        type: finalOffer.type, // Sure na hindi null!
        sdp: finalOffer.sdp
      }
    });

    videoCallModal.classList.remove("hidden");
    callStatus.style.display = "block";
    callStatus.textContent = type === 'video'? `Calling ${activeTargetUser.name}... 📹` : `Voice calling ${activeTargetUser.name}... 📞`;
    if (type === 'voice') localVideo.classList.add("hidden"); else localVideo.classList.remove("hidden");

    // 4. Listen for answer - FIXED with validation
    onSnapshot(callDoc, async (snap) => {
      const data = snap.data();
      if (!data) return;
      if (data.answer && pc &&!pc.currentRemoteDescription) {
        console.log("Got answer with type:", data.answer.type);
        try{
          // FIX: Validate answer type
          const validAnswer = {
            type: (data.answer.type && data.answer.type!== null && data.answer.type!== 'null')? data.answer.type : 'answer',
            sdp: data.answer.sdp
          };
          await pc.setRemoteDescription(new RTCSessionDescription(validAnswer));
          callStatus.textContent = "Connected ✅";
          setTimeout(() => { callStatus.style.display = "none"; }, 2000);
        }catch(e){ console.error("Set remote answer failed:", e); }
      }
      if (data.status === "ended" || data.status === "declined") {
        console.log("Call ended by other");
        if(data.status === "declined") alert("Declined boss 😔");
        endCall();
      }
    });

    // 5. Listen for ICE
    onSnapshot(collection(callDoc, "answerCandidates"), (snap) => {
      snap.docChanges().forEach(c => {
        if (c.type === "added" && pc) {
          try{ pc.addIceCandidate(new RTCIceCandidate(c.doc.data())); }catch(e){}
        }
      });
    });

  } catch (err) {
    console.error("Call start error", err);
    alert("Call error: " + err.message + "\nTips: HTTPS + Allow camera/mic + Firestore rules");
    endCall();
  }
}

async function createPeerConnection(callDoc, type) {
  pc = new RTCPeerConnection(servers);
  const constraints = type === 'video'? { video: true, audio: true } : { video: false, audio: true };
  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  localVideo.srcObject = localStream;
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  pc.ontrack = (e) => {
    console.log("Remote track:", e.track.kind);
    e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
  };
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      const col = collection(callDoc, isCaller? "offerCandidates" : "answerCandidates");
      addDoc(col, e.candidate.toJSON());
    }
  };
  pc.onconnectionstatechange = () => {
    console.log("Conn state", pc.connectionState);
    if (pc.connectionState === "failed") {
      callStatus.style.display = "block";
      callStatus.textContent = "Connection failed - Try again boss";
    }
    if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
      setTimeout(()=>{ if(pc && pc.connectionState!== "connected") endCall(); }, 3000);
    }
  };
}

function listenForIncomingCalls() {
  if (unsubscribeIncomingCall) unsubscribeIncomingCall();
  const callsRef = collection(db, "calls");
  const q = query(callsRef, where("receiverId", "==", currentUser.uid), where("status", "==", "ringing"));
  unsubscribeIncomingCall = onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        const callId = change.doc.id;
        if (currentCallId) return; // Busy
        // Ignore old calls >60sec
        const age = data.createdAt? (Date.now() - data.createdAt.toDate().getTime())/1000 : 0;
        if(age > 60) return;
        incomingCallData = { id: callId,...data };
        incomingName.textContent = `${data.callerName} is calling...`;
        incomingInitials.textContent = data.callerName.charAt(0).toUpperCase();
        incomingTypeEl.textContent = data.type === "video"? "Incoming video call 📹" : "Incoming voice call 📞";
        incomingPopup.classList.remove("hidden");
        if (navigator.vibrate) navigator.vibrate([500, 300, 500]);
        console.log("Incoming call from", data.callerName);
      }
      if (change.type === "removed" || change.doc.data().status!== "ringing") {
        if (incomingCallData?.id === change.doc.id) {
          incomingPopup.classList.add("hidden");
          incomingCallData = null;
        }
      }
    });
  });
}

// FIXED ACCEPT - ITO YUNG FIX SA ERROR MO SA SCREENSHOT BOSS! ⭐
async function acceptIncomingCall() {
  if (!incomingCallData) return;
  const callDoc = doc(db, "calls", incomingCallData.id);
  currentCallId = incomingCallData.id;
  callType = incomingCallData.type;
  isCaller = false;
  try {
    console.log("Accepting call:", currentCallId);
    await createPeerConnection(callDoc, callType);

    // RE-FETCH OFFER PARA HINDI NULL!
    let offer = incomingCallData.offer;
    if(!offer ||!offer.sdp){
      console.log("Re-fetching offer...");
      const freshSnap = await getDoc(callDoc);
      offer = freshSnap.data()?.offer;
    }
    if(!offer ||!offer.sdp) throw new Error("Offer missing - caller closed, tawag ulit boss");

    // FIX SA NULL TYPE ERROR - ITO YUNG NASA SCREENSHOT MO!
    const validOffer = {
      type: (offer.type && offer.type!== null && offer.type!== 'null' && offer.type!== '')? offer.type : 'offer',
      sdp: offer.sdp
    };
    console.log("Setting remote offer type:", validOffer.type);
    await pc.setRemoteDescription(new RTCSessionDescription(validOffer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await updateDoc(callDoc, {
      answer: { type: answer.type, sdp: answer.sdp },
      status: "connected"
    });

    videoCallModal.classList.remove("hidden");
    incomingPopup.classList.add("hidden");
    callStatus.style.display = "block";
    callStatus.textContent = "Connected ✅";
    if (callType === 'voice') localVideo.classList.add("hidden"); else localVideo.classList.remove("hidden");
    setTimeout(() => callStatus.style.display = "none", 2000);

    onSnapshot(collection(callDoc, "offerCandidates"), (s) => {
      s.docChanges().forEach(c => {
        if (c.type === "added" && pc) {
          try{ pc.addIceCandidate(new RTCIceCandidate(c.doc.data())); }catch(e){}
        }
      });
    });
    onSnapshot(callDoc, (s) => { if (s.data()?.status === "ended") endCall(); });

  } catch (err) {
    console.error("Accept error", err);
    alert("Accept failed: " + err.message);
    endCall();
  }
}

async function declineIncomingCall() {
  if (!incomingCallData) return;
  const callDoc = doc(db, "calls", incomingCallData.id);
  await updateDoc(callDoc, { status: "declined" });
  setTimeout(async () => { try { await deleteDoc(callDoc); } catch (e) {} }, 2000);
  incomingPopup.classList.add("hidden");
  incomingCallData = null;
}

async function endCall() {
  console.log("Ending call");
  if (pc) { pc.close(); pc = null; }
  if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
  remoteStream = null;
  if (remoteVideo) remoteVideo.srcObject = null;
  if (localVideo) localVideo.srcObject = null;
  videoCallModal.classList.add("hidden");
  callStatus.style.display = "block";
  callStatus.textContent = "Call ended";
  if (currentCallId) {
    const callDoc = doc(db, "calls", currentCallId);
    try {
      await updateDoc(callDoc, { status: "ended" });
      setTimeout(async () => { try { await deleteDoc(callDoc); } catch (e) {} }, 3000);
    } catch (e) {}
  }
  currentCallId = null; isCaller = false; incomingPopup.classList.add("hidden");
}

// BUTTONS
videoCallBtn?.addEventListener("click", () => startCall('video'));
voiceCallBtn?.addEventListener("click", () => startCall('voice'));
acceptCallBtn?.addEventListener("click", acceptIncomingCall);
declineCallBtn?.addEventListener("click", declineIncomingCall);
endCallBtn?.addEventListener("click", endCall);
muteBtn?.addEventListener("click", () => {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled =!audioTrack.enabled;
    muteBtn.classList.toggle("muted",!audioTrack.enabled);
    muteBtn.innerHTML = audioTrack.enabled? '🎤' : '🔇';
  }
});
cameraBtn?.addEventListener("click", () => {
  if (!localStream) return;
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled =!videoTrack.enabled;
    cameraBtn.classList.toggle("muted",!videoTrack.enabled);
    cameraBtn.innerHTML = videoTrack.enabled? '📹' : '🚫';
  }
});
screenBtn?.addEventListener("click", async () => {
  if (!localStream ||!pc) return;
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
    if (sender) sender.replaceTrack(screenTrack);
    localVideo.srcObject = screenStream;
    screenTrack.onended = async () => {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const camTrack = camStream.getVideoTracks()[0];
      const audioTrack = camStream.getAudioTracks()[0];
      if (sender) sender.replaceTrack(camTrack);
      const senderAudio = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
      if (senderAudio && audioTrack) senderAudio.replaceTrack(audioTrack);
      localVideo.srcObject = camStream;
      localStream = camStream;
    };
  } catch (e) { console.log("Screen share cancelled", e); }
});

// GENERAL
themeToggleBtn?.addEventListener("click", () => { const isDark = document.body.getAttribute("data-theme") === "dark"; document.body.setAttribute("data-theme", isDark? "light" : "dark"); });
mobileBackBtn?.addEventListener("click", () => { if (activeTargetUser) setTypingState(false); chatArea.classList.remove("active-mobile"); });
function formatShortTime(date) { const now = new Date(); if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); return date.toLocaleDateString([], { month: "short", day: "numeric" }); }
function escapeHTML(str) { return str? str.replace(/[&<>'"]/g, tag => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag)) : ""; }

console.log("Messenger V9 FIXED - Contacts clickable + Messages + Video call no more null error boss!");
