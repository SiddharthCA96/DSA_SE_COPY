import express from "express";
import allRoutes from "./routes/route.js";

const app = express();

// --------------------
// CORS setup
// --------------------
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://dsa-se-copyfrontend.vercel.app",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") return res.sendStatus(200);

  next();
});

// --------------------
// Body parser
// --------------------
app.use(express.json());

// --------------------
// Test route
// --------------------
app.get("/", (req, res) => res.status(200).send("Backend running"));

// --------------------
// Routes
// --------------------
app.use("/api/auth", allRoutes);

// --------------------
// Start server locally only
// --------------------
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// --------------------
// Export app for Vercel serverless
// --------------------
export default app;
