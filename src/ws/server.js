import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet";

function sendJson(socket, payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("Socket is not open");
    return;
  }
  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });
  wss.on("connection", async (socket, req) => {
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit()
            ? "Rate Limit Exceeded"
            : "Forbidden";
          socket.close(code, reason);
          return;
        }
      } catch (error) {
        console.log("ws connection error", error);
        socket.close(1011, "Internal Server Error");
        return;
      }
    }
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    sendJson(socket, { type: "welcome" });

    socket.on("WebSocket error:", console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  function broadcastMatchCreated(match) {
    broadcast(wss, { type: "match_created", data: match });

    return {
      broadcastMatchCreated,
    };
  }
}
