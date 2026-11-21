import express from "express";
import cors from "cors";
import ingestRoutes from "./routes/ingest.routes";
import overviewRoutes from "./routes/overview.routes";
import timeseriesRoutes from "./routes/timeseries.routes";
import issueRoutes from "./routes/issue.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/timeseries", timeseriesRoutes);
app.use("/api/issues", issueRoutes);

export default app;
