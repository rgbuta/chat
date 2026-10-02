import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, updateDoc, getDocs, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// VIDEO CALL + CALL LOG
let pc = null;
let localStream = null;
let remoteStream = null;
let currentCallId = null;
let isCaller = false;
let callType = 'video';
let incomingCallData = null;
let callStartTime = null;
let callDurationInterval = null;
const servers = { iceServers: [{ urls: ['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302'] }] };

// DOM - same as old mo boss
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

// AUTH (same)
function clearAuthInputs(){ if(authNameInput) authNameInput.value=""; if(authEmailInput) authEmailInput.value=""; if(authPasswordInput) authPasswordInput.value=""; }
function switchToSignInMode(){ isSignUpMode=false; authTitle.textContent="Welcome Back"; authSubtitle.textContent="Sign in to start messaging"; authSubmitBtn.textContent="Sign In"; nameGroup.classList.add("hidden"); authToggleText.innerHTML=`Don't have account? <a href="#" id="auth-toggle-btn">Sign Up</a>`; }
function switchToSignUpMode(){ isSignUpMode=true; authTitle.textContent="Create Account"; authSubtitle.textContent="Register to start messaging"; authSubmitBtn.textContent="Sign Up"; nameGroup.classList.remove("hidden"); authToggleText.innerHTML=`Already have account? <a href="#" id="auth-toggle-btn">Sign In</a>`; }
document.addEventListener("click",(e)=>{ if(e.target&&e.target.id==="auth-toggle-btn"){ e.preventDefault(); clearAuthInputs(); if(isSignUpMode) switchToSignInMode(); else switchToSignUpMode(); }});
authForm.addEventListener("submit", async(e)=>{
  e.preventDefault(); const email=authEmailInput.value.trim(); const password=authPasswordInput.value.trim(); const name=authNameInput.value.trim();
  authSubmitBtn.disabled=true; authSubmitBtn.textContent="Loading...";
  try{
    if(isSignUpMode){
      if(!name){ alert("Name required"); throw new Error("No name"); }
      if(password.length<6){ alert("6 chars pataas boss!"); throw new Error("Short"); }
      const cred=await createUserWithEmailAndPassword(auth,email,password);
      await updateProfile(cred.user,{displayName:name});
      await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,name,email,createdAt:serverTimestamp()});
      alert("✅ Registered! Sign In now boss"); clearAuthInputs(); switchToSignInMode();
    }else{ await signInWithEmailAndPassword(auth,email,password); }
  }catch(err){ if(err.message!=="No name"&&err.message!=="Short"){ let m=err.message; if(err.code==="auth/invalid-credential") m="Mali email or password!"; alert("❌ "+m); } }
  finally{ authSubmitBtn.disabled=false; authSubmitBtn.textContent=isSignUpMode?"Sign Up":"Sign In"; }
});
onAuthStateChanged(auth,(user)=>{
  if(user){ currentUser=user; currentUserName.textContent=user.displayName||"User"; currentUserEmail.textContent=user.email; userInitials.textContent=(user.displayName||user.email).charAt(0).toUpperCase(); authScreen.classList.add("hidden"); appScreen.classList.remove("hidden"); resetToBlankState(); fetchAllUsers(); listenToContacts(); listenToActiveConversations(); listenForIncomingCalls(); }
  else{ currentUser=null; switchToSignInMode(); clearAuthInputs(); authScreen.classList.remove("hidden"); appScreen.classList.add("hidden"); if(unsubscribeConversations) unsubscribeConversations(); if(unsubscribeContacts) unsubscribeContacts(); if(unsubscribeTyping) unsubscribeTyping(); if(unsubscribeIncomingCall) unsubscribeIncomingCall(); Object.values(unreadListeners).forEach(u=>u()); unreadListeners={}; }
});
logoutBtn.addEventListener("click",()=>{ if(currentUser&&activeTargetUser) setTypingState(false); if(pc) endCall('ended'); signOut(auth).then(()=>{ clearAuthInputs(); switchToSignInMode(); }); });
function resetToBlankState(){ activeTargetUser=null; emptyState.classList.remove("hidden"); activeChatWrapper.classList.add("hidden"); chatArea.classList.remove("active-mobile"); clearImageAttachment(); cancelReply(); if(unsubscribeMessages) unsubscribeMessages(); if(unsubscribeTyping) unsubscribeTyping(); }

