import express from "express";
import { securityMiddleware } from "./arcjet";
import { commentaryRouter } from "./routes/commentary.js";
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "0.0.0.0";

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.use(securityMiddleware());
app.use("/matches", matchRouter);
app.use("/matches/:id/commentary", commentaryRouter);

const { broadcastMatchCreated, broadcastMatchCommentary } =
  attachWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastMatchCommentary;

server.listen(PORT, HOST, () => {
  const baseUrl = HOST === "0.0.0.0" ? `localhost:${PORT}` : `${HOST}:${PORT}`;
  console.log(`Server running at http://${baseUrl}`);
  console.log(
    `WebSocket server running at ws://${baseUrl.replace("http", "ws")}/ws`,
  );
});
