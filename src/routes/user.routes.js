import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    const user = await db
      .collection("user")
      .findOne({ _id: new ObjectId(req.user.id) });
    await client.close();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/premium", authMiddleware, async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db
      .collection("user")
      .updateOne(
        { _id: new ObjectId(req.user.id) },
        { $set: { isPremium: true } }
      );
    await client.close();
    res.json({ success: true, message: "Upgraded to premium" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;