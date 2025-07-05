const express = require('express');
const router = express.Router();
const File = require('../model/File');
const User = require('../model/User');

// Show form to create new file
router.get('/file/new', (req, res) => {
  res.render('new-file');
});

// Handle form submission to create a file
router.post('/file', async (req, res) => {
  try {
    const { title, header, body } = req.body;

    const newFile = await File.create({
      owner: req.user._id,
      title,
      header,
      body
    });

    // Push file into user's files list
    await User.findByIdAndUpdate(req.user._id, {
      $push: { files: newFile._id }
    });

    res.redirect(`/file/${newFile._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create file');
  }
});

// Show file and form to edit body
router.get('/file/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id).populate('owner');
    if (!file) return res.status(404).send('File not found');

    res.render('view-file', { file });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading file');
  }
});

router.post('/file/:id/edit', express.json(), async (req, res) => {
  try {
    const { body } = req.body;

    const updated = await File.findByIdAndUpdate(
      req.params.id,
      { body },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, error: 'File not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


module.exports = router;
