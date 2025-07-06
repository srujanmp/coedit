const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    editors: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    title: { type: String, required: true },
    header: String,
    body: String,
    viewMode: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
