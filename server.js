const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI =
  "mongodb+srv://divya:seceai-ds%402023@cluster0.8eg9o.mongodb.net/udemy";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Course Schema
const courseSchema = new mongoose.Schema({
  course_id: String,
  course_title: String,
  url: String,
  is_paid: Boolean,
  price: Number,
  num_subscribers: Number,
  num_reviews: Number,
  num_lectures: Number,
  level: String,
  content_duration: Number,
  published_timestamp: Date,
  subject: String,
});

const Course = mongoose.model("Course", courseSchema, "course");

// Routes
app.get("/api/courses", async (req, res) => {
  try {
    const { search, level, subject, minPrice, maxPrice, isPaid, sortPrice } =
      req.query;
    let query = {};

    // Add search functionality
    if (search) {
      query.course_title = { $regex: new RegExp(search, "i") };
    }

    // Subject filter
    if (subject) {
      query.subject = { $regex: new RegExp(`^${subject}$`, "i") };
    }

    // Level filter
    if (level) {
      query.level = level;
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Paid/Free filter
    if (isPaid !== undefined) {
      query.is_paid = isPaid === "true";
    }

    // Sort options
    const sortOption = {};
    if (sortPrice) {
      sortOption.price = sortPrice === "asc" ? 1 : -1;
    }

    const courses = await Course.find(query).sort(sortOption);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await Course.distinct("subject");
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/levels", async (req, res) => {
  try {
    const levels = await Course.distinct("level");
    res.json(levels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get price ranges for filtering
app.get("/api/price-ranges", async (req, res) => {
  try {
    const priceStats = await Course.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgPrice: { $avg: "$price" },
        },
      },
    ]);
    res.json(priceStats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get subjects with course counts
app.get("/api/subjects-with-counts", async (req, res) => {
  try {
    const subjectCounts = await Course.aggregate([
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { count: -1 } },
    ]);
    res.json(subjectCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
