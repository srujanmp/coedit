const express = require("express");

const router = express.Router();

const File = require("../model/File");

router.get("/home", async (req, res) => {
  try {
    const userFiles = await File.find({ owner: req.user._id });
    res.render("home", { user: req.user, files: userFiles });
  } catch (err) {
    res.status(500).send("Error loading files");
  }
});

// New protected admin route
router.get("/admin/cook", (req, res) => {
  res.send("Welcome to the protected admin cook page!");
});

module.exports = router;
