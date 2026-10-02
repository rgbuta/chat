// MESSENGER V18.9 FINAL - COMPACT + PANTAY RIGHT + 1 LINE BOSS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyCemGkC9X-qGXP85yfOHWAaA_U8I8svYu0",
  authDomain: "myprofile1124.firebaseapp.com",
  projectId: "myprofile1124",
  storageBucket: "myprofile1124.firebasestorage.app",
  messagingSenderId: "317629844028",
  appId: "1:317629844028:web:98eae3b815e89012e7d139",
  measurementId: "G-KJPRC6R3R0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

let currentUser = null;
let userContacts = [];
let allUsersCache = [];
let activeTargetUser = null;
let directMessagesUnsub = null;
let unsubscribeConversations = null;
let unsubscribeContacts = null;
let unsubscribeTyping = null;
let unsubscribeIncomingCall = null;
let unsubscribeUserStatus = null;
let unreadListeners = {};
let selectedImageData = null;
let replyToMessage = null;
let isSignUpMode = false;
let typingTimeout = null;

const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authToggleText = document.getElementById("auth-toggle-text");
const nameGroup = document.getElementById("name-group");
const authNameInput = document.getElementById("auth-name");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const currentUserName = document.getElementById("current-user-name");
const currentUserEmail = document.getElementById("current-user-email");
const userInitials = document.getElementById("user-initials");
const logoutBtn = document.getElementById("logout-btn");
const addUserBtn = document.getElementById("add-user-btn");
const startAddUserBtn = document.getElementById("start-add-user-btn");
const addUserModal = document.getElementById("add-user-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalUserSearch = document.getElementById("modal-user-search");
const modalUsersList = document.getElementById("modal-users-list");
const userSearch = document.getElementById("user-search");
const chatsList = document.getElementById("chats-list");
const tabChatsBtn = document.getElementById("tab-chats-btn");
const tabContactsBtn = document.getElementById("tab-contacts-btn");
const contactsCountEl = document.getElementById("contacts-count");
const chatArea = document.getElementById("chat-area");
const emptyState = document.getElementById("empty-state");
const activeChatWrapper = document.getElementById("active-chat-wrapper");
const activeChatTitle = document.getElementById("active-chat-title");
const chatInitials = document.getElementById("chat-initials");
const messagesContainer = document.getElementById("messages-container");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const mobileBackBtn = document.getElementById("mobile-back-btn");
const photoMenuBtn = document.getElementById("photo-menu-btn");
const photoOptionMenu = document.getElementById("photo-option-menu");
const openCameraBtn = document.getElementById("open-camera-btn");
const openGalleryBtn = document.getElementById("open-gallery-btn");
const cameraFileInput = document.getElementById("camera-file-input");
const imageFileInput = document.getElementById("image-file-input");
const imagePreviewBar = document.getElementById("image-preview-bar");
const imagePreviewImg = document.getElementById("image-preview-img");
const removeImageBtn = document.getElementById("remove-image-btn");
const replyBanner = document.getElementById("reply-banner");
const replySenderName = document.getElementById("reply-sender-name");
const replyPreviewText = document.getElementById("reply-preview-text");
const cancelReplyBtn = document.getElementById("cancel-reply-btn");
const typingIndicatorBar = document.getElementById("typing-indicator-bar");
const typingUserText = document.getElementById("typing-user-text");
const chatOnlineDot = document.getElementById("chat-online-dot");
const activeChatStatusText = document.getElementById("active-chat-status-text");
const typingDotsMini = document.getElementById("typing-dots-mini");
const voiceCallBtn = document.getElementById("voice-call-btn");
const videoCallBtn = document.getElementById("video-call-btn");
const videoCallModal = document.getElementById("video-call-modal");
const remoteVideo = document.getElementById("remoteVideo");
const localVideo = document.getElementById("localVideo");
const localVideoWrapper = document.getElementById("localVideoWrapper");
const callStatus = document.getElementById("call-status");
const muteBtn = document.getElementById("mute-btn");
const cameraBtn = document.getElementById("camera-btn");
const screenBtn = document.getElementById("screen-btn");
const endCallBtn = document.getElementById("end-call-btn");
const incomingCallPopup = document.getElementById("incoming-call-popup");
const incomingName = document.getElementById("incoming-name");
const incomingType = document.getElementById("incoming-type");
const incomingInitials = document.getElementById("incoming-initials");
const acceptCallBtn = document.getElementById("accept-call-btn");
const declineCallBtn = document.getElementById("decline-call-btn");
const ringtoneAudio = document.getElementById("ringtone-audio");
const lightboxModal = document.getElementById("lightbox-modal");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCloseBtn = document.getElementById("lightbox-close-btn");
const lightboxDownloadBtn = document.getElementById("lightbox-download-btn");
const reactionPicker = document.getElementById("reaction-picker");
const messageOptionsMenu = document.getElementById("message-options-menu");
const optReactBtn = document.getElementById("opt-react-btn");
const optReplyBtn = document.getElementById("opt-reply-btn");
const optEditBtn = document.getElementById("opt-edit-btn");
const optUnsendBtn = document.getElementById("opt-unsend-btn");
const optDeleteBtn = document.getElementById("opt-delete-btn");
const editMessageModal = document.getElementById("edit-message-modal");
const editMessageInput = document.getElementById("edit-message-input");
const cancelEditMsgBtn = document.getElementById("cancel-edit-msg-btn");
const saveEditMsgBtn = document.getElementById("save-edit-msg-btn");
const editNameBtn = document.getElementById("edit-name-btn");
const editNameModal = document.getElementById("edit-name-modal");
const editNameInput = document.getElementById("edit-name-input");
const closeEditNameBtn = document.getElementById("close-edit-name-btn");
const cancelEditNameBtn = document.getElementById("cancel-edit-name-btn");
const saveNameBtn = document.getElementById("save-name-btn");

function getChatId(a,b){ return [a,b].sort().join("_"); }
function escapeHTML(s){ const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
function resetToBlankState(){
  activeTargetUser=null; activeChatWrapper.classList.add("hidden"); emptyState.classList.remove("hidden");
  chatArea.classList.remove("active-mobile"); messagesContainer.innerHTML=""; clearImageAttachment(); cancelReply();
  if(directMessagesUnsub) directMessagesUnsub(); if(unsubscribeTyping) unsubscribeTyping(); if(unsubscribeUserStatus) unsubscribeUserStatus();
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const vh = window.visualViewport.height;
    document.documentElement.style.height = vh + 'px';
    document.body.style.height = vh + 'px';
    setTimeout(()=>{ messagesContainer.scrollTop = messagesContainer.scrollHeight; },150);
  });
}
messageInput?.addEventListener('focus', ()=>{ setTimeout(()=>{ messagesContainer.scrollTop = messagesContainer.scrollHeight; },300); });

