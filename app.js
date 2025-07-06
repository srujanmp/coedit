const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB: connected"))
  .catch((err) => console.error("MongoDB: connection error:", err));

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const setupPassport = require("./utils/passport");
const bodyParser = require("body-parser");

const app = express();

const server = http.createServer(app); //  create raw server
const io = new Server(server); //  initialize socket server

// Share io globally if needed
app.set("io", io);

// Track users per file room
const fileUsersMap = {}; // { fileId: [ { socketId, name } ] }

count=0;

// Utility function to broadcast total user count to all clients
function broadcastUserCount() {
  io.emit("total-users", count); // sends to everyone
}

io.on("connection", (socket) => {
  // console.log("+");
  count++;
  broadcastUserCount();

  socket.on("join-file", ({ fileId, userName }) => {
    socket.join(fileId);
    socket.fileId = fileId;
    socket.userName = userName;

    // Add user to the room map
    if (!fileUsersMap[fileId]) fileUsersMap[fileId] = [];
    fileUsersMap[fileId].push({ socketId: socket.id, name: userName });

    // Notify all users in the room
    io.to(fileId).emit(
      "users-update",
      fileUsersMap[fileId].map((u) => u.name)
    );
  });

  socket.on("edit-body", ({ fileId, newBody }) => {
    socket.to(fileId).emit("body-updated", newBody);
  });

  socket.on("disconnect", () => {
    const fileId = socket.fileId;
    const name = socket.userName;

    if (fileId && fileUsersMap[fileId]) {
      fileUsersMap[fileId] = fileUsersMap[fileId].filter(
        (u) => u.socketId !== socket.id
      );
      io.to(fileId).emit(
        "users-update",
        fileUsersMap[fileId].map((u) => u.name)
      );
    }

    // console.log("-");
    count--;
    broadcastUserCount(); // update everyone on disconnect
  });
});

// Setup EJS
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Passport setup
setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

const adminRoutes = require("./routes/admin");
app.use(ensureAuth, adminRoutes);
const editRoutes = require("./routes/edit");
app.use(ensureAuth, editRoutes);

// Middleware to check authentication
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// Start server
server.listen(3000, () => console.log("Server: http://localhost:3000"));