// CONTACTS
function fetchAllUsers(){ onSnapshot(collection(db,"users"),(snap)=>{ allUsers=[]; snap.forEach(d=>{ const data=d.data(); if(data.uid!==currentUser.uid) allUsers.push(data); }); renderModalUsers(allUsers); }); }
function listenToContacts(){ const ref=collection(db,"users",currentUser.uid,"contacts"); if(unsubscribeContacts) unsubscribeContacts(); unsubscribeContacts=onSnapshot(ref,(snap)=>{ userContacts=[]; snap.forEach(d=>userContacts.push(d.data())); contactsCountEl.textContent=userContacts.length; if(currentTab==="contacts") renderContactsList(userContacts); }); }
function listenToActiveConversations(){ const ref=collection(db,"users",currentUser.uid,"conversations"); const q=query(ref,orderBy("lastMessageTime","desc")); if(unsubscribeConversations) unsubscribeConversations(); unsubscribeConversations=onSnapshot(q,(snap)=>{ activeConversations=[]; snap.forEach(d=>activeConversations.push(d.data())); if(currentTab==="chats") renderConversationsList(activeConversations); }); }
function renderConversationsList(convs){ chatsList.innerHTML=""; if(convs.length===0){ chatsList.innerHTML=`<div style="padding:24px;text-align:center;color:#65676b"><p>No chats yet</p><p style="font-size:0.8rem">Add users to start!</p></div>`; return; } convs.forEach(conv=>{ const item=document.createElement("div"); item.className=`chat-item ${activeTargetUser?.uid===conv.targetUid?"active":""}`; item.id=`user-item-${conv.targetUid}`; const t=conv.lastMessageTime?.toDate? formatShortTime(conv.lastMessageTime.toDate()):""; item.innerHTML=`<div class="avatar-container"><span>${conv.targetName.charAt(0).toUpperCase()}</span></div><div class="chat-item-details"><div class="chat-item-header"><h4 class="chat-item-title">${escapeHTML(conv.targetName)}</h4><span class="chat-item-time">${t}</span></div><p class="chat-item-preview">${escapeHTML(conv.lastMessageText||"")}</p></div><div class="chat-item-meta"><span class="unread-badge hidden" id="unread-badge-${conv.targetUid}">0</span></div>`; item.addEventListener("click",()=>{ const target=allUsers.find(u=>u.uid===conv.targetUid)||{uid:conv.targetUid,name:conv.targetName,email:conv.targetEmail||""}; selectUserToChat(target); }); chatsList.appendChild(item); setupUnreadListener(conv.targetUid); }); }
function renderContactsList(contacts){ chatsList.innerHTML=""; if(contacts.length===0){ chatsList.innerHTML=`<div style="padding:24px;text-align:center;color:#65676b"><p>No contacts</p></div>`; return; } contacts.forEach(c=>{ const item=document.createElement("div"); item.className=`chat-item ${activeTargetUser?.uid===c.uid?"active":""}`; item.id=`user-item-${c.uid}`; item.innerHTML=`<div class="avatar-container"><span>${c.name.charAt(0).toUpperCase()}</span></div><div class="chat-item-details"><h4 class="chat-item-title">${escapeHTML(c.name)}</h4><p class="chat-item-preview">${escapeHTML(c.email)}</p></div><div class="chat-item-meta"><span class="unread-badge hidden" id="unread-badge-${c.uid}">0</span></div>`; item.addEventListener("click",()=>selectUserToChat(c)); chatsList.appendChild(item); setupUnreadListener(c.uid); }); }
function setupUnreadListener(targetUid){ const chatId=getChatId(currentUser.uid,targetUid); const q=query(collection(db,"chats",chatId,"messages"),where("senderId","==",targetUid),where("isRead","==",false)); if(unreadListeners[targetUid]) unreadListeners[targetUid](); unreadListeners[targetUid]=onSnapshot(q,(snap)=>{ const badge=document.getElementById(`unread-badge-${targetUid}`); const item=document.getElementById(`user-item-${targetUid}`); if(badge&&item){ if(snap.size>0&&activeTargetUser?.uid!==targetUid){ badge.textContent=snap.size>99?"99+":snap.size; badge.classList.remove("hidden"); item.classList.add("has-unread"); }else{ badge.classList.add("hidden"); item.classList.remove("has-unread"); } } }); }
tabChatsBtn.addEventListener("click",()=>{ currentTab="chats"; tabChatsBtn.classList.add("active"); tabContactsBtn.classList.remove("active"); renderConversationsList(activeConversations); });
tabContactsBtn.addEventListener("click",()=>{ currentTab="contacts"; tabContactsBtn.classList.add("active"); tabChatsBtn.classList.remove("active"); renderContactsList(userContacts); });