function switchToSignUpMode(){ isSignUpMode=true; authTitle.textContent="Create Account"; authSubtitle.textContent="Join Messenger"; authSubmitBtn.textContent="Sign Up"; authToggleText.innerHTML=`Already have an account? <a href="#" id="auth-toggle-btn">Sign In</a>`; nameGroup.classList.remove("hidden"); authNameInput.required=true; attachToggle(); }
function switchToSignInMode(){ isSignUpMode=false; authTitle.textContent="Welcome Back"; authSubtitle.textContent="Sign in to start messaging"; authSubmitBtn.textContent="Sign In"; authToggleText.innerHTML=`Don't have an account? <a href="#" id="auth-toggle-btn">Sign Up</a>`; nameGroup.classList.add("hidden"); authNameInput.required=false; attachToggle(); }
function attachToggle(){ const b=document.getElementById("auth-toggle-btn"); if(b) b.addEventListener("click",(e)=>{ e.preventDefault(); isSignUpMode?switchToSignInMode():switchToSignUpMode(); }); }
attachToggle();
function clearAuthInputs(){ authEmailInput.value=""; authPasswordInput.value=""; authNameInput.value=""; }

authForm.addEventListener("submit", async(e)=>{
  e.preventDefault();
  const email=authEmailInput.value.trim(); const pass=authPasswordInput.value.trim();
  if(!email||!pass) return;
  authSubmitBtn.disabled=true; authSubmitBtn.textContent=isSignUpMode?"Creating...":"Signing in...";
  try{
    if(isSignUpMode){
      const name=authNameInput.value.trim(); if(!name){ alert("Enter name boss!"); throw new Error("name required"); }
      const cred=await createUserWithEmailAndPassword(auth,email,pass);
      await updateProfile(cred.user,{displayName:name});
      await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,name,email,photoURL:"",createdAt:serverTimestamp(),isOnline:true,lastSeen:serverTimestamp()});
    }else{
      await signInWithEmailAndPassword(auth,email,pass);
    }
  }catch(err){ alert(err.message); }
  finally{ authSubmitBtn.disabled=false; authSubmitBtn.textContent=isSignUpMode?"Sign Up":"Sign In"; }
});

async function enableNotifications(){
  try{
    const permission=await Notification.requestPermission();
    if(permission!=="granted") return null;
    const registration=await navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(()=>null);
    const token=await getToken(messaging,{ vapidKey: "BJv1o6WbBqNxMEC6O41Dz2teCNu8U1j3HMZgongBqDjlz-XqOZmZ6taekNdAxOlfUmY0rJnXnjv63179kIBB-5A", serviceWorkerRegistration: registration||undefined });
    if(token && currentUser){
      await setDoc(doc(db,"users",currentUser.uid),{fcmToken:token,lastTokenUpdate:serverTimestamp()},{merge:true});
      return token;
    }
  }catch(err){ console.error(err); }
  return null;
}
onMessage(messaging,(payload)=>{
  const {title,body}=payload.notification||{};
  if(Notification.permission==="granted" && title){
    new Notification(title,{body, icon:"https://cdn-icons-png.flaticon.com/512/733/733585.png"});
  }
  if(navigator.vibrate) navigator.vibrate([200,100,200]);
});

async function setOnlineStatus(isOnline){
  if(!currentUser) return;
  try{ await setDoc(doc(db,"users",currentUser.uid),{isOnline,lastSeen:serverTimestamp(),uid:currentUser.uid},{merge:true}); }catch(e){}
}
function listenToUserOnlineStatus(targetUid){
  if(unsubscribeUserStatus) unsubscribeUserStatus();
  const ref=doc(db,"users",targetUid);
  unsubscribeUserStatus=onSnapshot(ref,(snap)=>{
    if(!snap.exists()) return;
    const data=snap.data(); const isOnline=data.isOnline===true;
    if(chatOnlineDot){
      if(isOnline){ chatOnlineDot.classList.remove("hidden"); chatOnlineDot.classList.add("online-dot-pulse"); }
      else{ chatOnlineDot.classList.add("hidden"); chatOnlineDot.classList.remove("online-dot-pulse"); }
    }
    if(activeChatStatusText){
      if(typingIndicatorBar &&!typingIndicatorBar.classList.contains("hidden")) return;
      if(isOnline){ activeChatStatusText.textContent="Active now"; activeChatStatusText.style.color="#31a24c"; }
      else{
        if(data.lastSeen?.toDate){
          const d=data.lastSeen.toDate(); const now=new Date(); const diffMins=Math.floor((now-d)/60000); const diffH=Math.floor(diffMins/60);
          if(diffMins<1) activeChatStatusText.textContent="Active 1m ago";
          else if(diffMins<60) activeChatStatusText.textContent=`Active ${diffMins}m ago`;
          else if(diffH<24) activeChatStatusText.textContent=`Active ${diffH}h ago`;
          else activeChatStatusText.textContent=`Active ${d.toLocaleDateString()}`;
        }else activeChatStatusText.textContent="Offline";
        activeChatStatusText.style.color="#65676b";
      }
    }
  });
}

