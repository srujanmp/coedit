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
app.listen(3000, () => console.log("Server: http://localhost:3000"));
