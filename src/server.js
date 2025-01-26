import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import mongoose from "mongoose";
import redis from "./services/redisService.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("Conectado ao mongodb"))
  .catch((err) => console.error("Erro ao conectar ao mongodb", err));

app.use("/api/v1/auth", authRoutes);

let userSockets = {};

io.on("connection", (socket) => {
  console.log("Novo usuário conectado!");

  // Login do usuário
  socket.on("login", async (sessionId) => {
    try {
      const sessionData = await redis.get(sessionId);
      if (!sessionData) {
        socket.emit("error", "Sessão expirada ou inválida");
        return;
      }

      const { username } = JSON.parse(sessionData); // Assumindo que sessionData armazena um objeto com username

      // Armazenando o socket ID do usuário
      userSockets[username] = socket.id;

      console.log(`${username} entrou no chat!`);

      // Emite uma confirmação de login bem-sucedido
      socket.emit("login_success", { message: `${username} entrou no chat!` });
    } catch (err) {
      console.log("Erro ao obter dados da sessão", err);
      socket.emit("error", "Erro ao validar sessão");
    }
  });

  // Envio de mensagem para outro usuário
  socket.on("send_message", async (toUsername, message) => {
    const sessionId = socket.handshake.auth.sessionId;

    try {
      const sessionData = await redis.get(sessionId);
        if (!sessionData) {
            SocketAddress.emit('error', 'Sessão inválida ou expirada.');
        }

        const { username } = JSON.parse(sessionData);

        const key = `chat:${[username, toUsername].sort().join(':')}`;

        const messageData = {
            from: username,
            to: toUsername,
            message,
            timestamp: Date.now()
        };

        await redis.rpush(key, JSON.stringify(messageData));

      const targetSocket = userSockets[toUsername];
      if (targetSocket) {
        io.to(targetSocket).emit("receive_message", message);
      } else {
        socket.emit("infor", "Usuário não está online, mas mensagem foi enviada!");
      }
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        socket.emit('error', 'Erro ao enviar mensagem');
    }
  });

  socket.on('get_history', async (toUsername) => {
    const sessionId = socket.handshake.auth.sessionId;

    try {
        const sessionData = await redis.get(sessionId);
        if (!sessionData) {
            socket.emit('error', 'Sessão inválida ou expirada');
            return;
        }

        const { username } = JSON.parse(sessionData);

        const key = `chat:${[username, toUsername].sort().join(':')}`;

        const history = await redis.lrange(key, 0, -1);

        const parsedHistory = history.map((msg) => JSON.parse(msg));

        socket.emit('socket_history', parsedHistory)
    } catch (err) {
        console.error('Erro ao obter histórico:', err);
        socket.emit('error', 'Erro ao obter histórico');
    }
  });

  // Quando o usuário se desconecta
  socket.on("disconnect", () => {
    console.log("Usuário desconectado", socket.id);

    // Remover o socket correspondente ao usuário que se desconectou
    for (let username in userSockets) {
      if (userSockets[username] === socket.id) {
        delete userSockets[username]; // Remover apenas o usuário correto
        break;
      }
    }
  });

  socket.on("connect_error", (err) => {
    console.log("Erro de Conexão:", err.message); // Mostra o erro completo
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