async function fetchAllUsers(){
  const q=query(collection(db,"users"));
  const snap=await getDocs(q);
  allUsersCache=snap.docs.map(d=>d.data()).filter(u=>u.uid!==currentUser?.uid);
}
function listenToContacts(){
  if(!currentUser) return;
  const ref=collection(db,"users",currentUser.uid,"contacts");
  unsubscribeContacts=onSnapshot(ref,(snap)=>{
    userContacts=snap.docs.map(d=>({id:d.id,...d.data()}));
    contactsCountEl.textContent=userContacts.length;
    renderChatsList(); updateContactsOnlineDots();
  });
}
function listenToActiveConversations(){
  if(!currentUser) return;
  const ref=collection(db,"users",currentUser.uid,"conversations");
  unsubscribeConversations=onSnapshot(query(ref,orderBy("lastMessageTime","desc")),(snap)=>{
    const conversations={}; snap.docs.forEach(d=>{ conversations[d.id]=d.data(); });
    window._conversations=conversations; renderChatsList(); listenToAllUnread(conversations);
  });
}
function listenToAllUnread(convs){
  Object.values(unreadListeners).forEach(u=>u()); unreadListeners={};
  Object.keys(convs).forEach(targetUid=>{
    const chatId=getChatId(currentUser.uid,targetUid);
    const ref=collection(db,"chats",chatId,"messages");
    const qy=query(ref,where("receiverId","==",currentUser.uid),where("isRead","==",false));
    unreadListeners[targetUid]=onSnapshot(qy,(snap)=>{
      const el=document.getElementById(`unread-${targetUid}`);
      if(el){
        if(snap.size>0){ el.textContent=snap.size>9?"9+":snap.size; el.classList.remove("hidden"); }
        else el.classList.add("hidden");
      }
    });
  });
}
function updateContactsOnlineDots(){
  userContacts.forEach(contact=>{
    const ref=doc(db,"users",contact.uid);
    onSnapshot(ref,(snap)=>{
      if(!snap.exists()) return;
      const data=snap.data(); const item=document.getElementById(`user-item-${contact.uid}`);
      if(item){
        let dot=item.querySelector(".contact-online-dot");
        if(!dot){
          const avatar=item.querySelector(".avatar-container");
          if(avatar){
            dot=document.createElement("span"); dot.className="contact-online-dot";
            dot.style.cssText="position:absolute;bottom:0;right:0;width:10px;height:10px;background:#31a24c;border:2px solid white;border-radius:50%";
            avatar.style.position="relative"; avatar.appendChild(dot);
          }
        }
        if(dot) dot.style.display=data.isOnline?"block":"none";
      }
    });
  });
}
function renderChatsList(){
  const searchTerm=(userSearch.value||"").toLowerCase();
  const tabActive=tabChatsBtn.classList.contains("active")?"chats":"contacts";
  let list=[];
  if(tabActive==="chats"){
    const convs=window._conversations||{};
    list=Object.entries(convs).map(([uid,data])=>{
      const contact=userContacts.find(c=>c.uid===uid) || allUsersCache.find(u=>u.uid===uid) || {uid, name:data.name||uid, email:""};
      return {...contact, lastMessageText:data.lastMessageText||"", lastMessageTime:data.lastMessageTime};
    });
  }else{ list=[...userContacts]; }
  if(searchTerm){ list=list.filter(u=> (u.name||"").toLowerCase().includes(searchTerm) || (u.email||"").toLowerCase().includes(searchTerm) || (u.lastMessageText||"").toLowerCase().includes(searchTerm)); }
  list.sort((a,b)=>{ const ta=a.lastMessageTime?.toDate? a.lastMessageTime.toDate().getTime():0; const tb=b.lastMessageTime?.toDate? b.lastMessageTime.toDate().getTime():0; return tb-ta; });
  chatsList.innerHTML="";
  if(list.length===0){ chatsList.innerHTML=`<div style="text-align:center;padding:32px;color:#65676b"><p>No ${tabActive} yet</p></div>`; return; }
  list.forEach(user=>{
    const div=document.createElement("div"); div.className="chat-item"; div.id=`user-item-${user.uid}`;
    if(activeTargetUser && activeTargetUser.uid===user.uid) div.classList.add("active");
    const time=user.lastMessageTime?.toDate? new Date(user.lastMessageTime.toDate()).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";
    const lastText=user.lastMessageText||user.email||"";
    div.innerHTML=`<div class="avatar-container" style="position:relative"><span>${(user.name||"U").charAt(0).toUpperCase()}</span></div><div class="chat-item-info"><div class="chat-item-name">${escapeHTML(user.name||"Unknown")}</div><div class="chat-item-preview">${escapeHTML(lastText.slice(0,40))}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="chat-item-time">${time}</span><span id="unread-${user.uid}" class="unread-badge hidden">0</span></div>`;
    div.addEventListener("click",()=>selectUserToChat(user)); chatsList.appendChild(div);
  });
}
tabChatsBtn.addEventListener("click",()=>{ tabChatsBtn.classList.add("active"); tabContactsBtn.classList.remove("active"); renderChatsList(); });
tabContactsBtn.addEventListener("click",()=>{ tabContactsBtn.classList.add("active"); tabChatsBtn.classList.remove("active"); renderChatsList(); });
userSearch.addEventListener("input",renderChatsList);

function openAddUserModal(){ addUserModal.classList.remove("hidden"); modalUserSearch.value=""; renderModalUsers(allUsersCache); modalUserSearch.focus(); }
function closeAddUserModal(){ addUserModal.classList.add("hidden"); }
addUserBtn.addEventListener("click",openAddUserModal);
startAddUserBtn?.addEventListener("click",openAddUserModal);
closeModalBtn.addEventListener("click",closeAddUserModal);
addUserModal.addEventListener("click",(e)=>{ if(e.target===addUserModal) closeAddUserModal(); });
modalUserSearch.addEventListener("input",()=>{
  const term=modalUserSearch.value.toLowerCase();
  const filtered=allUsersCache.filter(u=> (u.name||"").toLowerCase().includes(term) || (u.email||"").toLowerCase().includes(term));
  renderModalUsers(filtered);
});
function renderModalUsers(users){
  modalUsersList.innerHTML="";
  if(users.length===0){ modalUsersList.innerHTML=`<p style="text-align:center;color:#65676b;padding:20px">No users found</p>`; return; }
  users.forEach(u=>{
    const isAdded=userContacts.some(c=>c.uid===u.uid);
    const div=document.createElement("div"); div.style.cssText="display:flex;align-items:center;justify-content:space-between;padding:10px;border-radius:10px;margin-bottom:6px;background:#f9f9f9";
    div.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;background:#0084ff;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold">${(u.name||"U").charAt(0).toUpperCase()}</div><div><div style="font-weight:600;font-size:14px">${escapeHTML(u.name||"User")}</div><div style="font-size:12px;color:#65676b">${escapeHTML(u.email||"")}</div></div></div><button style="padding:6px 12px;border:none;border-radius:20px;cursor:pointer;font-weight:600;background:${isAdded?"#e4e6eb":"#0084ff"};color:${isAdded?"#050505":"white"}">${isAdded?"Added":"Add"}</button>`;
    const btn=div.querySelector("button");
    if(!isAdded){
      btn.addEventListener("click", async()=>{
        btn.disabled=true; btn.textContent="Adding...";
        await setDoc(doc(db,"users",currentUser.uid,"contacts",u.uid),{uid:u.uid,name:u.name,email:u.email,addedAt:serverTimestamp()});
        btn.textContent="Added"; btn.style.background="#e4e6eb"; btn.style.color="#050505";
      });
    }
    modalUsersList.appendChild(div);
  });
}

async function selectUserToChat(targetUser){
  if(activeTargetUser) setTypingState(false);
  activeTargetUser=targetUser;
  document.querySelectorAll(".chat-item").forEach(el=>el.classList.remove("active"));
  const cur=document.getElementById(`user-item-${targetUser.uid}`);
  if(cur) cur.classList.add("active");
  emptyState.classList.add("hidden"); activeChatWrapper.classList.remove("hidden"); chatArea.classList.add("active-mobile");
  activeChatTitle.textContent=targetUser.name; chatInitials.textContent=targetUser.name.charAt(0).toUpperCase();
  clearImageAttachment(); cancelReply(); listenToDirectMessages(); listenToTypingStatus(); listenToUserOnlineStatus(targetUser.uid); markMessagesAsRead(targetUser.uid);
}

function listenToDirectMessages(){
  if(directMessagesUnsub) directMessagesUnsub();
  if(!activeTargetUser||!currentUser) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const ref=collection(db,"chats",chatId,"messages");
  const qy=query(ref,orderBy("createdAt","asc"));
  directMessagesUnsub=onSnapshot(qy,(snap)=>{
    const msgs=snap.docs.map(d=>({id:d.id,...d.data()})); renderMessages(msgs);
  });
}

