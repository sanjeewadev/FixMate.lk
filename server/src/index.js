const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/dbConnect");

// Import routes
const customerRoutes = require("./routes/customerRoutes");
const coordinatorRoutes = require("./routes/coordinatorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const technicianRoutes = require("./routes/technicianRoutes");

// NEW: services routes
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const technicianJobRoutes = require('./routes/technicianJobRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const publicApplyRoutes = require('./routes/publicApplyRoutes');
const technicianViewsRoutes = require("./routes/technicianViewsRoutes");


// Connect to MongoDB
dbConnect();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/customer", customerRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/technician", technicianRoutes);

// NEW: mount services API
app.use("/api", serviceRoutes);
app.use("/api", bookingRoutes);
app.use('/api', technicianJobRoutes);
app.use('/api', ratingRoutes);
app.use('/api', chatRoutes);
app.use('/api', complaintRoutes);
app.use('/api', publicApplyRoutes);
app.use("/api", technicianViewsRoutes);

// Start server
const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at port ${PORT}`);
});
