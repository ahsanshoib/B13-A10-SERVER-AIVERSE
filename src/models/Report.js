import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    promptId: { type: String, required: true },
    promptTitle: { type: String, required: true },
    reportedBy: { type: String, required: true },
    reporterEmail: { type: String, required: true },
    reason: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "dismissed", "warned", "removed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Report ||
  mongoose.model("Report", reportSchema);