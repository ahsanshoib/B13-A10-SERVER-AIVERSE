import express from "express";
import Payment from "../models/Payment.js";
import authMiddleware from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleCheck("admin"),
  async (req, res) => {
    try {
      const payments = await Payment.find().sort({ createdAt: -1 });
      res.json({ success: true, payments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, error: "STRIPE KEY IS NOT COFIGURED" });
    }

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    if (paymentIntent.status === "succeeded") {
      await Payment.create({
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email,
        transactionId: paymentIntent.id,
        amount: 5,
      });

      return res.json({
        success: true,
        message: "Payment successful",
        transactionId: paymentIntent.id,
      });
    }

    res.status(400).json({ success: false, error: "Payment failed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/simulate", authMiddleware, async (req, res) => {
  try {
    const transactionId = "sim_" + Date.now();
    await Payment.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      transactionId,
      amount: 5,
    });
    res.json({
      success: true,
      message: "Simulated payment successful",
      transactionId,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;