import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { connectDB, getDB } from "./db/mongo";
import projectsRouter from "./routes/projects";
import runsRouter from "./routes/runs";
import eventsRouter from "./routes/events";
import intelligenceRouter from "./routes/intelligence";
import authRouter from "./routes/auth";
import mcpRouter from "./routes/mcp";
import oauthRouter from "./routes/oauth";

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/projects", projectsRouter);
app.use("/runs", runsRouter);
app.use("/events", eventsRouter);
app.use("/intelligence", intelligenceRouter);
app.use("/auth", authRouter);
app.use("/", oauthRouter);
app.use("/", mcpRouter);

async function startChangeStreamListener() {
  const db = getDB();
  const eventsCol = db.collection("events");
  
  // Watch for new events and push to dashboard via Socket.IO
  const changeStream = eventsCol.watch([], { fullDocument: "updateLookup" });
  changeStream.on("change", (change) => {
    if (change.operationType === "insert" && change.fullDocument) {
      io.emit("event:created", change.fullDocument);
      io.emit("event:new", change.fullDocument);
      console.log("📡 Change stream → socket.io:", change.fullDocument._id);
    }
    if (change.operationType === "update") {
      io.emit("run:updated", change.documentKey);
    }
  });
  
  // Also watch runs collection for status updates
  const runsCol = db.collection("runs");
  const runsStream = runsCol.watch([], { fullDocument: "updateLookup" });
  runsStream.on("change", (change) => {
    if (change.operationType === "update" && change.fullDocument) {
      io.emit("run:updated", change.fullDocument);
    }
    if (change.operationType === "insert" && change.fullDocument) {
      io.emit("run:created", change.fullDocument);
      io.emit("run:new", change.fullDocument);
    }
  });
  
  console.log("👁️  Change stream listeners active");
}

io.on("connection", (socket) => {
  console.log("🔌 Dashboard client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔌 Dashboard client disconnected:", socket.id);
  });
});

const PORT = parseInt(process.env.PORT || "3001");

async function main() {
  await connectDB();
  await startChangeStreamListener();
  httpServer.listen(PORT, () => {
    console.log(`🚀 CONTINUUM API running on port ${PORT}`);
  });
}

main().catch(console.error);
