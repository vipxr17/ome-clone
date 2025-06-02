const express = require("express");
const http = require("http");
const path = require("path");
const socket = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socket(server);

app.use(express.static(path.join(__dirname, "../client")));

let waitingUsers = [];
let activePairs = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("ready", () => {
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.shift();

      activePairs.set(socket.id, partner.id);
      activePairs.set(partner.id, socket.id);

      socket.emit("matched", true);
      partner.emit("matched", false);

      socket.on("offer", (data) => {
        if (io.sockets.sockets.get(partner.id)) {
          partner.emit("offer", data);
        }
      });

      partner.on("answer", (data) => {
        if (io.sockets.sockets.get(socket.id)) {
          socket.emit("answer", data);
        }
      });

      socket.on("ice-candidate", (data) => {
        if (io.sockets.sockets.get(partner.id)) {
          partner.emit("ice-candidate", data);
        }
      });

      partner.on("ice-candidate", (data) => {
        if (io.sockets.sockets.get(socket.id)) {
          socket.emit("ice-candidate", data);
        }
      });
    } else {
      waitingUsers.push(socket);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    waitingUsers = waitingUsers.filter((s) => s.id !== socket.id);

    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partner = io.sockets.sockets.get(partnerId);
      if (partner) {
        partner.disconnect(true);
      }
      activePairs.delete(socket.id);
      activePairs.delete(partnerId);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
