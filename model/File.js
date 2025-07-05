const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    header: String,
    body: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("File", fileSchema);