// MODAL
function openAddUserModal(){ addUserModal.classList.remove("hidden"); renderModalUsers(allUsers); }
function closeAddUserModal(){ addUserModal.classList.add("hidden"); }
function renderModalUsers(list){ modalUsersList.innerHTML=""; if(list.length===0){ modalUsersList.innerHTML=`<p style="padding:12px;text-align:center;color:#65676b">No users</p>`; return; } list.forEach(u=>{ const added=userContacts.some(c=>c.uid===u.uid); const card=document.createElement("div"); card.className="user-search-card"; card.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><div class="avatar-container" style="width:36px;height:36px"><span>${u.name.charAt(0).toUpperCase()}</span></div><div><h4 style="font-size:0.88rem">${escapeHTML(u.name)}</h4><p style="font-size:0.75rem;color:#65676b">${escapeHTML(u.email)}</p></div></div><button class="btn ${added?"btn-secondary":"btn-primary"}" id="add-btn-${u.uid}">${added?"💬 Chat":"➕ Add"}</button>`; card.querySelector(`#add-btn-${u.uid}`).addEventListener("click",async()=>{ if(!added) await setDoc(doc(db,"users",currentUser.uid,"contacts",u.uid),{uid:u.uid,name:u.name,email:u.email,addedAt:serverTimestamp()}); closeAddUserModal(); selectUserToChat(u); }); modalUsersList.appendChild(card); }); }
addUserBtn.addEventListener("click",openAddUserModal); startAddUserBtn.addEventListener("click",openAddUserModal); closeModalBtn.addEventListener("click",closeAddUserModal);
modalUserSearch.addEventListener("input",(e)=>{ const t=e.target.value.toLowerCase(); renderModalUsers(allUsers.filter(u=>u.name.toLowerCase().includes(t)||u.email.toLowerCase().includes(t))); });
userSearch.addEventListener("input",(e)=>{ const t=e.target.value.toLowerCase(); if(currentTab==="chats") renderConversationsList(activeConversations.filter(c=>c.targetName.toLowerCase().includes(t))); else renderContactsList(userContacts.filter(c=>c.name.toLowerCase().includes(t)||c.email.toLowerCase().includes(t))); });

// IMAGE & LIGHTBOX & REPLY
imageFileInput.addEventListener("change",(e)=>{ const f=e.target.files[0]; if(!f) return; if(f.size>2*1024*1024){ alert("2MB max boss"); imageFileInput.value=""; return; } const r=new FileReader(); r.onload=(ev)=>{ selectedImageData=ev.target.result; imagePreviewImg.src=selectedImageData; imagePreviewBar.classList.remove("hidden"); }; r.readAsDataURL(f); });
removeImageBtn.addEventListener("click",clearImageAttachment);
function clearImageAttachment(){ selectedImageData=null; imageFileInput.value=""; imagePreviewImg.src=""; imagePreviewBar.classList.add("hidden"); }
function openLightbox(src){ lightboxImg.src=src; lightboxDownloadBtn.href=src; lightboxModal.classList.remove("hidden"); }
function closeLightbox(){ lightboxModal.classList.add("hidden"); lightboxImg.src=""; }
lightboxCloseBtn.addEventListener("click",closeLightbox); lightboxModal.addEventListener("click",(e)=>{ if(e.target===lightboxModal||e.target.classList.contains("lightbox-content-container")) closeLightbox(); });
function startReply(msg){ const s=msg.senderId===currentUser.uid?"Yourself":(activeTargetUser?.name||"User"); const p=msg.text||(msg.imageUrl?"📷 Photo":"Message"); activeReplyTarget={messageId:msg.id,senderName:s,text:p}; replySenderName.textContent=s; replyPreviewText.textContent=p; replyBanner.classList.remove("hidden"); messageInput.focus(); }
function cancelReply(){ activeReplyTarget=null; replyBanner.classList.add("hidden"); } cancelReplyBtn.addEventListener("click",cancelReply);
function getChatId(a,b){ return a<b?`${a}_${b}`:`${b}_${a}`; }
async function setTypingState(isTyping){ if(!currentUser||!activeTargetUser) return; const chatId=getChatId(currentUser.uid,activeTargetUser.uid); try{ await setDoc(doc(db,"chats",chatId,"typing",currentUser.uid),{isTyping,updatedAt:serverTimestamp()},{merge:true}); }catch(e){} }
function listenToTypingStatus(){ if(unsubscribeTyping) unsubscribeTyping(); if(!activeTargetUser) return; const chatId=getChatId(currentUser.uid,activeTargetUser.uid); const ref=doc(db,"chats",chatId,"typing",activeTargetUser.uid); unsubscribeTyping=onSnapshot(ref,(snap)=>{ if(snap.exists()&&snap.data().isTyping){ typingUserText.textContent=`${activeTargetUser.name} is typing...`; typingIndicatorBar.classList.remove("hidden"); }else typingIndicatorBar.classList.add("hidden"); }); }
messageInput.addEventListener("input",()=>{ if(!activeTargetUser) return; setTypingState(true); if(typingTimeout) clearTimeout(typingTimeout); typingTimeout=setTimeout(()=>setTypingState(false),2000); });

// CHAT & MESSAGES WITH DELIVERED/SEEN
async function selectUserToChat(targetUser){
  if(activeTargetUser) setTypingState(false);
  activeTargetUser=targetUser;
  document.querySelectorAll(".chat-item").forEach(el=>el.classList.remove("active"));
  const cur=document.getElementById(`user-item-${targetUser.uid}`); if(cur) cur.classList.add("active");
  emptyState.classList.add("hidden"); activeChatWrapper.classList.remove("hidden"); chatArea.classList.add("active-mobile");
  activeChatTitle.textContent=targetUser.name; chatInitials.textContent=targetUser.name.charAt(0).toUpperCase();
  clearImageAttachment(); cancelReply(); listenToDirectMessages(); listenToTypingStatus(); markMessagesAsRead(targetUser.uid);
}
function listenToDirectMessages(){
  if(unsubscribeMessages) unsubscribeMessages();
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const q=query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","asc"));
  unsubscribeMessages=onSnapshot(q,(snap)=>{
    const msgs=[]; snap.forEach(d=>{ msgs.push({id:d.id,...d.data()}); });
    renderMessages(msgs); markMessagesAsRead(activeTargetUser.uid);
  },(err)=>{ messagesContainer.innerHTML=`<p style="color:red;padding:12px">Load failed: ${err.message}</p>`; });
}
async function markMessagesAsRead(targetUid){
  if(!currentUser||!targetUid) return;
  const chatId=getChatId(currentUser.uid,targetUid);
  const q=query(collection(db,"chats",chatId,"messages"),where("senderId","==",targetUid),where("isRead","==",false));
  try{ const snap=await getDocs(q); snap.forEach(d=>{ updateDoc(doc(db,"chats",chatId,"messages",d.id),{isRead:true,isDelivered:true}); }); }catch(e){}
}
function renderMessages(msgs){
  messagesContainer.innerHTML="";
  if(msgs.length===0){ messagesContainer.innerHTML=`<div style="text-align:center;padding:40px;color:#65676b"><div style="font-size:28px">💬</div><p>No messages yet<br>Say hi to ${activeTargetUser.name}!</p></div>`; return; }
  msgs.forEach((msg,idx)=>{
    const isMe=msg.senderId===currentUser.uid;
    const isLast=idx===msgs.length-1;
    const wrapper=document.createElement("div");
    wrapper.className=`message-wrapper ${isMe?"outgoing":"incoming"}`;
    wrapper.id=`msg-container-${msg.id}`;
    const time=msg.createdAt?.toDate? new Date(msg.createdAt.toDate()).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"now";

    // CALL LOG STYLE
    if(msg.type==="call_log"){
      const isMissed=msg.callStatus==="missed"||msg.callStatus==="declined";
      const icon=msg.callType==="video"?"📹":"📞";
      const bg=isMissed?"#ffe4e6":"#e0f2fe";
      const color=isMissed?"#e11d48":"#0284c7";
      wrapper.innerHTML=`<div style="align-self:center;background:${bg};color:${color};padding:8px 14px;border-radius:16px;font-size:0.82rem;display:flex;align-items:center;gap:8px;margin:8px 0;border:1px solid ${isMissed?"#fecdd3":"#bae6fd"}"><span style="font-size:16px">${icon}</span><div><div style="font-weight:600">${msg.text}</div><div style="font-size:0.7rem;opacity:0.8">${time} • ${msg.callDuration||""}</div></div><button style="margin-left:8px;background:${color};color:white;border:none;padding:4px 10px;border-radius:12px;font-size:0.75rem;cursor:pointer" onclick="document.getElementById('video-call-btn')?.click()">Call back</button></div>`;
      messagesContainer.appendChild(wrapper);
      return;
    }

    let quotedHTML=msg.replyTo?`<div class="quoted-reply-box" id="quoted-box-${msg.id}"><span class="quoted-sender">${escapeHTML(msg.replyTo.senderName)}</span><p class="quoted-text">${escapeHTML(msg.replyTo.text)}</p></div>`:"";
    let photoHTML=msg.imageUrl?`<img src="${msg.imageUrl}" alt="Photo" class="message-img" id="msg-img-${msg.id}" />`:"";
    let textHTML=msg.text?`<div>${escapeHTML(msg.text)}</div>`:"";

    // DELIVERED / SEEN LOGIC BOSS
    let statusHTML="";
    if(isMe){
      if(isLast){
        if(msg.isRead){ statusHTML=`<span class="seen-status read" style="color:#0084ff;font-weight:600;font-size:0.7rem">✓✓ Seen</span>`; }
        else if(msg.isDelivered){ statusHTML=`<span class="seen-status" style="font-size:0.7rem">✓✓ Delivered</span>`; }
        else{ statusHTML=`<span class="seen-status" style="font-size:0.7rem">✓ Sent</span>`; }
      }else{
        // Older messages show double check
        statusHTML=msg.isRead?`<span style="font-size:0.65rem;opacity:0.6">✓✓</span>`:`<span style="font-size:0.65rem;opacity:0.6">✓</span>`;
      }
    }

    wrapper.innerHTML=`<div class="message-row"><div class="message-bubble" style="background:${isMe?"#0084ff":"white"};color:${isMe?"white":"#050505"};padding:10px 12px;border-radius:18px;border-bottom-${isMe?"right":"left"}-radius:4px;max-width:100%;box-shadow:${isMe?"none":"0 1px 1px rgba(0,0,0,0.08)"}">${quotedHTML}${photoHTML}${textHTML}<div class="message-meta-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px"><span class="message-time" style="font-size:0.62rem;opacity:0.7">${time}</span>${statusHTML}</div></div><div class="message-actions"><button class="reply-action-btn" id="reply-btn-${msg.id}">↩️</button></div></div>`;
    wrapper.querySelector(`#reply-btn-${msg.id}`).addEventListener("click",()=>startReply(msg));
    if(msg.replyTo?.messageId){ wrapper.querySelector(`#quoted-box-${msg.id}`)?.addEventListener("click",()=>{ const t=document.getElementById(`msg-container-${msg.replyTo.messageId}`); if(t){ t.scrollIntoView({behavior:"smooth",block:"center"}); t.style.backgroundColor="rgba(0,132,255,0.15)"; setTimeout(()=>t.style.backgroundColor="transparent",1500); } }); }
    if(msg.imageUrl) wrapper.querySelector(`#msg-img-${msg.id}`)?.addEventListener("click",()=>openLightbox(msg.imageUrl));
    messagesContainer.appendChild(wrapper);
  });
  messagesContainer.scrollTop=messagesContainer.scrollHeight;
  // AUTO DELIVERED after render
  setTimeout(()=>{ markAsDelivered(); },500);
}
async function markAsDelivered(){
  if(!currentUser||!activeTargetUser) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const q=query(collection(db,"chats",chatId,"messages"),where("receiverId","==",currentUser.uid),where("isDelivered","==",false));
  try{ const snap=await getDocs(q); snap.forEach(d=>{ updateDoc(doc(db,"chats",chatId,"messages",d.id),{isDelivered:true}); }); }catch(e){}
}
sendBtn.addEventListener("click",sendMessage); messageInput.addEventListener("keydown",(e)=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(); }});
async function sendMessage(){
  const text=messageInput.value.trim(); const img=selectedImageData;
  if((!text&&!img)||!activeTargetUser) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const reply=activeReplyTarget?{...activeReplyTarget}:null;
  messageInput.value=""; clearImageAttachment(); cancelReply(); setTypingState(false);
  const preview=img?(text?`📷 ${text}`:"📷 Photo"):text;
  await addDoc(collection(db,"chats",chatId,"messages"),{senderId:currentUser.uid,receiverId:activeTargetUser.uid,text:text||"",imageUrl:img||null,replyTo:reply,isRead:false,isDelivered:false,createdAt:serverTimestamp()});
  await setDoc(doc(db,"users",currentUser.uid,"conversations",activeTargetUser.uid),{targetUid:activeTargetUser.uid,targetName:activeTargetUser.name,targetEmail:activeTargetUser.email||"",lastMessageText:preview,lastMessageTime:serverTimestamp()});
  await setDoc(doc(db,"users",activeTargetUser.uid,"conversations",currentUser.uid),{targetUid:currentUser.uid,targetName:currentUser.displayName||"User",targetEmail:currentUser.email||"",lastMessageText:preview,lastMessageTime:serverTimestamp()});
}

// ==========================================================================
// CALL LOG + VIDEO CALL SYSTEM - FIXED NULL + NEW FEATURES ⭐⭐⭐
// ==========================================================================
function formatCallDuration(seconds){
  if(seconds<60) return `${seconds}s`;
  const m=Math.floor(seconds/60); const s=seconds%60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

// ADD CALL LOG TO CHAT LIKE MESSENGER BOSS
async function addCallLogToChat(targetUid, type, status, durationSec=0){
  if(!currentUser||!targetUid) return;
  const chatId=getChatId(currentUser.uid,targetUid);
  const durationText=durationSec>0? formatCallDuration(durationSec) : "";
  let text="";
  if(status==="missed") text=`${type==="video"?"📹 You missed a video call":"📞 You missed a voice call"}`;
  else if(status==="declined") text=`${type==="video"?"📹 Video call declined":"📞 Voice call declined"}`;
  else if(status==="ended") text=`${type==="video"?"📹 Video call ended":"📞 Voice call ended"}`;
  else text=`${type==="video"?"📹 Video call":"📞 Voice call"}`;

  // Save for both users
  const logData={
    senderId: currentUser.uid,
    receiverId: targetUid,
    type: "call_log",
    callType: type,
    callStatus: status,
    callDuration: durationText,
    text: text,
    isRead: true,
    isDelivered: true,
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db,"chats",chatId,"messages"), logData);

  // Update conversation preview
  await setDoc(doc(db,"users",currentUser.uid,"conversations",targetUid),{
    targetUid: targetUid,
    targetName: activeTargetUser?.name||targetUid,
    targetEmail: activeTargetUser?.email||"",
    lastMessageText: `${type==="video"?"📹":"📞"} ${status==="missed"?"Missed call":status==="declined"?"Call declined":`Call ended • ${durationText}`}`,
    lastMessageTime: serverTimestamp()
  },{merge:true});

  await setDoc(doc(db,"users",targetUid,"conversations",currentUser.uid),{
    targetUid: currentUser.uid,
    targetName: currentUser.displayName||"User",
    targetEmail: currentUser.email||"",
    lastMessageText: `${type==="video"?"📹":"📞"} ${status==="missed"?"Missed call":status==="declined"?"Call declined":`Call ended • ${durationText}`}`,
    lastMessageTime: serverTimestamp()
  },{merge:true});
}

async function startCall(type){
  if(!activeTargetUser) return alert("Pumili ka muna ng ka-chat boss!");
  if(pc) return alert("May call ka pa boss - end muna!");
  callType=type; isCaller=true;
  currentCallId=doc(collection(db,"calls")).id;
  const callDoc=doc(db,"calls",currentCallId);
  callStartTime=null;
  try{
    await setDoc(callDoc,{callerId:currentUser.uid,callerName:currentUser.displayName||currentUser.email.split('@')[0],receiverId:activeTargetUser.uid,receiverName:activeTargetUser.name,type:type,status:"ringing",createdAt:serverTimestamp()});
    await createPeerConnection(callDoc,type);
    const offer=await pc.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:type==='video'});
    await pc.setLocalDescription(offer);
    const finalOffer=pc.localDescription;
    await updateDoc(callDoc,{offer:{type:finalOffer.type,sdp:finalOffer.sdp}});
    videoCallModal.classList.remove("hidden"); callStatus.style.display="block"; callStatus.textContent=type==='video'?`Calling ${activeTargetUser.name}... 📹`:`Calling ${activeTargetUser.name}... 📞`;
    if(type==='voice') localVideo.classList.add("hidden"); else localVideo.classList.remove("hidden");

    onSnapshot(callDoc, async(snap)=>{
      const data=snap.data(); if(!data) return;
      if(data.answer&&pc&&!pc.currentRemoteDescription){
        try{
          const validAnswer={type:(data.answer.type&&data.answer.type!=='null')?data.answer.type:'answer',sdp:data.answer.sdp};
          await pc.setRemoteDescription(new RTCSessionDescription(validAnswer));
          callStartTime=Date.now();
          startDurationTimer();
          callStatus.textContent="Connected ✅";
          setTimeout(()=>{ callStatus.style.display="none"; },2000);
        }catch(e){ console.error(e); }
      }
      if(data.status==="ended"||data.status==="declined"){
        const duration=callStartTime? Math.floor((Date.now()-callStartTime)/1000):0;
        const status=data.status==="declined"?"declined":"ended";
        if(isCaller){
          // Only caller adds log for declined/missed to avoid duplicate
          if(status==="declined"&&!callStartTime){
            await addCallLogToChat(activeTargetUser.uid, type, "declined", 0);
          }else if(callStartTime){
            await addCallLogToChat(activeTargetUser.uid, type, "ended", duration);
          }
        }
        endCallCleanup();
      }
    });
    onSnapshot(collection(callDoc,"answerCandidates"),(snap)=>{ snap.docChanges().forEach(c=>{ if(c.type==="added"&&pc){ try{ pc.addIceCandidate(new RTCIceCandidate(c.doc.data())); }catch(e){} } }); });
  }catch(err){ console.error(err); alert("Call failed: "+err.message); endCallCleanup(); }
}

