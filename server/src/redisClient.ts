import { createClient } from "redis";

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

client.on("error", (err) => console.error("Redis Client Error", err));

export async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

export default client;
