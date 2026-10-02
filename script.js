// MESSENGER V7 - FULL FIXED VIDEO CALL - NO MORE NULL ERROR
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// DOM ELEMENTS
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPass = document.getElementById('auth-password');
const authName = document.getElementById('auth-name');
const nameGroup = document.getElementById('name-group');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const currentUserNameEl = document.getElementById('current-user-name');
const currentUserEmailEl = document.getElementById('current-user-email');
const userInitialsEl = document.getElementById('user-initials');
const chatsListEl = document.getElementById('chats-list');
const emptyState = document.getElementById('empty-state');
const activeChatWrapper = document.getElementById('active-chat-wrapper');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatArea = document.getElementById('chat-area');
const activeChatTitle = document.getElementById('active-chat-title');
const activeChatAvatar = document.getElementById('active-chat-avatar');
const chatInitials = document.getElementById('chat-initials');
const mobileBackBtn = document.getElementById('mobile-back-btn');
const addUserBtn = document.getElementById('add-user-btn');
const startAddUserBtn = document.getElementById('start-add-user-btn');
const addUserModal = document.getElementById('add-user-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalUsersList = document.getElementById('modal-users-list');
const modalSearch = document.getElementById('modal-user-search');
const userSearch = document.getElementById('user-search');
const logoutBtn = document.getElementById('logout-btn');
const contactsCount = document.getElementById('contacts-count');

// VIDEO CALL DOM
const videoCallBtn = document.getElementById('video-call-btn');
const voiceCallBtn = document.getElementById('voice-call-btn');
const videoCallModal = document.getElementById('video-call-modal');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const callStatus = document.getElementById('call-status');
const muteBtn = document.getElementById('mute-btn');
const cameraBtn = document.getElementById('camera-btn');
const screenBtn = document.getElementById('screen-btn');
const endCallBtn = document.getElementById('end-call-btn');
const incomingPopup = document.getElementById('incoming-call-popup');
const incomingName = document.getElementById('incoming-name');
const incomingType = document.getElementById('incoming-type');
const incomingInitials = document.getElementById('incoming-initials');
const acceptCallBtn = document.getElementById('accept-call-btn');
const declineCallBtn = document.getElementById('decline-call-btn');

// STATE
let currentUser = null;
let activeChatUser = null;
let isSignUp = false;
let unsubMessages = null;
let unsubCalls = null;
let unsubUsers = null;
let pc = null;
let localStream = null;
let remoteStream = null;
let callDocId = null;
let incomingCallData = null;
let allUsersCache = [];

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};

// AUTH TOGGLE
const toggleAuthMode = (e) => {
  if(e) e.preventDefault();
  isSignUp =!isSignUp;
  authTitle.textContent = isSignUp? 'Create Account' : 'Welcome Back';
  authSubmitBtn.textContent = isSignUp? 'Sign Up' : 'Sign In';
  nameGroup.classList.toggle('hidden',!isSignUp);
  document.getElementById('auth-toggle-text').innerHTML = isSignUp
   ? `Already have an account? <a href="#" id="auth-toggle-btn">Sign In</a>`
    : `Don't have an account? <a href="#" id="auth-toggle-btn">Sign Up</a>`;
  document.getElementById('auth-toggle-btn').onclick = toggleAuthMode;
};
document.getElementById('auth-toggle-btn').onclick = toggleAuthMode;