function startDurationTimer(){
  if(callDurationInterval) clearInterval(callDurationInterval);
  callDurationInterval=setInterval(()=>{
    if(callStartTime){
      const sec=Math.floor((Date.now()-callStartTime)/1000);
      if(callStatus.style.display!=="none"){
        callStatus.textContent=`Connected • ${formatCallDuration(sec)}`;
      }else{
        // Show small timer on top
        callStatus.style.display="block";
        callStatus.textContent=`${formatCallDuration(sec)}`;
        callStatus.style.fontSize="0.9rem";
        callStatus.style.background="rgba(0,0,0,0.6)";
      }
    }
  },1000);
}

async function createPeerConnection(callDoc,type){
  pc=new RTCPeerConnection(servers);
  const constraints=type==='video'?{video:true,audio:true}:{video:false,audio:true};
  localStream=await navigator.mediaDevices.getUserMedia(constraints);
  localVideo.srcObject=localStream; remoteStream=new MediaStream(); remoteVideo.srcObject=remoteStream;
  localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));
  pc.ontrack=(e)=>{ e.streams[0].getTracks().forEach(t=>remoteStream.addTrack(t)); };
  pc.onicecandidate=(e)=>{ if(e.candidate){ const col=collection(callDoc,isCaller?"offerCandidates":"answerCandidates"); addDoc(col,e.candidate.toJSON()); } };
  pc.onconnectionstatechange=()=>{ if(pc.connectionState==="failed"||pc.connectionState==="disconnected"){ setTimeout(()=>{ if(pc&&pc.connectionState!=="connected") endCallCleanup(); },3000); } };
}

