const express = require("express");

const router = express.Router();

// New protected admin route
router.get("/admin/cook2", (req, res) => {
  res.send("Welcome to the protected admin cook page!");
});

module.exports = router;
