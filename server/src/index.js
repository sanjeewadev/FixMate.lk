const dotenv = require("dotenv").config();  // Load env vars
const express = require("express");
const dbConnect = require("./config/dbConnect");

// Import all routes
const customerRoutes = require("./routes/customerRoutes");
const coordinatorRoutes = require("./routes/coordinatorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
// Connect to DB
dbConnect();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/customer", customerRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/technician", technicianRoutes);

// app.use("/api/technician", technicianRoutes); // if needed

// Start the server
const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});