function listenForIncomingCalls(){
  if(unsubscribeIncomingCall) unsubscribeIncomingCall();
  const q=query(collection(db,"calls"),where("receiverId","==",currentUser.uid),where("status","==","ringing"));
  unsubscribeIncomingCall=onSnapshot(q,(snap)=>{
    snap.docChanges().forEach(change=>{
      if(change.type==="added"){
        const data=change.doc.data(); const id=change.doc.id;
        if(currentCallId) return;
        const age=data.createdAt? (Date.now()-data.createdAt.toDate().getTime())/1000:0; if(age>60) return;
        incomingCallData={id,...data};
        incomingName.textContent=`${data.callerName} is calling...`;
        incomingInitials.textContent=data.callerName.charAt(0).toUpperCase();
        incomingTypeEl.textContent=data.type==="video"?"Incoming video call 📹":"Incoming voice call 📞";
        incomingPopup.classList.remove("hidden");
        if(navigator.vibrate) navigator.vibrate([500,300,500]);
        // Auto missed after 30s
        setTimeout(async()=>{
          if(incomingCallData?.id===id && document.querySelector("#incoming-call-popup:not(.hidden)")){
            // Missed call log
            await addCallLogToChat(data.callerId, data.type, "missed", 0);
            incomingPopup.classList.add("hidden");
            const callDoc=doc(db,"calls",id);
            try{ await updateDoc(callDoc,{status:"ended"}); setTimeout(async()=>{ try{ await deleteDoc(callDoc); }catch(e){} },2000); }catch(e){}
            incomingCallData=null;
          }
        },30000);
      }
      if(change.type==="removed"||change.doc.data().status!=="ringing"){
        if(incomingCallData?.id===change.doc.id){ incomingPopup.classList.add("hidden"); incomingCallData=null; }
      }
    });
  });
}

