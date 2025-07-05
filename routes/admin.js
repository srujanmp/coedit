const express = require("express");

const router = express.Router();


router.get('/home', (req, res) => {
    //console.log(req.user)
    res.render('home', { user: req.user });
});

// New protected admin route
router.get("/admin/cook", (req, res) => {
  res.send("Welcome to the protected admin cook page!");
});

module.exports = router;