// ===== V18.9 FINAL RENDER - COMPACT + PANTAY RIGHT + HINDI TANGKAD! =====
function renderMessages(msgs){
  const filtered=msgs.filter(m=>!(m.deletedFor && m.deletedFor.includes(currentUser.uid)) );
  messagesContainer.innerHTML="";
  if(filtered.length===0){
    messagesContainer.innerHTML=`<div style="text-align:center;padding:40px;color:#65676b"><div style="font-size:28px">💬</div><p>No messages yet</p><p style="font-size:11px;margin-top:4px">Long press = ❤️ | Swipe right = ↩️ Reply</p></div>`;
    return;
  }
  filtered.forEach((msg,idx)=>{
    const isMe=msg.senderId===currentUser.uid;
    const isLast=idx===filtered.length-1;
    const isLastFromMe=isMe && filtered.slice(idx+1).every(m=>m.senderId!==currentUser.uid);
    const wrapper=document.createElement("div");
    wrapper.className=`message-wrapper ${isMe?"outgoing":"incoming"}`;
    wrapper.style.cssText=`display:flex;flex-direction:column;width:100%;align-items:${isMe?'flex-end':'flex-start'};margin:1px 0;`;
    const time=msg.createdAt?.toDate? new Date(msg.createdAt.toDate()).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"now";

    if(msg.type==="call_log"){
      const missed=msg.callStatus==="missed"||msg.callStatus==="declined";
      const bg=missed?"#ffe4e6":"#e0f2fe"; const col=missed?"#e11d48":"#0284c7";
      const icon=msg.callType==="video"?"📹":"📞";
      wrapper.innerHTML=`<div style="align-self:center;background:${bg};color:${col};padding:6px 12px;border-radius:16px;font-size:0.82rem;display:flex;gap:8px;margin:4px 0"><span>${icon}</span><div><div style="font-weight:600">${msg.text}</div><div style="font-size:0.7rem">${time}</div></div></div>`;
      messagesContainer.appendChild(wrapper); return;
    }
    if(msg.isDeleted){
      wrapper.innerHTML=`<div style="align-self:center;background:#f0f2f5;color:#65676b;padding:6px 12px;border-radius:16px;font-size:0.82rem;font-style:italic;border:1px dashed #ccc;margin:4px 0">🚫 ${isMe?'You unsent a message':'This message was unsent'}</div>`;
      messagesContainer.appendChild(wrapper); return;
    }

    let quotedHTML=msg.replyTo?`<div style="background:${isMe?"rgba(255,255,255,0.25)":"#f0f2f5"};border-left:3px solid ${isMe?"white":"#0084ff"};padding:4px 6px;border-radius:6px;margin-bottom:4px"><span style="font-size:0.68rem;font-weight:600">${escapeHTML(msg.replyTo.senderName)}</span><p style="font-size:0.75rem;margin:1px 0 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(msg.replyTo.text)}</p></div>`:"";
    let photoHTML=msg.imageUrl?`<img src="${msg.imageUrl}" id="img-${msg.id}" style="max-width:200px;border-radius:10px;display:block;margin-bottom:4px" />`:"";
    let textHTML=msg.text?`<div style="font-size:15px;line-height:1.25;white-space:pre-wrap;word-break:break-word;display:inline;">${escapeHTML(msg.text)} ${msg.isEdited?'<span style="font-size:10px;opacity:0.6">(Edited)</span>':''}</div>`:"";
    let reactionsHTML="";
    if(msg.reactions && Object.keys(msg.reactions).length>0){
      const counts={}; Object.values(msg.reactions).forEach(e=>{ counts[e]=(counts[e]||0)+1; });
      const icons=Object.entries(counts).map(([emoji,count])=>`${emoji}${count>1?`<span style="font-size:10px">${count}</span>`:''}`).join(" ");
      reactionsHTML=`<div class="message-reactions">${icons}</div>`;
    }
    let statusHTML="";
    if(isMe && isLastFromMe){
      if(msg.isRead) statusHTML=`<span style="color:#0084ff;font-size:11px;font-weight:600">Seen</span>`;
      else if(msg.isDelivered) statusHTML=`<span style="font-size:11px;color:#65676b">Delivered ✓✓</span>`;
      else statusHTML=`<span style="font-size:11px;color:#65676b">Sent ✓</span>`;
    }

    wrapper.innerHTML=`
      <div class="message-row" id="row-${msg.id}" style="display:block;width:fit-content;max-width:68%;position:relative;">
        <div class="message-bubble" id="bubble-${msg.id}" style="background:${isMe?"#0084ff":"white"};color:${isMe?"white":"#050505"};padding:7px 11px 5px 11px;border-radius:18px;border-bottom-right-radius:${isMe?'4px':'18px'};border-bottom-left-radius:${isMe?'18px':'4px'};display:inline-block;width:fit-content;max-width:100%;height:auto;min-height:0;position:relative;word-wrap:break-word;box-shadow:0 1px 1px rgba(0,0,0,0.08);border:${isMe?'none':'1px solid #e4e6eb'};">
          ${quotedHTML}${photoHTML}${textHTML}
          <div style="font-size:10px;opacity:0.6;margin-top:2px;text-align:right;line-height:1;">${time}</div>
          ${reactionsHTML}
        </div>
      </div>
      ${isMe && isLastFromMe? `<div style="text-align:right;margin-top:2px;margin-right:2px">${statusHTML}</div>`:''}
    `;

    const bubble=wrapper.querySelector(`#bubble-${msg.id}`);
    const row=wrapper.querySelector(`#row-${msg.id}`);
    let pressTimer=null;
    let startX=0, startY=0, isSwipe=false;

    bubble.addEventListener("touchstart",(e)=>{
      startX=e.touches[0].clientX; startY=e.touches[0].clientY; isSwipe=false;
      pressTimer=setTimeout(()=>{
        const rect=bubble.getBoundingClientRect();
        hideMessageOptions();
        showReactionPicker(msg.id, rect.left+20, rect.top);
        if(navigator.vibrate) navigator.vibrate(50);
      },380);
    },{passive:true});

    bubble.addEventListener("touchmove",(e)=>{
      const curX=e.touches[0].clientX; const curY=e.touches[0].clientY;
      const diffX=curX-startX; const diffY=curY-startY;
      if(Math.abs(diffX)>10 || Math.abs(diffY)>10) clearTimeout(pressTimer);
      if(Math.abs(diffX)>15 && Math.abs(diffX)>Math.abs(diffY)){
        isSwipe=true;
        if(diffX>0 && diffX<90){ row.style.transform=`translateX(${diffX}px)`; }
      }
    },{passive:true});

    bubble.addEventListener("touchend",(e)=>{
      clearTimeout(pressTimer);
      const endX=e.changedTouches[0].clientX; const diffX=endX-startX;
      if(isSwipe && diffX>55){
        startReply(msg);
        if(navigator.vibrate) navigator.vibrate(30);
      }
      row.style.transform=`translateX(0)`;
    });

    bubble.addEventListener("contextmenu",(e)=>{ e.preventDefault(); clearTimeout(pressTimer); showMessageOptions(msg,e.clientX,e.clientY); });

    if(msg.imageUrl) wrapper.querySelector(`#img-${msg.id}`)?.addEventListener("click",()=>openLightbox(msg.imageUrl));
    messagesContainer.appendChild(wrapper);
  });
  messagesContainer.scrollTop=messagesContainer.scrollHeight;
  setTimeout(()=>{ markAsDelivered(); },300);
}

