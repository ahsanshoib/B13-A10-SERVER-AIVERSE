import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../src/config/db.js";
import promptRoutes from "../src/routes/prompt.routes.js";
import reviewRoutes from "../src/routes/review.routes.js";
import bookmarkRoutes from "../src/routes/bookmark.routes.js";
import paymentRoutes from "../src/routes/payment.routes.js";
import reportRoutes from "../src/routes/report.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import adminRoutes from "../src/routes/admin.routes.js";

dotenv.config();

const app = express();


app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());


connectDB();


app.use("/api/prompts", promptRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AIVERSE API Server is running successfully!",
    version: "1.0.0",
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

const PORT = process.env.PORT || 5000;


if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;