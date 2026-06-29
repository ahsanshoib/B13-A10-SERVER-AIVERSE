import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    promptId: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Bookmark ||
  mongoose.model("Bookmark", bookmarkSchema);