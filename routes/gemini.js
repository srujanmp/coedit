const express = require("express");
const router = express.Router();
const gemini = require("../utils/gemini.js"); // adjust path if needed
const File = require("../model/File");

// Route: POST /file/:id/gemini
router.post("/file/:id/gemini", async (req, res) => {
  const fileId = req.params.id;
  const { prompt, body } = req.body;

  try {
    const result = await gemini(prompt, body);

    // If Gemini returns "no_function", do nothing, stay on page
    if (result === "no_function") {
      return res.redirect(`/file/${fileId}`);
    }

    // Else update file in DB (assuming Mongoose or similar)
    await File.findByIdAndUpdate(fileId, { body: result });

    // Redirect back to editor with updated text
    return res.redirect(`/file/${fileId}`);
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).send("Error processing Gemini.");
  }
});

module.exports = router;
