// server.ts
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// Configuração do socket
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // frontend
    methods: ["GET", "POST"]
  }
});

function getRandomUniqueNumbers(count: number, min: number, max: number): number[] {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(randomNum);
  }
  return Array.from(numbers);
}

io.on("connection", (socket) => {
  console.log(`Novo cliente conectado: ${socket.id}`);

  // Evento customizado: jogador entrou
  socket.on("join_game", (roomId: string) => {
    socket.join(roomId);
    io.to(roomId).emit("player_joined", socket.id);
    console.log(`Jogador ${socket.id} entrou na sala ${roomId}`);
  });

  // Novo evento: iniciar o jogo e dar as cartas
  socket.on("start_game", (roomId: string) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size !== 2) {
      console.log(`Não há 2 jogadores na sala ${roomId} para iniciar o jogo.`);
      socket.emit("game_error", "Aguardando outro jogador...");
      return;
    }

    const playerIds = Array.from(room);
    const playerAId = playerIds[0];
    const playerBId = playerIds[1];

    // Gera 6 cartas únicas
    const allCards = getRandomUniqueNumbers(7, 0, 39);
    const playerACards = allCards.slice(0, 3);
    const playerBCards = allCards.slice(3, 6);
    const upturnedCard = allCards[6];

    // Envia as cartas para o jogador A
    io.to(playerAId).emit("receive_cards", playerACards);
    console.log(`Cartas enviadas para o jogador A (${playerAId}):`, playerACards);

    // Envia as cartas para o jogador B
    io.to(playerBId).emit("receive_cards", playerBCards);
    console.log(`Cartas enviadas para o jogador B (${playerBId}):`, playerBCards);

    // A carta virada pra cima
    io.to(roomId).emit("upturned_card", upturnedCard);
    console.log(`Carta virada (${roomId}):`, upturnedCard);

    // Opcional: emitir um evento para a sala para indicar que o jogo começou
    // io.to(roomId).emit("game_started");
  });

  // Evento customizado: jogada
  socket.on("play_card", (data) => {
    const rooms = Array.from(socket.rooms); // salas em que o socket está
  
    if (!rooms.includes(data.roomId)) {
      console.log(`Socket ${socket.id} tentou jogar fora da sala ${data.roomId}`);
      return; // ignora
    }
  
    io.to(data.roomId).emit("card_played", data);
    console.log("Jogada recebida:", data);
  });

  // Evento customizado: jogador saiu
  socket.on("leave_game", (roomId: string) => {
    io.to(roomId).emit("player_left", socket.id);
    console.log(`Jogador ${socket.id} saiu da sala ${roomId}`);
    socket.leave(roomId);
  });
});

server.listen(4000, () => {
  console.log("Servidor Socket rodando em http://localhost:4000");
});
