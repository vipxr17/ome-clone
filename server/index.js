const express = require("express");
const http = require("http");
const path = require("path");
const socket = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socket(server);

// Serve frontend
app.use(express.static(path.join(__dirname, "../client")));

let waitingSocket = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("ready", () => {
    if (waitingSocket) {
      waitingSocket.emit("matched", true);
      socket.emit("matched", false);

      waitingSocket.on("offer", (data) => socket.emit("offer", data));
      socket.on("answer", (data) => waitingSocket.emit("answer", data));

      waitingSocket.on("ice-candidate", (data) => socket.emit("ice-candidate", data));
      socket.on("ice-candidate", (data) => waitingSocket.emit("ice-candidate", data));

      waitingSocket = null;
    } else {
      waitingSocket = socket;
    }
  });

  socket.on("disconnect", () => {
    if (waitingSocket === socket) {
      waitingSocket = null;
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
