const socket = io();
console.log("Socket connected");
let localStream;
let peerConnection;
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const nextBtn = document.getElementById("next");

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    socket.emit("ready");
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
  console.log("Matched! You are initiator:", isInitiator);
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
  location.reload(); // restart connection
};