// LOGIN / SIGNUP
authForm.onsubmit = async (e) => {
  e.preventDefault();
  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = 'Please wait...';
  try {
    if (isSignUp) {
      if(!authName.value.trim()) throw new Error('Name required boss!');
      const cred = await createUserWithEmailAndPassword(auth, authEmail.value.trim(), authPass.value);
      await updateProfile(cred.user, { displayName: authName.value.trim() });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name: authName.value.trim(),
        email: cred.user.email.toLowerCase(),
        createdAt: serverTimestamp()
      });
    } else {
      await signInWithEmailAndPassword(auth, authEmail.value.trim(), authPass.value);
    }
  } catch (err) {
    alert(err.message);
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignUp? 'Sign Up' : 'Sign In';
  }
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    currentUserNameEl.textContent = user.displayName || user.email.split('@')[0];
    currentUserEmailEl.textContent = user.email;
    userInitialsEl.textContent = (user.displayName || user.email)[0].toUpperCase();
    loadChats();
    listenIncomingCalls();
  } else {
    currentUser = null;
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    if(unsubMessages) unsubMessages();
    if(unsubCalls) unsubCalls();
    if(unsubUsers) unsubUsers();
  }
});

logoutBtn.onclick = () => signOut(auth);

// LOAD CHATS / USERS
async function loadChats() {
  if(unsubUsers) unsubUsers();
  const q = query(collection(db, 'users'));
  unsubUsers = onSnapshot(q, (snap) => {
    chatsListEl.innerHTML = '';
    allUsersCache = [];
    snap.forEach(d => {
      if (d.id === currentUser.uid) return;
      const u = d.data();
      allUsersCache.push(u);
    });
    if(contactsCount) contactsCount.textContent = allUsersCache.length;
    renderUserList(allUsersCache);
  });
}

function renderUserList(users) {
  chatsListEl.innerHTML = '';
  users.forEach(u => {
    const div = document.createElement('div');
    div.className = 'chat-item';
    if(activeChatUser && activeChatUser.uid === u.uid) div.classList.add('active');
    div.innerHTML = `
      <div class="avatar-container" style="width:40px;height:40px;background:#0084ff;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700">${u.name[0].toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name}</div>
        <div style="font-size:0.78rem;color:#65676b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.email}</div>
      </div>
    `;
    div.onclick = () => openChat(u);
    chatsListEl.appendChild(div);
  });
}

if(userSearch) {
  userSearch.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allUsersCache.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    renderUserList(filtered);
  };
}

function openChat(user) {
  activeChatUser = user;
  emptyState.classList.add('hidden');
  activeChatWrapper.classList.remove('hidden');
  chatArea.classList.add('active-mobile');
  activeChatTitle.textContent = user.name;
  chatInitials.textContent = user.name[0].toUpperCase();
  // highlight active
  document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
  loadMessages();
}

if(mobileBackBtn) {
  mobileBackBtn.onclick = () => {
    chatArea.classList.remove('active-mobile');
    activeChatWrapper.classList.add('hidden');
    emptyState.classList.remove('hidden');
  };
}

function getChatId(a,b){ return [a,b].sort().join('_'); }

function loadMessages(){
  if(unsubMessages) unsubMessages();
  const chatId = getChatId(currentUser.uid, activeChatUser.uid);
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp','asc'));
  unsubMessages = onSnapshot(q, (snap)=>{
    messagesContainer.innerHTML='';
    snap.forEach(d=>{
      const m=d.data();
      const isMe=m.senderId===currentUser.uid;
      const time = m.timestamp?.toDate? m.timestamp.toDate().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'now';
      const wrap=document.createElement('div');
      wrap.className=`message-wrapper ${isMe?'outgoing':'incoming'}`;
      wrap.style.cssText = `display:flex;flex-direction:column;max-width:78%;align-self:${isMe?'flex-end':'flex-start'};margin-bottom:4px`;
      wrap.innerHTML=`
        <div style="padding:10px 12px;border-radius:18px;font-size:14px;word-break:break-word;background:${isMe?'#0084ff':'white'};color:${isMe?'white':'#050505'};border-bottom-${isMe?'right':'left'}-radius:4px;box-shadow:${isMe?'none':'0 1px 1px rgba(0,0,0,0.08)'}">
          ${m.text? m.text.replace(/\n/g,'<br>') : ''}
          <span style="font-size:0.62rem;opacity:0.7;display:block;text-align:right;margin-top:4px">${time}</span>
        </div>
      `;
      messagesContainer.appendChild(wrap);
    });
    messagesContainer.scrollTop=messagesContainer.scrollHeight;
  });
}

