import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "CampusCare backend is running" });
});

const start = async () => {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/campuscare";
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.warn("MongoDB connection failed (server will still start):", err.message);
  }
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
