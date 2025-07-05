const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config();

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB: connected'))
  .catch(err => console.error('MongoDB: connection error:', err));

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const setupPassport = require('./utils/passport');
const bodyParser = require("body-parser");

const app = express();

const server = http.createServer(app); //  create raw server
const io = new Server(server);         //  initialize socket server

// Share io globally if needed
app.set('io', io);

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('User connected');

  // Join room for specific file ID
  socket.on('join-file', (fileId) => {
    socket.join(fileId);
  });

  // Handle body change
  socket.on('edit-body', ({ fileId, newBody }) => {
    // Broadcast to everyone else in the room
    socket.to(fileId).emit('body-updated', newBody);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});




// Setup EJS
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Passport setup
setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);


const adminRoutes = require('./routes/admin');
app.use(ensureAuth,adminRoutes);
const editRoutes = require('./routes/edit');
app.use(ensureAuth,editRoutes);


// Middleware to check authentication
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// Start server
server.listen(3000, () => console.log("Server: http://localhost:3000"));
