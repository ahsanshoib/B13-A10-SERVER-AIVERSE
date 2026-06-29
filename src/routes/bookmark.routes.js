import express from "express";
import Bookmark from "../models/Bookmark.js";
import Prompt from "../models/Prompt.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id });
    const promptIds = bookmarks.map((b) => b.promptId);
    const prompts = await Prompt.find({ _id: { $in: promptIds } });
    res.json({ success: true, prompts, bookmarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:promptId", authMiddleware, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      promptId: req.params.promptId,
      userId: req.user.id,
    });
    res.json({ success: true, bookmarked: !!bookmark });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { promptId } = req.body;
    const existing = await Bookmark.findOne({
      promptId,
      userId: req.user.id,
    });

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      await Prompt.findByIdAndUpdate(promptId, {
        $inc: { bookmarkCount: -1 },
      });
      return res.json({
        success: true,
        bookmarked: false,
        message: "Bookmark removed",
      });
    }

    await Bookmark.create({ promptId, userId: req.user.id });
    await Prompt.findByIdAndUpdate(promptId, {
      $inc: { bookmarkCount: 1 },
    });
    res.json({ success: true, bookmarked: true, message: "Bookmarked" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;