async function acceptIncomingCall(){
  if(!incomingCallData) return;
  const callDoc=doc(db,"calls",incomingCallData.id);
  currentCallId=incomingCallData.id; callType=incomingCallData.type; isCaller=false; callStartTime=Date.now();
  try{
    await createPeerConnection(callDoc,callType);
    let offer=incomingCallData.offer;
    if(!offer||!offer.sdp){ const fresh=await getDoc(callDoc); offer=fresh.data()?.offer; }
    if(!offer||!offer.sdp) throw new Error("Offer missing");
    const validOffer={type:(offer.type&&offer.type!=='null'&&offer.type!==null)?offer.type:'offer',sdp:offer.sdp};
    await pc.setRemoteDescription(new RTCSessionDescription(validOffer));
    const answer=await pc.createAnswer(); await pc.setLocalDescription(answer);
    await updateDoc(callDoc,{answer:{type:answer.type,sdp:answer.sdp},status:"connected"});
    videoCallModal.classList.remove("hidden"); incomingPopup.classList.add("hidden");
    callStatus.style.display="block"; callStatus.textContent="Connected ✅";
    if(callType==='voice') localVideo.classList.add("hidden"); else localVideo.classList.remove("hidden");
    startDurationTimer();
    setTimeout(()=>callStatus.style.display="none",2000);
    onSnapshot(collection(callDoc,"offerCandidates"),(s)=>{ s.docChanges().forEach(c=>{ if(c.type==="added"&&pc){ try{ pc.addIceCandidate(new RTCIceCandidate(c.doc.data())); }catch(e){} } }); });
    onSnapshot(callDoc,(s)=>{ if(s.data()?.status==="ended"){ const dur=callStartTime? Math.floor((Date.now()-callStartTime)/1000):0; addCallLogToChat(incomingCallData.callerId, callType, "ended", dur); endCallCleanup(); } });
  }catch(err){ console.error(err); alert("Accept failed: "+err.message); endCallCleanup(); }
}

