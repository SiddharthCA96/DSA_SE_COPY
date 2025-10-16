import express from "express";
import cors from "cors";
import allRoutes from "./routes/route.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", allRoutes);

// Start the server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
