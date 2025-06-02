const socket = io();
let localStream;
let peerConnection;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const nextBtn = document.getElementById("next");

console.log("Socket connected");

// Step 1: Get camera and wait until it's fully ready
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    console.log("Local stream ready");

    localVideo.onloadedmetadata = () => {
      console.log("Local video metadata loaded");
      socket.emit("ready");
    };
  })
  .catch(error => {
    console.error("Error accessing camera/mic:", error);
  });

// Step 2: Create Peer Connection
function createPeerConnection(isInitiator) {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    console.log("Remote stream received");
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("Sending ICE candidate");
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

// Step 3: Handle match and WebRTC signaling
socket.on("matched", (isInitiator) => {
  console.log("Matched! You are initiator:", isInitiator);
  createPeerConnection(isInitiator);
});

socket.on("offer", offer => {
  console.log("Offer received");
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  peerConnection.createAnswer().then(answer => {
    peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
  });
});

socket.on("answer", answer => {
  console.log("Answer received");
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("ice-candidate", candidate => {
  console.log("Received ICE candidate");
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Step 4: Skip button resets everything
nextBtn.onclick = () => {
  location.reload();
};
