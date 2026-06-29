import mongoose from "mongoose";

const promptSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    aiTool: { type: String, required: true },
    tags: [{ type: String }],
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Pro"],
      required: true,
    },
    thumbnail: { type: String, default: "" },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isFeatured: { type: Boolean, default: false },
    copyCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    rejectionFeedback: { type: String, default: "" },
    creatorId: { type: String, required: true },
    creatorName: { type: String, required: true },
    creatorEmail: { type: String, required: true },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Prompt ||
  mongoose.model("Prompt", promptSchema);