const express = require("express");
const router = express.Router();
const File = require("../model/File");
const User = require("../model/User");

// Show form to create new file
router.get("/file/new", (req, res) => {
  res.render("new-file");
});

// Handle form submission to create a file
router.post("/file", async (req, res) => {
  try {
    const { title, header, body } = req.body;

    const newFile = await File.create({
      owner: req.user._id,
      title,
      header,
      body,
    });

    // Push file into user's files list
    await User.findByIdAndUpdate(req.user._id, {
      $push: { files: newFile._id },
    });

    res.redirect(`/file/${newFile._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create file");
  }
});
const isAuthorized = (file, user) =>
  file.owner.equals(user._id) || file.editors.includes(user.email);

// View file
router.get("/file/:id", async (req, res) => {
  const file = await File.findById(req.params.id).populate("owner");
  if (!file) return res.status(404).send("File not found");

  if (!isAuthorized(file, req.user) && file.viewMode === "private") {
    return res.status(403).render("error");
  }

  res.render("view-file", { file, user: req.user });
});

// Edit file body
router.post("/file/:id/edit", express.json(), async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ success: false });

  if (!isAuthorized(file, req.user)) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  file.body = req.body.body;
  await file.save();
  res.json({ success: true });
});



// Show "Add Editors" page
router.get("/file/:id/editors", async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");

  if (!file.owner.equals(req.user._id)) {
    return res.status(403).send("Only the owner can add editors");
  }

  res.render("add-editors", { file });
});

// Handle POST from Add Editors form
router.post("/file/:id/editors", async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");

  if (!file.owner.equals(req.user._id)) {
    return res.status(403).send("Only the owner can add editors");
  }

  const newEditorEmail = req.body.email?.toLowerCase().trim();

  if (!newEditorEmail) return res.status(400).send("Email required");

  if (!file.editors.includes(newEditorEmail)) {
    file.editors.push(newEditorEmail);
    await file.save();
  }

  res.redirect(`/file/${file._id}`);
});


// POST route to update viewMode - only owner can do this
router.post("/file/:id/viewmode", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).send("File not found");

    if (!file.owner.equals(req.user._id)) {
      return res.status(403).send("Only the owner can change view mode");
    }

    const { viewMode } = req.body;
    if (!["public", "private"].includes(viewMode)) {
      return res.status(400).send("Invalid view mode");
    }

    file.viewMode = viewMode;
    await file.save();

    res.redirect(`/file/${file._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// DELETE FILE (only owner)
router.post("/file/:id/delete", async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");

  if (!file.owner.equals(req.user._id)) {
    return res.status(403).send("Only the owner can delete the file");
  }

  await file.deleteOne();
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { files: file._id }
  });

  res.redirect("/");
});

// REMOVE EDITOR (only owner)
router.post("/file/:id/editors/delete", async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");

  if (!file.owner.equals(req.user._id)) {
    return res.status(403).send("Only the owner can remove editors");
  }

  const editorToRemove = req.body.email?.toLowerCase().trim();
  if (!editorToRemove) return res.status(400).send("Email required");

  file.editors = file.editors.filter(email => email !== editorToRemove);
  await file.save();

  res.redirect(`/file/${file._id}/editors`);
});


module.exports = router;