function startReply(msg){
  replyToMessage=msg;
  replySenderName.textContent=msg.senderId===currentUser.uid?"Yourself":activeTargetUser.name;
  replyPreviewText.textContent=msg.text||"📷 Photo";
  replyBanner.classList.remove("hidden");
  messageInput.focus();
}
function cancelReply(){ replyToMessage=null; replyBanner.classList.add("hidden"); }
cancelReplyBtn?.addEventListener("click",cancelReply);

photoMenuBtn?.addEventListener("click",(e)=>{ e.stopPropagation(); photoOptionMenu.classList.toggle("hidden"); });
document.addEventListener("click",()=>{ photoOptionMenu?.classList.add("hidden"); hideMessageOptions(); hideReactionPicker(); });
openCameraBtn?.addEventListener("click",()=>{ photoOptionMenu.classList.add("hidden"); cameraFileInput.click(); });
openGalleryBtn?.addEventListener("click",()=>{ photoOptionMenu.classList.add("hidden"); imageFileInput.click(); });
function handleImageSelect(file){
  if(!file) return;
  if(file.size>5*1024*1024){ alert("5MB max boss!"); return; }
  const r=new FileReader();
  r.onload=(ev)=>{ selectedImageData=ev.target.result; imagePreviewImg.src=selectedImageData; imagePreviewBar.classList.remove("hidden"); };
  r.readAsDataURL(file);
}
cameraFileInput.addEventListener("change",(e)=>handleImageSelect(e.target.files[0]));
imageFileInput.addEventListener("change",(e)=>handleImageSelect(e.target.files[0]));
function clearImageAttachment(){ selectedImageData=null; imagePreviewBar.classList.add("hidden"); imagePreviewImg.src=""; imageFileInput.value=""; cameraFileInput.value=""; }
removeImageBtn?.addEventListener("click",clearImageAttachment);

let activeReactMessageId=null;
function showReactionPicker(messageId,x,y){
  activeReactMessageId=messageId;
  reactionPicker.style.left=x+"px"; reactionPicker.style.top=(y-70)+"px";
  reactionPicker.classList.remove("hidden");
  const rect=reactionPicker.getBoundingClientRect();
  if(rect.right>window.innerWidth) reactionPicker.style.left=(window.innerWidth-rect.width-10)+"px";
  if(rect.top<0) reactionPicker.style.top=(y+30)+"px";
}
function hideReactionPicker(){ reactionPicker.classList.add("hidden"); activeReactMessageId=null; }
reactionPicker?.querySelectorAll(".react-btn").forEach(btn=>{
  btn.addEventListener("click", async()=>{
    const emoji=btn.dataset.emoji;
    if(!activeReactMessageId||!activeTargetUser) return;
    const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
    const msgRef=doc(db,"chats",chatId,"messages",activeReactMessageId);
    try{
      const snap=await getDoc(msgRef); if(!snap.exists()) return;
      let reactions=snap.data().reactions||{};
      if(reactions[currentUser.uid]===emoji) delete reactions[currentUser.uid];
      else reactions[currentUser.uid]=emoji;
      await updateDoc(msgRef,{reactions}); hideReactionPicker();
      if(navigator.vibrate) navigator.vibrate(50);
    }catch(err){ console.error(err); }
  });
});

let activeOptionMessage=null;
let editingMessageId=null;
function showMessageOptions(message,x,y){
  activeOptionMessage=message;
  const isMe=message.senderId===currentUser.uid;
  optEditBtn.style.display=isMe &&!message.isDeleted &&!message.imageUrl?"flex":"none";
  optUnsendBtn.style.display=isMe &&!message.isDeleted?"flex":"none";
  messageOptionsMenu.style.left=x+"px"; messageOptionsMenu.style.top=y+"px";
  messageOptionsMenu.classList.remove("hidden");
  const rect=messageOptionsMenu.getBoundingClientRect();
  if(rect.right>window.innerWidth) messageOptionsMenu.style.left=(window.innerWidth-rect.width-10)+"px";
  if(rect.bottom>window.innerHeight) messageOptionsMenu.style.top=(y-rect.height-10)+"px";
}
function hideMessageOptions(){ messageOptionsMenu.classList.add("hidden"); activeOptionMessage=null; }
optReactBtn?.addEventListener("click",()=>{
  if(!activeOptionMessage) return;
  const bubble=document.getElementById(`bubble-${activeOptionMessage.id}`);
  const rect=bubble.getBoundingClientRect();
  hideMessageOptions(); showReactionPicker(activeOptionMessage.id, rect.left+20, rect.top);
});
optReplyBtn?.addEventListener("click",()=>{ if(!activeOptionMessage) return; startReply(activeOptionMessage); hideMessageOptions(); });
optEditBtn?.addEventListener("click",()=>{
  if(!activeOptionMessage) return;
  editingMessageId=activeOptionMessage.id;
  editMessageInput.value=activeOptionMessage.text||"";
  editMessageModal.classList.remove("hidden");
  hideMessageOptions();
  setTimeout(()=>editMessageInput.focus(),100);
});
optUnsendBtn?.addEventListener("click", async()=>{
  if(!activeOptionMessage) return;
  if(!confirm("Unsend for everyone? 🚫")) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const msgRef=doc(db,"chats",chatId,"messages",activeOptionMessage.id);
  try{
    await updateDoc(msgRef,{isDeleted:true,text:"",imageUrl:null,reactions:{},replyTo:null});
    hideMessageOptions();
    if(navigator.vibrate) navigator.vibrate([50,50,50]);
  }catch(err){ alert(err.message); }
});
optDeleteBtn?.addEventListener("click", async()=>{
  if(!activeOptionMessage) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const msgRef=doc(db,"chats",chatId,"messages",activeOptionMessage.id);
  try{
    const snap=await getDoc(msgRef); const data=snap.data(); const deletedFor=data.deletedFor||[];
    if(!deletedFor.includes(currentUser.uid)){ deletedFor.push(currentUser.uid); await updateDoc(msgRef,{deletedFor}); }
    hideMessageOptions();
  }catch(err){ alert(err.message); }
});

