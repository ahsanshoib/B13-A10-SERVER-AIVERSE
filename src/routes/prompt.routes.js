import express from "express";
import Prompt from "../models/Prompt.js";
import authMiddleware from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";

const router = express.Router();

// GET all prompts with search/filter/sort/pagination
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      aiTool = "",
      difficulty = "",
      sort = "latest",
      page = 1,
      limit = 12,
      featured = "",
    } = req.query;

    let query = { status: "approved" };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { aiTool: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "All") query.category = category;
    if (aiTool && aiTool !== "All") query.aiTool = aiTool;
    if (difficulty && difficulty !== "All") query.difficulty = difficulty;
    if (featured === "true") query.isFeatured = true;

    let sortOption = {};
    if (sort === "latest") sortOption = { createdAt: -1 };
    else if (sort === "popular") sortOption = { averageRating: -1 };
    else if (sort === "copied") sortOption = { copyCount: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Prompt.countDocuments(query);
    const prompts = await Prompt.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      prompts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single prompt
router.get("/:id", async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    res.json({ success: true, prompt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create prompt
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole === "user") {
      const count = await Prompt.countDocuments({
        creatorId: req.user.id,
      });
      if (count >= 3) {
        return res.status(403).json({
          success: false,
          error: "Free users can only add 3 prompts",
        });
      }
    }

    const prompt = await Prompt.create({
      ...req.body,
      creatorId: req.user.id,
      creatorName: req.user.name,
      creatorEmail: req.user.email,
      status: "pending",
      copyCount: 0,
    });

    res.status(201).json({ success: true, prompt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update prompt
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    if (
      prompt.creatorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    const updated = await Prompt.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, prompt: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE prompt
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    if (
      prompt.creatorId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    await Prompt.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST copy count
router.post("/:id/copy", authMiddleware, async (req, res) => {
  try {
    const prompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      { $inc: { copyCount: 1 } },
      { new: true }
    );
    res.json({ success: true, copyCount: prompt.copyCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;