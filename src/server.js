import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import mongoose from 'mongoose';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {})
    .then(() => console.log('Conectado ao mongodb'))
    .catch((err) => console.error('Erro ao conectar ao mongodb', err));

app.use('/api/v1/auth', authRoutes);

io.on('connection', (socket) => {
    console.log('Novo usuário conectado!');

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
})