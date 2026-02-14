require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

// Import controllers
const {
  detectItems,
  detectFreshness,
} = require("./controllers/detectionController");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001;

// CORS middleware - allow requests from frontend, local network, and Cloudflare tunnels
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost and local network IPs
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
      ];
      
      // Allow any origin from local network (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      // OR any Cloudflare tunnel domain (*.trycloudflare.com)
      if (
        origin.match(/^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}):\d+$/) ||
        origin.match(/^https:\/\/.*\.trycloudflare\.com$/) ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Requests logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Root route - Health check
app.get("/", (req, res) => {
  res.json({
    message: "Grocery Vision API is running",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Multer error handler
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`❌ Multer error: ${err.code}`, err);

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "File too large. Maximum size is 10MB.",
      });
    }

    return res.status(400).json({
      error: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    console.error("❌ Upload error:", err.message);
    return res.status(400).json({ error: err.message });
  }

  next();
};

// API routes
app.post(
  "/api/detect-items",
  upload.single("image"),
  handleUploadErrors,
  detectItems
);

app.post(
  "/api/detect-freshness",
  upload.single("image"),
  handleUploadErrors,
  detectFreshness
);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  console.error(err.stack);

  // Handle specific API key errors
  if (
    err.message &&
    (err.message.includes("API key") ||
      err.message.includes("authentication") ||
      err.message.includes("403"))
  ) {
    return res.status(401).json({
      error: "API key issue. Please check your Gemini API key.",
      details: err.message,
      status: "error",
    });
  }

  // Return appropriate status code and error message
  res.status(500).json({
    error: err.message || "Internal server error",
    status: "error",
  });
});

// Start server - listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Local: http://localhost:${PORT}`);
  
  // Display all network addresses
  console.log(`\n📱 Access from your phone using any of these addresses:`);
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((interface) => {
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`   http://${interface.address}:${PORT}`);
      }
    });
  });
  
  console.log(`\n📁 Uploads directory: ${uploadsDir}`);
});
