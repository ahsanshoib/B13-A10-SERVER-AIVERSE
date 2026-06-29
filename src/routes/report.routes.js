import express from "express";
import Report from "../models/Report.js";
import Prompt from "../models/Prompt.js";
import authMiddleware from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      const reports = await Report.find().sort({ createdAt: -1 });
      res.json({ success: true, reports });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { promptId, promptTitle, reason, description } = req.body;
    const report = await Report.create({
      promptId,
      promptTitle,
      reportedBy: req.user.name,
      reporterEmail: req.user.email,
      reason,
      description,
    });
    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put(
  "/:id",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      const { status, action } = req.body;
      if (action === "remove") {
        const report = await Report.findById(req.params.id);
        await Prompt.findByIdAndDelete(report.promptId);
        await Report.findByIdAndUpdate(req.params.id, {
          status: "removed",
        });
        return res.json({ success: true, message: "Prompt removed" });
      }
      const report = await Report.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      res.json({ success: true, report });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;