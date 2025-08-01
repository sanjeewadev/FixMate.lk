const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/dbConnect");

// Import routes
const customerRoutes = require("./routes/customerRoutes");
const coordinatorRoutes = require("./routes/coordinatorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const technicianRoutes = require("./routes/technicianRoutes");

// Connect to MongoDB
dbConnect();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // your React dev server
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/customer", customerRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/technician", technicianRoutes);

// Start server
const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at port ${PORT}`);
});
