"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from 'next/navigation';
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:4000");

type Card = {
  slug: string;
  respectiveNumber: number;
  strength: number;
  image: string;
};

export default function GamePage() {
    const {room} = useParams();
    const [messages, setMessages] = useState<string[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [upturnedCard, setUpturnedCard] = useState<Card>();

    useEffect(() => {
        joinGame();

        // Listener: quando um jogador entra
        socket.on("player_joined", (playerId) => {
            setMessages((prev) => [...prev, `Jogador entrou: ${playerId}`]);
        });

        // Listener: quando o jogo começa
        socket.on("receive_cards", (cards: Card[]) => {
            // setMessages((prev) => [...prev, `Jogador entrou: ${playerId}`]);
            console.log(cards);
            setCards(cards)
        });

        // Listener: quando o jogo começa
        socket.on("upturned_card", (card: Card) => {
            // setMessages((prev) => [...prev, `Jogador entrou: ${playerId}`]);
            console.log(card );
            setUpturnedCard(card);
        });

        // Listener: quando uma carta é jogada
        socket.on("card_played", (data) => {
            setMessages((prev) => [...prev, `${data.player}: Carta ${data.card}`]);
        });

        // Listener: quando um jogador sai
        socket.on("player_left", (player) => {
            console.log(player);
            setMessages((prev) => [...prev, `${player} saiu da sala`]);
        });

        return () => {
            socket.off("player_joined");
            socket.off("card_played");
            socket.off("player_left");
        };
    }, []);

    const joinGame = () => {
        socket.emit("join_game", room);
    };

    const startGame = () => {
        socket.emit("start_game", room);
    };

    const playCard = () => {
        socket.emit("play_card", { roomId: room, player: socket.id, card: "Ás de Espadas" });
    };

    const leaveGame = () => {
        socket.emit("leave_game", room);
    };

    return (
        <div className="p-6">
          <h1 className="text-xl font-bold">Jogo com Socket.IO {room}</h1>
          <button onClick={startGame} className="m-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Dars cartas
          </button>
          {/* <button onClick={playCard} className="m-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Jogar carta
          </button> */}
          <button onClick={leaveGame} className="m-2 px-4 py-2 bg-red-600 text-white rounded-lg">
            Sair da sala
          </button>

          {upturnedCard && (
            <section>
              <div key={upturnedCard.slug} className="flex flex-col items-center">
                <Image
                  src={upturnedCard.image}
                  alt={upturnedCard.slug}
                  width={120}
                  height={160}
                  className="rounded-lg shadow-md rotate-90"
                />
              </div>
            </section>
          )}

          <section className="flex justify-center">
            {cards.map((card) => (
              <div key={card.slug} className="flex flex-col items-center transition delay-100 duration-200 ease-in-out hover:-translate-y-4 cursor-pointer  ">
                <Image
                  src={card.image}
                  alt={card.slug}
                  width={120}
                  height={160}
                  className="rounded-lg shadow-md"
                />
              </div>
            ))}
          </section>
    
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Log</h2>
            {messages.map((msg, idx) => (
              <p key={idx}>{msg}</p>
            ))}
          </div>


        </div>
    );
  }
  