async function declineIncomingCall(){
  if(!incomingCallData) return;
  const callerId=incomingCallData.callerId;
  const type=incomingCallData.type;
  const callDoc=doc(db,"calls",incomingCallData.id);
  await updateDoc(callDoc,{status:"declined"});
  await addCallLogToChat(callerId, type, "declined", 0);
  setTimeout(async()=>{ try{ await deleteDoc(callDoc); }catch(e){} },2000);
  incomingPopup.classList.add("hidden"); incomingCallData=null;
}

async function endCallCleanup(){
  if(callDurationInterval) clearInterval(callDurationInterval);
  callDurationInterval=null;
  if(pc){ pc.close(); pc=null; }
  if(localStream){ localStream.getTracks().forEach(t=>t.stop()); localStream=null; }
  remoteStream=null;
  if(remoteVideo) remoteVideo.srcObject=null;
  if(localVideo) localVideo.srcObject=null;
  videoCallModal.classList.add("hidden");
  callStatus.style.display="block"; callStatus.textContent="Call ended";
  callStatus.style.fontSize=""; callStatus.style.background="";
  if(currentCallId){
    const callDoc=doc(db,"calls",currentCallId);
    try{ await updateDoc(callDoc,{status:"ended"}); setTimeout(async()=>{ try{ await deleteDoc(callDoc); }catch(e){} },3000); }catch(e){}
  }
  currentCallId=null; isCaller=false; incomingPopup.classList.add("hidden"); callStartTime=null;
}