function closeEditModal(){ editMessageModal.classList.add("hidden"); editMessageInput.value=""; editingMessageId=null; }
cancelEditMsgBtn?.addEventListener("click",closeEditModal);
editMessageModal?.addEventListener("click",(e)=>{ if(e.target===editMessageModal) closeEditModal(); });
saveEditMsgBtn?.addEventListener("click", async()=>{
  const newText=editMessageInput.value.trim();
  if(!newText) return;
  if(!editingMessageId||!activeTargetUser) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const msgRef=doc(db,"chats",chatId,"messages",editingMessageId);
  saveEditMsgBtn.disabled=true; saveEditMsgBtn.textContent="Saving...";
  try{
    await updateDoc(msgRef,{text:newText,isEdited:true,editedAt:serverTimestamp()});
    closeEditModal();
    await setDoc(doc(db,"users",currentUser.uid,"conversations",activeTargetUser.uid),{lastMessageText:newText,lastMessageTime:serverTimestamp()},{merge:true});
  }catch(err){ alert(err.message); }
  finally{ saveEditMsgBtn.disabled=false; saveEditMsgBtn.textContent="Save"; }
});

function setTypingState(isTyping){
  if(!activeTargetUser||!currentUser) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const ref=doc(db,"chats",chatId,"typing",currentUser.uid);
  setDoc(ref,{isTyping, uid:currentUser.uid, updatedAt:serverTimestamp()},{merge:true}).catch(()=>{});
}
function listenToTypingStatus(){
  if(unsubscribeTyping) unsubscribeTyping();
  if(!activeTargetUser) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const ref=doc(db,"chats",chatId,"typing",activeTargetUser.uid);
  unsubscribeTyping=onSnapshot(ref,(snap)=>{
    if(snap.exists() && snap.data().isTyping){
      if(activeChatStatusText){ activeChatStatusText.textContent=`${activeTargetUser.name} is typing...`; activeChatStatusText.style.color="#0084ff"; }
      if(typingDotsMini) typingDotsMini.classList.remove("hidden");
      typingUserText.textContent=`${activeTargetUser.name} is typing...`;
      typingIndicatorBar.classList.remove("hidden");
    }else{
      if(typingDotsMini) typingDotsMini.classList.add("hidden");
      typingIndicatorBar.classList.add("hidden");
      if(activeTargetUser) listenToUserOnlineStatus(activeTargetUser.uid);
    }
  });
}
messageInput.addEventListener("input",()=>{
  if(!activeTargetUser) return;
  setTypingState(true);
  if(typingTimeout) clearTimeout(typingTimeout);
  typingTimeout=setTimeout(()=>setTypingState(false),2000);
});

async function sendMessage(){
  const text=messageInput.value.trim();
  if((!text &&!selectedImageData) ||!activeTargetUser ||!currentUser) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const msgData={
    senderId:currentUser.uid, receiverId:activeTargetUser.uid, text:text||"", imageUrl:selectedImageData||null,
    createdAt:serverTimestamp(), isRead:false, isDelivered:false,
    replyTo: replyToMessage? {messageId:replyToMessage.id, text:(replyToMessage.text||"📷 Photo").slice(0,80), senderName:replyToMessage.senderId===currentUser.uid?"You":activeTargetUser.name}:null,
    reactions:{}, isEdited:false, isDeleted:false
  };
  sendBtn.disabled=true;
  try{
    await addDoc(collection(db,"chats",chatId,"messages"),msgData);
    const lastText=text|| (selectedImageData?"📷 Photo":"");
    await setDoc(doc(db,"users",currentUser.uid,"conversations",activeTargetUser.uid),{name:activeTargetUser.name, lastMessageText:lastText, lastMessageTime:serverTimestamp(), targetUid:activeTargetUser.uid},{merge:true});
    await setDoc(doc(db,"users",activeTargetUser.uid,"conversations",currentUser.uid),{name:currentUser.displayName||currentUser.email, lastMessageText:lastText, lastMessageTime:serverTimestamp(), targetUid:currentUser.uid},{merge:true});
    messageInput.value=""; clearImageAttachment(); cancelReply(); setTypingState(false); messageInput.style.height="auto";
  }catch(err){ alert("Send failed: "+err.message); }
  finally{ sendBtn.disabled=false; messageInput.focus(); }
}
sendBtn.addEventListener("click",sendMessage);
messageInput.addEventListener("keydown",(e)=>{ if(e.key==="Enter" &&!e.shiftKey){ e.preventDefault(); sendMessage(); } });
messageInput.addEventListener("input",()=>{ messageInput.style.height="auto"; messageInput.style.height=Math.min(messageInput.scrollHeight,100)+"px"; });

async function markMessagesAsRead(targetUid){
  if(!currentUser) return;
  const chatId=getChatId(currentUser.uid,targetUid);
  const qy=query(collection(db,"chats",chatId,"messages"),where("receiverId","==",currentUser.uid),where("isRead","==",false));
  const snap=await getDocs(qy);
  snap.forEach(async d=>{ await updateDoc(doc(db,"chats",chatId,"messages",d.id),{isRead:true,isDelivered:true}); });
}
async function markAsDelivered(){
  if(!currentUser||!activeTargetUser) return;
  const chatId=getChatId(currentUser.uid,activeTargetUser.uid);
  const qy=query(collection(db,"chats",chatId,"messages"),where("receiverId","==",currentUser.uid),where("isDelivered","==",false));
  const snap=await getDocs(qy);
  snap.forEach(async d=>{ await updateDoc(doc(db,"chats",chatId,"messages",d.id),{isDelivered:true}); });
}

function openLightbox(url){ lightboxImg.src=url; lightboxDownloadBtn.href=url; lightboxModal.classList.remove("hidden"); }
function closeLightbox(){ lightboxModal.classList.add("hidden"); lightboxImg.src=""; }
lightboxCloseBtn?.addEventListener("click",closeLightbox);
lightboxModal?.addEventListener("click",(e)=>{ if(e.target===lightboxModal) closeLightbox(); });

editNameBtn?.addEventListener("click",()=>{ editNameInput.value=currentUser?.displayName||""; editNameModal.classList.remove("hidden"); setTimeout(()=>editNameInput.focus(),100); });
function closeEditNameModal(){ editNameModal.classList.add("hidden"); editNameInput.value=""; }
closeEditNameBtn?.addEventListener("click",closeEditNameModal);
cancelEditNameBtn?.addEventListener("click",closeEditNameModal);
editNameModal?.addEventListener("click",(e)=>{ if(e.target===editNameModal) closeEditNameModal(); });
saveNameBtn?.addEventListener("click", async()=>{
  const newName=editNameInput.value.trim(); if(!newName) return;
  if(!currentUser) return;
  saveNameBtn.disabled=true; saveNameBtn.textContent="Saving...";
  try{
    await updateProfile(currentUser,{displayName:newName});
    await setDoc(doc(db,"users",currentUser.uid),{name:newName},{merge:true});
    currentUserName.textContent=newName; userInitials.textContent=newName.charAt(0).toUpperCase(); closeEditNameModal();
  }catch(err){ alert(err.message); }
  finally{ saveNameBtn.disabled=false; saveNameBtn.textContent="Save"; }
});

