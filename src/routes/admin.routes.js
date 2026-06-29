import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import Prompt from "../models/Prompt.js";
import Review from "../models/Review.js";
import Payment from "../models/Payment.js";
import authMiddleware from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";

const router = express.Router();


router.get(
  "/users",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db();
      const users = await db
        .collection("user")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      await client.close();
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);


router.put(
  "/users/:id",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      const { role } = req.body;
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db();
      await db
        .collection("user")
        .updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { role } }
        );
      await client.close();
      res.json({ success: true, message: "Role Updated" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);


router.delete(
  "/users/:id",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db();
      await db
        .collection("user")
        .deleteOne({ _id: new ObjectId(req.params.id) });
      await client.close();
      res.json({ success: true, message: "User Deleted" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);


router.get(
  "/prompts",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      const prompts = await Prompt.find().sort({ createdAt: -1 });
      res.json({ success: true, prompts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);


router.put(
  "/prompts/:id",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      const { status, isFeatured, rejectionFeedback } = req.body;
      const updateData = {};
      if (status) updateData.status = status;
      if (typeof isFeatured === "boolean")
        updateData.isFeatured = isFeatured;
      if (rejectionFeedback)
        updateData.rejectionFeedback = rejectionFeedback;

      const prompt = await Prompt.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
      res.json({ success: true, prompt });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);


router.delete(
  "/prompts/:id",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      await Prompt.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Deleted" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);


router.get(
  "/analytics",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db();
      const totalUsers = await db.collection("user").countDocuments();
      await client.close();

      const totalPrompts = await Prompt.countDocuments();
      const totalReviews = await Review.countDocuments();
      const payments = await Payment.find();
      const totalRevenue = payments.reduce(
        (sum, p) => sum + p.amount,
        0
      );

      
      const copyAggregation = await Prompt.aggregate([
        { $group: { _id: null, totalCopies: { $sum: "$copyCount" } } },
      ]);
      const totalCopies = copyAggregation[0]?.totalCopies || 0;

      const engineDistribution = await Prompt.aggregate([
        { $match: { status: "approved" } },
        {
          $group: {
            _id: "$aiTool",
            count: { $sum: 1 },
            totalCopies: { $sum: "$copyCount" },
          },
        },
      ]);

      res.json({
        success: true,
        analytics: {
          totalUsers,
          totalPrompts,
          totalReviews,
          totalCopies,
          totalRevenue,
          engineDistribution,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);


router.get(
  "/creator-analytics",
  authMiddleware,
  async (req, res) => {
    try {
      const prompts = await Prompt.find({ creatorId: req.user.id });
      const totalPrompts = prompts.length;
      const totalCopies = prompts.reduce(
        (sum, p) => sum + p.copyCount,
        0
      );
      const totalBookmarks = prompts.reduce(
        (sum, p) => sum + p.bookmarkCount,
        0
      );

      
      const growthData = await Prompt.aggregate([
        { $match: { creatorId: req.user.id } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            totalCopies: { $sum: "$copyCount" },
            totalPrompts: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        success: true,
        analytics: {
          totalPrompts,
          totalCopies,
          totalBookmarks,
          prompts,
          growthData,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;