async function endCall(status='ended'){
  const duration=callStartTime? Math.floor((Date.now()-callStartTime)/1000):0;
  const targetUid=isCaller? activeTargetUser?.uid : incomingCallData?.callerId;
  const type=callType;
  // Add log if connected before
  if(callStartTime && targetUid){
    await addCallLogToChat(targetUid, type, "ended", duration);
  }else if(!callStartTime && isCaller && targetUid){
    // Caller ended before answer = cancelled
    await addCallLogToChat(targetUid, type, "declined", 0);
  }
  await endCallCleanup();
}

// BUTTONS
videoCallBtn?.addEventListener("click",()=>startCall('video'));
voiceCallBtn?.addEventListener("click",()=>startCall('voice'));
acceptCallBtn?.addEventListener("click",acceptIncomingCall);
declineCallBtn?.addEventListener("click",declineIncomingCall);
endCallBtn?.addEventListener("click",()=>endCall('ended'));
muteBtn?.addEventListener("click",()=>{ if(!localStream) return; const a=localStream.getAudioTracks()[0]; if(a){ a.enabled=!a.enabled; muteBtn.classList.toggle("muted",!a.enabled); muteBtn.innerHTML=a.enabled?'🎤':'🔇'; } });
cameraBtn?.addEventListener("click",()=>{ if(!localStream) return; const v=localStream.getVideoTracks()[0]; if(v){ v.enabled=!v.enabled; cameraBtn.classList.toggle("muted",!v.enabled); cameraBtn.innerHTML=v.enabled?'📹':'🚫'; } });
screenBtn?.addEventListener("click",async()=>{
  if(!localStream||!pc) return;
  try{
    const scr=await navigator.mediaDevices.getDisplayMedia({video:true});
    const track=scr.getVideoTracks()[0];
    const sender=pc.getSenders().find(s=>s.track&&s.track.kind==='video');
    if(sender) sender.replaceTrack(track);
    localVideo.srcObject=scr;
    track.onended=async()=>{
      const cam=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
      const camTrack=cam.getVideoTracks()[0]; const audioTrack=cam.getAudioTracks()[0];
      if(sender) sender.replaceTrack(camTrack);
      const audSender=pc.getSenders().find(s=>s.track&&s.track.kind==='audio');
      if(audSender&&audioTrack) audSender.replaceTrack(audioTrack);
      localVideo.srcObject=cam; localStream=cam;
    };
  }catch(e){}
});

themeToggleBtn?.addEventListener("click",()=>{ const d=document.body.getAttribute("data-theme")==="dark"; document.body.setAttribute("data-theme",d?"light":"dark"); });
mobileBackBtn?.addEventListener("click",()=>{ if(activeTargetUser) setTypingState(false); chatArea.classList.remove("active-mobile"); });
function formatShortTime(date){ const now=new Date(); if(date.toDateString()===now.toDateString()) return date.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); return date.toLocaleDateString([],{month:"short",day:"numeric"}); }
function escapeHTML(s){ return s? s.replace(/[&<>'"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[t]||t)):""; }

console.log("Messenger V10 Loaded - Call Log + Delivered/Seen + Typing boss! 🔥");