let localStream=null, remoteStream=null, peerConnection=null, currentCallId=null, isCallInitiator=false;
let screenStream=null, isScreenSharing=false;
const rtcConfig={iceServers:[{urls:"stun:stun.l.google.com:19302"}]};
function createPeerConnection(callId){
  peerConnection=new RTCPeerConnection(rtcConfig);
  peerConnection.onicecandidate=(e)=>{
    if(e.candidate && currentCallId){
      const candidateData={candidate:e.candidate.toJSON(), createdAt:serverTimestamp()};
      addDoc(collection(db,"calls",currentCallId,"candidates"),candidateData);
    }
  };
  peerConnection.ontrack=(e)=>{
    if(!remoteStream){ remoteStream=new MediaStream(); remoteVideo.srcObject=remoteStream; }
    e.streams[0].getTracks().forEach(t=>remoteStream.addTrack(t));
  };
  if(localStream) localStream.getTracks().forEach(t=>peerConnection.addTrack(t,localStream));
  return peerConnection;
}
async function startCall(isVideo){
  if(!activeTargetUser){ alert("Select user first boss!"); return; }
  isCallInitiator=true;
  try{
    localStream=await navigator.mediaDevices.getUserMedia({video:isVideo,audio:true});
    localVideo.srcObject=localStream;
    videoCallModal.classList.remove("hidden");
    callStatus.textContent=`Calling ${activeTargetUser.name}...`;
    const callDocRef=doc(collection(db,"calls"));
    currentCallId=callDocRef.id;
    await setDoc(callDocRef,{callerId:currentUser.uid,callerName:currentUser.displayName||currentUser.email,receiverId:activeTargetUser.uid,receiverName:activeTargetUser.name,type:isVideo?"video":"voice",status:"ringing",createdAt:serverTimestamp()});
    createPeerConnection(currentCallId);
    const offer=await peerConnection.createOffer(); await peerConnection.setLocalDescription(offer);
    await setDoc(doc(db,"calls",currentCallId,"offer","offer"),{sdp:offer.sdp,type:offer.type,createdAt:serverTimestamp()});
    onSnapshot(doc(db,"calls",currentCallId), async(snap)=>{
      const data=snap.data(); if(!data) return;
      if(data.status==="accepted" && data.answer){
        if(peerConnection.signalingState!=="stable"){
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          callStatus.textContent=`Connected with ${activeTargetUser.name}`;
        }
      }
      if(data.status==="declined"||data.status==="ended"){ endCall(false); }
    });
    onSnapshot(collection(db,"calls",currentCallId,"candidates"),(snap)=>{
      snap.docChanges().forEach(async(change)=>{
        if(change.type==="added"){
          const d=change.doc.data();
          if(d.candidate && peerConnection && peerConnection.remoteDescription){
            try{ await peerConnection.addIceCandidate(new RTCIceCandidate(d.candidate)); }catch(e){}
          }
        }
      });
    });
    await addDoc(collection(db,"chats",getChatId(currentUser.uid,activeTargetUser.uid),"messages"),{senderId:currentUser.uid,receiverId:activeTargetUser.uid,text:`${isVideo?"Video":"Voice"} call started`,type:"call_log",callType:isVideo?"video":"voice",callStatus:"started",createdAt:serverTimestamp()});
  }catch(err){ alert("Call failed: "+err.message); endCall(false); }
}
async function acceptCall(callId){
  try{
    const callSnap=await getDoc(doc(db,"calls",callId));
    const callData=callSnap.data(); currentCallId=callId; isCallInitiator=false;
    localStream=await navigator.mediaDevices.getUserMedia({video:callData.type==="video",audio:true});
    localVideo.srcObject=localStream; videoCallModal.classList.remove("hidden"); incomingCallPopup.classList.add("hidden"); stopRingtone();
    createPeerConnection(callId);
    const offerSnap=await getDoc(doc(db,"calls",callId,"offer","offer"));
    if(offerSnap.exists()){
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offerSnap.data()));
      const answer=await peerConnection.createAnswer(); await peerConnection.setLocalDescription(answer);
      await updateDoc(doc(db,"calls",callId),{status:"accepted",answer:{sdp:answer.sdp,type:answer.type},acceptedAt:serverTimestamp()});
      callStatus.textContent=`Connected with ${callData.callerName}`;
    }
    onSnapshot(collection(db,"calls",callId,"candidates"),(snap)=>{
      snap.docChanges().forEach(async(change)=>{
        if(change.type==="added"){
          const d=change.doc.data();
          if(d.candidate && peerConnection.remoteDescription){
            try{ await peerConnection.addIceCandidate(new RTCIceCandidate(d.candidate)); }catch(e){}
          }
        }
      });
    });
  }catch(err){ alert(err.message); endCall(false); }
}
async function endCall(log=true){
  if(localStream){ localStream.getTracks().forEach(t=>t.stop()); localStream=null; }
  if(screenStream){ screenStream.getTracks().forEach(t=>t.stop()); screenStream=null; }
  if(peerConnection){ peerConnection.close(); peerConnection=null; }
  if(remoteStream){ remoteStream.getTracks().forEach(t=>t.stop()); remoteStream=null; }
  remoteVideo.srcObject=null; localVideo.srcObject=null;
  videoCallModal.classList.add("hidden"); incomingCallPopup.classList.add("hidden"); stopRingtone();
  if(currentCallId && log){
    try{
      await updateDoc(doc(db,"calls",currentCallId),{status:"ended",endedAt:serverTimestamp()});
      if(activeTargetUser){
        await addDoc(collection(db,"chats",getChatId(currentUser.uid,activeTargetUser.uid),"messages"),{senderId:currentUser.uid,receiverId:activeTargetUser.uid,text:`Call ended`,type:"call_log",callType:"video",callStatus:"ended",createdAt:serverTimestamp()});
      }
    }catch(e){}
  }
  currentCallId=null; isCallInitiator=false; isScreenSharing=false;
}
function playRingtone(){ ringtoneAudio?.play().catch(()=>{}); if(navigator.vibrate) navigator.vibrate([500,500,500]); }
function stopRingtone(){ ringtoneAudio?.pause(); ringtoneAudio.currentTime=0; if(navigator.vibrate) navigator.vibrate(0); }
function listenForIncomingCalls(){
  if(!currentUser) return;
  const qy=query(collection(db,"calls"),where("receiverId","==",currentUser.uid),where("status","==","ringing"));
  unsubscribeIncomingCall=onSnapshot(qy,(snap)=>{
    snap.docChanges().forEach(change=>{
      if(change.type==="added"){
        const data=change.doc.data(); const id=change.doc.id;
        if(data.receiverId===currentUser.uid &&!currentCallId){
          currentCallId=id;
          incomingName.textContent=data.callerName||"Someone"; incomingType.textContent=`${data.type==="video"?"Video":"Voice"} call`;
          incomingInitials.textContent=(data.callerName||"U").charAt(0).toUpperCase();
          incomingCallPopup.classList.remove("hidden"); playRingtone();
          acceptCallBtn.onclick=()=>acceptCall(id);
          declineCallBtn.onclick=async()=>{
            await updateDoc(doc(db,"calls",id),{status:"declined",declinedAt:serverTimestamp()});
            incomingCallPopup.classList.add("hidden"); stopRingtone(); currentCallId=null;
          };
        }
      }
    });
  });
}
voiceCallBtn?.addEventListener("click",()=>startCall(false));
videoCallBtn?.addEventListener("click",()=>startCall(true));
endCallBtn?.addEventListener("click",()=>endCall(true));
muteBtn?.addEventListener("click",()=>{
  if(!localStream) return;
  const track=localStream.getAudioTracks()[0];
  if(track){ track.enabled=!track.enabled; muteBtn.style.background=track.enabled?"rgba(255,255,255,0.25)":"#ef4444"; }
});
cameraBtn?.addEventListener("click",()=>{
  if(!localStream) return;
  const track=localStream.getVideoTracks()[0];
  if(track){ track.enabled=!track.enabled; cameraBtn.style.background=track.enabled?"rgba(255,255,255,0.25)":"#ef4444"; }
});
screenBtn?.addEventListener("click", async()=>{
  if(isScreenSharing){
    if(screenStream) screenStream.getTracks().forEach(t=>t.stop());
    if(localStream) localVideo.srcObject=localStream;
    isScreenSharing=false; screenBtn.style.background="rgba(255,255,255,0.25)";
  }else{
    try{
      screenStream=await navigator.mediaDevices.getDisplayMedia({video:true});
      const videoTrack=screenStream.getVideoTracks()[0];
      if(peerConnection){
        const sender=peerConnection.getSenders().find(s=>s.track && s.track.kind==="video");
        if(sender) sender.replaceTrack(videoTrack);
      }
      localVideo.srcObject=screenStream;
      isScreenSharing=true; screenBtn.style.background="#0084ff";
      videoTrack.onended=()=>{
        if(peerConnection && localStream){
          const sender=peerConnection.getSenders().find(s=>s.track && s.track.kind==="video");
          const camTrack=localStream.getVideoTracks()[0];
          if(sender && camTrack) sender.replaceTrack(camTrack);
        }
        localVideo.srcObject=localStream; isScreenSharing=false; screenBtn.style.background="rgba(255,255,255,0.25)";
      };
    }catch(e){ console.error(e); }
  }
});
(function(){
  let isDragging=false, startX, startY, initialLeft, initialTop;
  localVideoWrapper?.addEventListener("mousedown", startDrag);
  localVideoWrapper?.addEventListener("touchstart", startDrag, {passive:false});
  function startDrag(e){
    isDragging=true;
    const rect=localVideoWrapper.getBoundingClientRect();
    const clientX=e.touches? e.touches[0].clientX:e.clientX;
    const clientY=e.touches? e.touches[0].clientY:e.clientY;
    startX=clientX; startY=clientY;
    initialLeft=rect.left; initialTop=rect.top;
    localVideoWrapper.style.transition="none";
  }
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("touchmove", onDrag, {passive:false});
  window.addEventListener("mouseup", endDrag);
  window.addEventListener("touchend", endDrag);
  function onDrag(e){
    if(!isDragging) return;
    e.preventDefault();
    const clientX=e.touches? e.touches[0].clientX:e.clientX;
    const clientY=e.touches? e.touches[0].clientY:e.clientY;
    const dx=clientX-startX; const dy=clientY-startY;
    let newLeft=initialLeft+dx; let newTop=initialTop+dy;
    newLeft=Math.max(0, Math.min(window.innerWidth - localVideoWrapper.offsetWidth, newLeft));
    newTop=Math.max(0, Math.min(window.innerHeight - localVideoWrapper.offsetHeight - 80, newTop));
    localVideoWrapper.style.left=newLeft+"px"; localVideoWrapper.style.top=newTop+"px"; localVideoWrapper.style.right="auto"; localVideoWrapper.style.bottom="auto";
    localVideoWrapper.style.position="fixed";
  }
  function endDrag(){ isDragging=false; localVideoWrapper.style.transition="transform 0.2s"; }
})();

