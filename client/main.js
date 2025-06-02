const socket = io();
let localStream;
let peerConnection;
let isMuted = false;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const nextBtn = document.getElementById("next");
const muteBtn = document.getElementById("muteBtn");
const kickBtn = document.getElementById("kickBtn");
const reportBtn = document.getElementById("reportBtn");
const usernameInput = document.getElementById("username");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatMsg");
const sendBtn = document.getElementById("sendMsg");

// Update page title and heading to 'Zapped ⚡'
document.title = "Zapped ⚡";
const titleDiv = document.querySelector(".title");
if (titleDiv) {
  titleDiv.innerHTML = "<span style='color:yellow;font-weight:bold;'>⚡ Zapped</span>";
}

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    localVideo.onloadedmetadata = () => {
      socket.emit("ready", usernameInput.value.trim() || "Guest");
    };
  })
  .catch(error => {
    console.error("Error accessing camera/mic:", error);
  });

function createPeerConnection(isInitiator) {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  if (isInitiator) {
    peerConnection.createOffer().then(offer => {
      peerConnection.setLocalDescription(offer);
      socket.emit("offer", offer);
    });
  }
}

socket.on("matched", (isInitiator) => {
  createPeerConnection(isInitiator);
});

socket.on("offer", offer => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  peerConnection.createAnswer().then(answer => {
    peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
  });
});

socket.on("answer", answer => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("ice-candidate", candidate => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

nextBtn.onclick = () => {
  location.reload();
};

muteBtn.onclick = () => {
  isMuted = !isMuted;
  localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
};

sendBtn.onclick = () => {
  const message = chatInput.value.trim();
  const name = usernameInput.value.trim() || "Guest";
  if (message) {
    socket.emit("chat", { message, name });
    appendMessage(`🧍 ${name}: ${message}`);
    chatInput.value = "";
  }
};

socket.on("chat", ({ message, name }) => {
  appendMessage(`👤 ${name}: ${message}`);
});

function appendMessage(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

kickBtn.onclick = () => {
  alert("Kick function not implemented yet");
};

reportBtn.onclick = () => {
  alert("Report function not implemented yet");
};