async function sendMessage(){
  const text=messageInput.value.trim();
  if(!text||!activeChatUser) return;
  const chatId=getChatId(currentUser.uid, activeChatUser.uid);
  messageInput.value='';
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text, senderId: currentUser.uid,
    senderName: currentUser.displayName||currentUser.email,
    timestamp: serverTimestamp()
  });
}

if(sendBtn) sendBtn.onclick=sendMessage;
if(messageInput) messageInput.onkeydown=(e)=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMessage(); } };
if(addUserBtn) addUserBtn.onclick=()=>addUserModal.classList.remove('hidden');
if(startAddUserBtn) startAddUserBtn.onclick=()=>addUserModal.classList.remove('hidden');
if(closeModalBtn) closeModalBtn.onclick=()=>addUserModal.classList.add('hidden');

// MODAL SEARCH
if(modalSearch) {
  modalSearch.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allUsersCache.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    renderModalUsers(filtered);
  };
}
function renderModalUsers(users) {
  if(!modalUsersList) return;
  modalUsersList.innerHTML = '';
  if(users.length===0){ modalUsersList.innerHTML = '<p style="text-align:center;color:#65676b;padding:20px">No users found</p>'; return; }
  users.forEach(u => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px;border-radius:10px;background:#f0f2f5;margin-bottom:6px';
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;background:#0084ff;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700">${u.name[0].toUpperCase()}</div>
        <div><div style="font-weight:600;font-size:0.9rem">${u.name}</div><div style="font-size:0.75rem;color:#65676b">${u.email}</div></div>
      </div>
      <button style="background:#0084ff;color:white;border:none;padding:6px 12px;border-radius:20px;font-size:0.8rem;font-weight:600;cursor:pointer">Chat</button>
    `;
    div.querySelector('button').onclick = () => { addUserModal.classList.add('hidden'); openChat(u); };
    modalUsersList.appendChild(div);
  });
}

// ================= VIDEO CALL - V7 FIXED NULL ERROR =================
function createPeer(){
  pc=new RTCPeerConnection(rtcConfig);
  pc.onicecandidate=async(e)=>{
    if(e.candidate&&callDocId){
      try{
        await addDoc(collection(db,'calls',callDocId,'candidates'), {...e.candidate.toJSON(), senderId: currentUser.uid});
      }catch(err){ console.log('ICE candidate error', err); }
    }
  };
  pc.ontrack=(e)=>{
    if(!remoteStream) remoteStream=new MediaStream();
    e.streams[0].getTracks().forEach(t=>remoteStream.addTrack(t));
    remoteVideo.srcObject=remoteStream;
    callStatus.textContent='Connected 📹';
  };
  pc.onconnectionstatechange = () => {
    console.log('Connection state:', pc.connectionState);
    if(pc.connectionState==='connected') callStatus.textContent='Connected 📹';
    if(pc.connectionState==='failed' || pc.connectionState==='disconnected'){
      callStatus.textContent='Connection failed';
    }
  };
  return pc;
}

async function startCall(isVideo=true){
  if(!activeChatUser) return alert('Pumili ka muna ng ka-chat boss!');
  try{
    callDocId=getChatId(currentUser.uid, activeChatUser.uid)+'_'+Date.now();
    videoCallModal.classList.remove('hidden');
    callStatus.textContent=isVideo?'Starting video call... 📹':'Starting voice call... 📞';

    localStream=await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
    localVideo.srcObject=localStream;

    createPeer();
    localStream.getTracks().forEach(t=>pc.addTrack(t, localStream));

    const offer=await pc.createOffer();
    await pc.setLocalDescription(offer);

    // FIX: GAMITIN pc.localDescription PARA SURE MAY TYPE!
    const finalOffer=pc.localDescription;
    console.log('Creating offer with type:', finalOffer.type);

    await setDoc(doc(db,'calls',callDocId), {
      offer: { type: finalOffer.type, sdp: finalOffer.sdp },
      callerId: currentUser.uid,
      callerName: currentUser.displayName||currentUser.email,
      receiverId: activeChatUser.uid,
      receiverName: activeChatUser.name,
      type: isVideo?'video':'voice',
      status:'ringing',
      createdAt: serverTimestamp()
    });

    // Listen for answer
    onSnapshot(doc(db,'calls',callDocId), async(snap)=>{
      const data=snap.data();
      if(!data) return;
      if(data.answer && pc &&!pc.currentRemoteDescription){
        try{
          const validAnswer={
            type: data.answer.type && data.answer.type!=='null'? data.answer.type : 'answer',
            sdp: data.answer.sdp
          };
          console.log('Got answer:', validAnswer.type);
          await pc.setRemoteDescription(new RTCSessionDescription(validAnswer));
          callStatus.textContent='Connected 📹';
        }catch(e){ console.error('Set remote answer failed', e); }
      }
      if(data.status==='ended') endCall();
      if(data.status==='declined'){ alert('Declined boss'); endCall(); }
    });

    // Listen for ICE
    onSnapshot(collection(db,'calls',callDocId,'candidates'), (snap)=>{
      snap.docChanges().forEach(async ch=>{
        if(ch.type==='added'){
          const d=ch.doc.data();
          if(d.senderId!==currentUser.uid && pc){
            try{ await pc.addIceCandidate(new RTCIceCandidate(d)); }catch(e){}
          }
        }
      });
    });

  }catch(err){
    console.error(err);
    alert('Start call failed: '+err.message+'\n\nTips:\n1. Dapat https:// or localhost\n2. Allow camera/mic\n3. Check Firestore rules allow read/write');
    endCall();
  }
}

function listenIncomingCalls(){
  if(unsubCalls) unsubCalls();
  if(!currentUser) return;
  const q=query(collection(db,'calls'), where('receiverId','==',currentUser.uid), where('status','==','ringing'));
  unsubCalls=onSnapshot(q,(snap)=>{
    snap.docChanges().forEach(ch=>{
      if(ch.type==='added'){
        const data=ch.doc.data();
        // Ignore old calls >60sec
        const age=data.createdAt? (Date.now()-data.createdAt.toDate().getTime())/1000 : 0;
        if(age>60) return;
        console.log('Incoming call:', data.callerName);
        incomingCallData={ id: ch.doc.id,...data };
        incomingName.textContent=data.callerName+' is calling...';
        incomingType.textContent=data.type==='video'?'📹 Video call':'📞 Voice call';
        incomingInitials.textContent=data.callerName[0].toUpperCase();
        incomingPopup.classList.remove('hidden');
        // Vibrate if mobile
        if(navigator.vibrate) navigator.vibrate([500,300,500]);
      }
      if(ch.type==='modified' && ch.doc.data().status==='ended'){
        incomingPopup.classList.add('hidden');
      }
    });
  });
}

// FIXED ACCEPT - ITO YUNG FIX SA ERROR MO SA SCREENSHOT!
acceptCallBtn.onclick=async()=>{
  if(!incomingCallData) return;
  try{
    callDocId=incomingCallData.id;
    videoCallModal.classList.remove('hidden');
    incomingPopup.classList.add('hidden');
    callStatus.textContent='Connecting... 📞';

    localStream=await navigator.mediaDevices.getUserMedia({
      video: incomingCallData.type==='video',
      audio: true
    });
    localVideo.srcObject=localStream;

    createPeer();
    localStream.getTracks().forEach(t=>pc.addTrack(t, localStream));

    // RE-FETCH PARA HINDI NULL!
    let offer=incomingCallData.offer;
    if(!offer ||!offer.sdp){
      console.log('Re-fetching offer...');
      const fresh=await getDoc(doc(db,'calls',callDocId));
      offer=fresh.data()?.offer;
    }
    if(!offer ||!offer.sdp) throw new Error('Offer missing - tawag ulit boss');

    // FIX SA NULL TYPE ERROR!
    const validOffer={
      type: (offer.type && offer.type!=='null' && offer.type!==null)? offer.type : 'offer',
      sdp: offer.sdp
    };
    console.log('Setting remote offer type:', validOffer.type);
    await pc.setRemoteDescription(new RTCSessionDescription(validOffer));

    const answer=await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await updateDoc(doc(db,'calls',callDocId), {
      answer: { type: answer.type, sdp: answer.sdp },
      status: 'connected'
    });

    onSnapshot(collection(db,'calls',callDocId,'candidates'), (snap)=>{
      snap.docChanges().forEach(async ch=>{
        if(ch.type==='added'){
          const d=ch.doc.data();
          if(d.senderId!==currentUser.uid && pc){
            try{ await pc.addIceCandidate(new RTCIceCandidate(d)); }catch(e){}
          }
        }
      });
    });

    onSnapshot(doc(db,'calls',callDocId), (s)=>{
      if(s.data()?.status==='ended') endCall();
    });

  }catch(e){
    console.error(e);
    alert('Accept failed: '+e.message);
    endCall();
  }
};

declineCallBtn.onclick=async()=>{
  if(incomingCallData){
    try{
      await updateDoc(doc(db,'calls',incomingCallData.id), { status:'declined' });
      setTimeout(async()=>{ try{ await updateDoc(doc(db,'calls',incomingCallData.id), { status:'ended' }); }catch(e){} }, 1500);
    }catch(e){}
  }
  incomingPopup.classList.add('hidden');
  incomingCallData=null;
};

async function endCall(){
  videoCallModal.classList.add('hidden');
  incomingPopup.classList.add('hidden');
  callStatus.textContent='Ended';
  if(localStream) localStream.getTracks().forEach(t=>t.stop());
  if(pc) pc.close();
  localStream=null; pc=null; remoteStream=null;
  if(localVideo) localVideo.srcObject=null;
  if(remoteVideo) remoteVideo.srcObject=null;
  if(callDocId){
    try{ await updateDoc(doc(db,'calls',callDocId), { status:'ended' }); }catch(e){}
  }
  callDocId=null;
  incomingCallData=null;
}

if(videoCallBtn) videoCallBtn.onclick=()=>startCall(true);
if(voiceCallBtn) voiceCallBtn.onclick=()=>startCall(false);
if(endCallBtn) endCallBtn.onclick=endCall;

if(muteBtn) muteBtn.onclick=()=>{
  if(!localStream) return;
  const track=localStream.getAudioTracks()[0];
  if(track){ track.enabled=!track.enabled; muteBtn.textContent=track.enabled?'🎤':'🔇'; muteBtn.style.background=track.enabled?'rgba(255,255,255,0.25)':'#ef4444'; }
};
if(cameraBtn) cameraBtn.onclick=()=>{
  if(!localStream) return;
  const track=localStream.getVideoTracks()[0];
  if(track){ track.enabled=!track.enabled; cameraBtn.textContent=track.enabled?'📹':'🚫'; }
};
if(screenBtn) screenBtn.onclick=async()=>{
  try{
    const screenStream=await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack=screenStream.getVideoTracks()[0];
    const sender=pc.getSenders().find(s=>s.track && s.track.kind==='video');
    if(sender) await sender.replaceTrack(screenTrack);
    localVideo.srcObject=screenStream;
    screenTrack.onended=async()=>{
      try{
        const camStream=await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const camTrack=camStream.getVideoTracks()[0];
        if(sender) await sender.replaceTrack(camTrack);
        localVideo.srcObject=camStream;
        localStream=camStream;
      }catch(e){}
    };
  }catch(e){ console.log('Screen share cancelled'); }
};

// Request notification permission
if("Notification" in window && Notification.permission!=="granted"){
  Notification.requestPermission();
}

console.log('Messenger V7 Loaded - Video call fixed boss!');
