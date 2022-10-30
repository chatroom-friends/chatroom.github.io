const PORT = process.env.PORT || 2138;
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const moment = require("moment");
const connectedUsers = {};

app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) => {
  socket.on("disconnect", function () {
    const userData = connectedUsers[socket.id];
    if (typeof userData !== "undefined") {
      socket.leave(connectedUsers[socket.id]);
      io.to(userData.room).emit("message", {
        username: "Chatroom Sysetm",
        text: userData.username + " left the room channel!",
        timestamp: moment().valueOf(),
      });
      delete connectedUsers[socket.id];
    }
  });

  socket.on("joinRoom", (req, callback) => {
    if (
      req.room.replace(/\s/g, "").length > 0 &&
      req.username.replace(/\s/g, "").length > 0
    ) {
      let nameTaken = false;

      Object.keys(connectedUsers).forEach(function (socketId) {
        var userInfo = connectedUsers[socketId];
        if (userInfo.username.toUpperCase() === req.username.toUpperCase()) {
          nameTaken = true;
        }
      });

      if (nameTaken) {
        callback({
          nameAvailable: false,
          error: "This name is already taken.",
        });
      } else {
        connectedUsers[socket.id] = req;
        socket.join(req.room);
        socket.broadcast.to(req.room).emit("message", {
          username: "Chatroom System",
          text: req.username + " joined the room!",
          timestamp: moment().valueOf(),
        });
        callback({
          nameAvailable: true,
        });
      }
    } else {
      callback({
        nameAvailable: false,
        error: "Please provide a username and room code",
      });
    }
  });

  socket.on("message", async (message) => {
    message.text = parse(message.text);
    io.to(connectedUsers[socket.id].room).emit("message", message);
  });

  socket.emit("message", {
    username: "Chatroom System",
    text: "Hello there! This is a private chatroom. You can give the room code to other people for them to join!",
    timestamp: moment().valueOf(),
  });
});

app.use((req, res) => {
  res.status(404).sendFile(process.cwd() + "/public/404.html");
});

http.listen(PORT, () => {
  console.log("Server started at port", PORT);
});

function parse(text) {
  return text
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/ /g, "&nbsp;")
    .replace(/\n/g, "<br>")
    .replace(
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
      (x) =>
        [".gif", ".png", ".jpg", ".jpeg"].some((y) =>
          x.toLowerCase().split("?")[0].endsWith(y)
        )
          ? `<img src="${x}" class="resize">`
          : `<a href="${x.slice(0, -1)}" target="_blank">${x}</a> `
    )
    .replace(/~~.*?~~/g, (x) => `<s>${x.slice(2, -2)}</s>`)
    .replace(/__.*?__/g, (x) => `<u>${x.slice(2, -2)}</u>`)
    .replace(
      /\*\*.*?\*\*/g,
      (x) => `<strong style="font-weight:bold">${x.slice(2, -2)}</strong>`
    )
    .replace(/\*.*?\*/g, (x) => `<i>${x.slice(1, -1)}</i>`)
    .replace(/\|\|.*?\|\|/g, (x) => `<a class="spoiler">${x.slice(2, -2)}</a>`);
}