mobileBackBtn?.addEventListener("click",()=>{
  chatArea.classList.remove("active-mobile");
  activeChatWrapper.classList.add("hidden");
  emptyState.classList.remove("hidden");
  if(activeTargetUser) setTypingState(false);
  activeTargetUser=null;
});

onAuthStateChanged(auth, async(user)=>{
  if(user){
    currentUser=user;
    currentUserName.textContent=user.displayName||"User";
    currentUserEmail.textContent=user.email;
    userInitials.textContent=(user.displayName||user.email).charAt(0).toUpperCase();
    authScreen.classList.add("hidden"); appScreen.classList.remove("hidden");
    resetToBlankState(); fetchAllUsers(); listenToContacts(); listenToActiveConversations(); listenForIncomingCalls();
    await setOnlineStatus(true);
    if(Notification.permission==="default"){
      setTimeout(async()=>{ if(confirm("Enable notifications boss? 🔔")) await enableNotifications(); },2000);
    }else if(Notification.permission==="granted"){ enableNotifications(); }
    setInterval(()=>setOnlineStatus(true),30000);
  }else{
    if(currentUser) await setOnlineStatus(false);
    currentUser=null; switchToSignInMode(); clearAuthInputs();
    authScreen.classList.remove("hidden"); appScreen.classList.add("hidden");
    if(unsubscribeConversations) unsubscribeConversations();
    if(unsubscribeContacts) unsubscribeContacts();
    if(unsubscribeTyping) unsubscribeTyping();
    if(unsubscribeIncomingCall) unsubscribeIncomingCall();
    if(unsubscribeUserStatus) unsubscribeUserStatus();
    Object.values(unreadListeners).forEach(u=>u()); unreadListeners={};
  }
});

window.addEventListener("beforeunload",()=>{ if(currentUser) setOnlineStatus(false); });
document.addEventListener("visibilitychange",()=>{ if(currentUser){ if(document.hidden) setOnlineStatus(false); else setOnlineStatus(true); } });
logoutBtn?.addEventListener("click", async()=>{ if(currentUser) await setOnlineStatus(false); await signOut(auth); });

console.log("Messenger V18.9 Ready boss! 🟢 COMPACT + PANTAY RIGHT!");
