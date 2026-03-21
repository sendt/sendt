import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { verifyToken } from "./src/lib/auth";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Room: stream:{streamId}
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Yayına katıl
    socket.on("join-stream", (streamId: string) => {
      socket.join(`stream:${streamId}`);
      console.log(`Socket ${socket.id} joined stream:${streamId}`);
    });

    // Yayından ayrıl
    socket.on("leave-stream", (streamId: string) => {
      socket.leave(`stream:${streamId}`);
    });

    // Sohbet mesajı
    socket.on("chat-message", (data: { streamId: string; message: string; user: { id: string; displayName: string; username: string; avatar?: string } }) => {
      io.to(`stream:${data.streamId}`).emit("new-chat-message", {
        id: Date.now().toString(),
        streamId: data.streamId,
        userId: data.user.id,
        message: data.message,
        isSystem: false,
        createdAt: new Date(),
        user: data.user,
      });
    });

    // Teklif verildi (real-time broadcast)
    socket.on("bid-placed", (data: { streamId: string; auctionId: string; amount: number; bidder: { displayName: string } }) => {
      io.to(`stream:${data.streamId}`).emit("auction-update", {
        type: "bid",
        auctionId: data.auctionId,
        currentPrice: data.amount,
        bidder: data.bidder,
      });
    });

    // Açık artırma başladı
    socket.on("auction-started", (data: { streamId: string; auction: Record<string, unknown> }) => {
      io.to(`stream:${data.streamId}`).emit("auction-update", {
        type: "started",
        auction: data.auction,
      });
    });

    // Açık artırma bitti
    socket.on("auction-ended", (data: { streamId: string; auctionId: string; winner?: { displayName: string }; finalPrice: number }) => {
      io.to(`stream:${data.streamId}`).emit("auction-update", {
        type: "ended",
        auctionId: data.auctionId,
        winner: data.winner,
        finalPrice: data.finalPrice,
      });
    });

    // Viewer sayısı güncelle
    socket.on("viewer-count", (data: { streamId: string; count: number }) => {
      io.to(`stream:${data.streamId}`).emit("viewer-update", data.count);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  const PORT = parseInt(process.env.PORT || "3000", 10);
  httpServer.listen(PORT, () => {
    console.log(`> Canoapp server http://localhost:${PORT} adresinde çalışıyor`);
  });
});
