import express from "express";
import http from "http";
import { Server } from "socket.io";

import { cards } from "./data/cards";

import client, { connectRedis } from "./redisClient";

const app = express();
const server = http.createServer(app);

connectRedis();

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
  socket.on("start_game", async (roomId: string) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size !== 2) {
      console.log(`Não há 2 jogadores na sala ${roomId} para iniciar o jogo.`);
      socket.emit("game_error", "Aguardando outro jogador...");
      return;
    }

    const playerIds = Array.from(room);
    const playerAId = playerIds[0];
    const playerBId = playerIds[1];

    // Gera 7 cartas únicas
    const allCards = getRandomUniqueNumbers(7, 0, 39);
    const playerACards = allCards.slice(0, 3).map((cardIndex) => cards[cardIndex]);
    const playerBCards = allCards.slice(3, 6).map((cardIndex) => cards[cardIndex]);
    const upturnedCard = cards[allCards[6]];

    await client.hSet(`truco:round:${roomId}`, {
      [`cardPlayed:${playerAId}`]: JSON.stringify(playerACards),
      [`cardPlayed:${playerBId}`]: JSON.stringify(playerBCards),
      [`lastCardPlayed:${playerAId}`]: "",
      [`lastCardPlayed:${playerBId}`]: "",
      [`turnWinner:${playerAId}`]: 0,
      [`turnWinner:${playerBId}`]: 0,
      upturnedCard: JSON.stringify(upturnedCard),
      turn: playerAId,  // TODO: implementar a lógica de turno
      playedCardCount: 0,
    });
    

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

  socket.on("get_round_data", async (roomId: string) => {
    const roundData = await client.hGetAll(`truco:round:${roomId}`);
    io.to(roomId).emit("round_data", roundData);
    console.log(`Dados da rodada enviados para a sala ${roomId}:`, roundData);
  });

  // Evento customizado: jogada
  socket.on("play_card", async (roomId, card) => {
    const rooms = Array.from(socket.rooms); // salas em que o socket está
  
    if (!rooms.includes(roomId)) {
      console.log(`Socket ${socket.id} tentou jogar fora da sala ${roomId}`);
      return; // ignora
    }

    const roundData = await client.hGetAll(`truco:round:${roomId}`);
    const turn = roundData[`turn`];

    if (turn !== socket.id) {
      console.log(`Socket ${socket.id} tentou jogar fora do turno ${turn}`);
      io.to(roomId).emit("game_error", "Aguardando o próximo turno...");
      return;
    }

    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size !== 2) {
      console.log(`Não há 2 jogadores na sala ${roomId} para iniciar o jogo.`);
      socket.emit("game_error", "Aguardando outro jogador...");
      return;
    }

    const playerIds = Array.from(room);
    const playerAId = playerIds[0];
    const playerBId = playerIds[1];

    await client.hSet(`truco:round:${roomId}`, {
      [`lastCardPlayed:${turn}`]: JSON.stringify(card),
      playedCardCount: parseInt(roundData[`playedCardCount`]) + 1,
      turn: turn === playerAId ? playerBId : playerAId,
    });

    io.to(roomId).emit("card_played", { player: turn, card: card });
    console.log("Jogada recebida:", card);
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
