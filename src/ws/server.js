import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet";

const matchSubscribers = new Map();

function subscribeToMatch(matchId, socket) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId).add(socket);
}

function unsubscribeFromMatch(matchId, socket) {
  if (!matchSubscribers.has(matchId)) return;

  matchSubscribers.get(matchId).delete(socket);

  if (matchSubscribers.size === 0) {
    matchSubscribers.delete(matchId);
  }
}

function cleanUpMatchSubscriptions(socket) {
  for (const matchId of socket.subscriptions) {
    unsubscribeFromMatch(matchId, socket);
  }
}

function sendJson(socket, payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("Socket is not open");
    return;
  }
  socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss, payload) {
  console.log("Broadcasting to all clients:", payload.type);
  try {
    const message = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState !== WebSocket.OPEN) continue;
      client.send(message);
    }
  } catch (error) {
    console.error("Broadcast error:", error);
  }
}

function broadcastToMatch(matchId, payload) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers || subscribers.size === 0) return;

  try {
    const message = JSON.stringify(payload);
    for (const client of subscribers) {
      if (client.readyState !== WebSocket.OPEN) continue;
      client.send(message);
    }
  } catch (error) {
    console.error("Broadcast to match error:", error);
  }
}

function handleMessage(socket, data) {
  let message;
  try {
    message = JSON.parse(data.toString());
  } catch (error) {
    sendJson(socket, { type: "error", message: "Invalid json format" });
    return;
  }

  if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
    subscribeToMatch(message.matchId, socket);
    socket.subscriptions.add(message.matchId);
    sendJson(socket, { type: "subscribed", matchId: message.matchId });
    return;
  }

  if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
    unsubscribeFromMatch(message.matchId, socket);
    socket.subscriptions.delete(message.matchId);
    sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
    return;
  }

  export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
      server,
      path: "/ws",
      maxPayload: 1024 * 1024,
    });
    wss.on("connection", async (socket, req) => {
      // Buffer messages received during async checks
      const messageBuffer = [];
      const bufferHandler = (data) => messageBuffer.push(data);
      socket.on("message", bufferHandler);
      if (wsArcjet) {
        try {
          // Inject a default User-Agent if missing to prevent Arcjet DetectBot rule failure
          if (!req.headers["user-agent"]) {
            req.headers["user-agent"] = "liveboard-ws-client";
          }
          const decision = await wsArcjet.protect(req);
          if (decision.isDenied()) {
            socket.off("message", bufferHandler);
            const code = decision.reason.isRateLimit() ? 1013 : 1008;
            const reason = decision.reason.isRateLimit()
              ? "Rate Limit Exceeded"
              : "Forbidden";
            socket.close(code, reason);
            return;
          }
        } catch (error) {
          console.log("ws connection error", error);
          socket.off("message", bufferHandler);
          socket.close(1011, "Internal Server Error");
          return;
        }
      }
      // Remove buffer handler and attach real handler
      socket.off("message", bufferHandler);

      socket.isAlive = true;
      socket.on("pong", () => {
        socket.isAlive = true;
      });

      socket.subscriptions = new Set();
      sendJson(socket, { type: "welcome" });

      socket.on("message", (data) => handleMessage(socket, data));

      socket.on("error", () => {
        socket.terminate();
      });

      socket.on("close", () => {
        cleanUpMatchSubscriptions(socket);
      });

      socket.on("WebSocket error:", console.error);

      // Process buffered messages
      if (messageBuffer.length > 0) {
        for (const data of messageBuffer) {
          handleMessage(socket, data);
        }
      }
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
      broadcastToAll(wss, { type: "match_created", data: match });
    }

    function broadcastMatchCommentary(matchId, comments) {
      broadcastToMatch(matchId, { type: "commentary", data: comments });

      return {
        broadcastMatchCreated,
        broadcastMatchCommentary,
      };
    }
  }
}
