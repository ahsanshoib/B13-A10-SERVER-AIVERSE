import express from "express";
import Review from "../models/Review.js";
import Prompt from "../models/Prompt.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { promptId, userId } = req.query;
    let query = {};
    if (promptId) query.promptId = promptId;
    if (userId) query.userId = userId;
    const reviews = await Review.find(query).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { promptId, rating, comment } = req.body;

    const existing = await Review.findOne({
      promptId,
      userId: req.user.id,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Already reviewed",
      });
    }

    const review = await Review.create({
      promptId,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      rating,
      comment,
    });

    const reviews = await Review.find({ promptId });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Prompt.findByIdAndUpdate(promptId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;