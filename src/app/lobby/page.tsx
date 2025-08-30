"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LobbyPage() {
    const [room, setRoom] = useState("");
    const router = useRouter();

    const joinGame = () => {
      if (room.length === 6) {
        router.push(`/game/${room}`);
      }
    };

    const handleChange = (e: any) => {
      const value = e.target.value.toUpperCase();
      setRoom(value);
    };

    return (
      <div className="h-screen flex flex-col justify-center items-center p-6">
        <h1 className="text-2xl font-bold mb-6">🎮 Lobby</h1>
        
        <div className="">
            <input
              className="p-2 border border-gray-300 rounded text-lg uppercase w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={room}
              onChange={handleChange}
              placeholder="Digite o nome da sala"
              maxLength={6}
            />

            <button
              disabled={room.length < 6}
              onClick={joinGame}
              className={`p-2 rounded text-lg text-white transition w-full
                ${room.length < 6 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-green-500 hover:bg-green-600 cursor-pointer"
                }`}
            >
              Entrar na sala
            </button>
        </div>
      </div>
    );
  }
  