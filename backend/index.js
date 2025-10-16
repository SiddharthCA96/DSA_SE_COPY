import express from "express";
import cors from "cors";
import allRoutes from "./routes/route.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Backend running");
});
// Routes
app.use("/api/auth", allRoutes);

// Start the server only when NOT running on Vercel (serverless)
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}