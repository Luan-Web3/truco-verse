// server.ts
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// Configuração do socket
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // frontend
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`Novo cliente conectado: ${socket.id}`);

  // Evento customizado: jogador entrou
  socket.on("join_game", (roomId: string) => {
    socket.join(roomId);
    console.log(`Jogador ${socket.id} entrou na sala ${roomId}`);
    io.to(roomId).emit("player_joined", socket.id);
  });

  // Evento customizado: jogada
  socket.on("play_card", (data) => {
    console.log("Jogada recebida:", data);
    io.to(data.roomId).emit("card_played", data);
  });

  // Desconexão
  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

server.listen(4000, () => {
  console.log("Servidor Socket rodando em http://localhost:4000");
});
