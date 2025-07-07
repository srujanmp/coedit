const http = require("http");
const { Server } = require("socket.io");
const File = require("./model/File");
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

count = 0;

// Utility function to broadcast total user count to all clients
function broadcastUserCount() {
  io.emit("total-users", count); // sends to everyone
}

io.on("connection", (socket) => {
  count++;
  broadcastUserCount();

socket.on("join-file", async ({ fileId, userName, userEmail }) => {
  const file = await File.findById(fileId);
  if (!file) return;

  const sessionUser = socket.request.session?.passport?.user;
  const sessionUserId = typeof sessionUser === "string" ? sessionUser : sessionUser?._id?.toString();

  const isAllowed =
    file.viewMode === "public" ||
    file.editors.includes(userEmail?.toLowerCase()) ||
    file.owner.toString() === sessionUserId;

  if (!isAllowed) {
    socket.emit("access-denied");
    return;
  }

  socket.join(fileId);
  socket.fileId = fileId;
  socket.userName = userName;
  socket.userEmail = userEmail?.toLowerCase();

  if (!fileUsersMap[fileId]) fileUsersMap[fileId] = [];
  fileUsersMap[fileId].push({ socketId: socket.id, name: userName });

  io.to(fileId).emit(
    "users-update",
    fileUsersMap[fileId].map((u) => u.name)
  );
});

socket.on("edit-body", async ({ fileId, newBody }) => {
  const file = await File.findById(fileId);
  const sessionUser = socket.request.session?.passport?.user;
  const sessionUserId = typeof sessionUser === "string" ? sessionUser : sessionUser?._id?.toString();
  const userEmail = socket.userEmail;

  const isOwner = file && file.owner.toString() === sessionUserId;
  const isEditor = file && file.editors.includes(userEmail);

  if (isOwner || isEditor) {
    io.to(fileId).emit("body-updated", newBody); // ✅ emit to all in room
  } else {
    console.warn(`Denied edit-body for socket ${socket.id}:`, {
      fileId,
      userEmail,
      sessionUserId,
    });
  }
});


  socket.on("disconnect", () => {
    const fileId = socket.fileId;
    if (fileUsersMap[fileId]) {
      fileUsersMap[fileId] = fileUsersMap[fileId].filter(
        (u) => u.socketId !== socket.id
      );
      io.to(fileId).emit(
        "users-update",
        fileUsersMap[fileId].map((u) => u.name)
      );
    }
    count--;
    broadcastUserCount();
  });
});

// Setup EJS
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);
// Passport setup
setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// Attach session to Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Mount routes
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

const adminRoutes = require("./routes/admin");
app.use(ensureAuth, adminRoutes);
const editRoutes = require("./routes/edit");
app.use(ensureAuth, editRoutes);
const geminiRoutes = require("./routes/gemini");
app.use(ensureAuth, geminiRoutes);

// Middleware to check authentication
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// Start server
server.listen(3000, () => console.log("Server: http://localhost:3000"));
