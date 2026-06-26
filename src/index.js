import express from "express";
import { securityMiddleware } from "./arcjet";
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "0.0.0.0";

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.use(securityMiddleware());

const { broadcastMatchCreated } = attachWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl = HOST === "0.0.0.0" ? `localhost:${PORT}` : `${HOST}:${PORT}`;
  console.log(`Server running at http://${baseUrl}`);
  console.log(
    `WebSocket server running at ws://${baseUrl.replace("http", "ws")}/ws`,
  );
});
