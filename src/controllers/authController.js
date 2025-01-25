import User from "../models/authModel.js";
import redis from "../services/redisService.js";

const register = async (req, res) => {
    const { username, password } = req.body;

    try {
        const userExists = await User.findOne({ username })

        if (userExists) {
            return res.status(400).json({ message: 'Usuário já existe!' });
        }

        const user = new User({ username, password });
        await user.save();

        return res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Erro ao registrar usuário', error: err });
    }
}

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            res.status(400).json({ message: "Usuário não encontrado" });
        }

        const passwordMatch = await user.matchPassword(password);

        if (!passwordMatch) {
            res.status(400).json({ message: "Senha incorreta!" });
        }

        const sessionId = `${username}:${Date.now()}`;
        await redis.set(sessionId, JSON.stringify({ username }));

        console.log(sessionId);
        
        return res.status(200).json({ message: "Login bem sucedido!" });
    } catch (err) {
        return res.status(500).json({ message: 'Erro no servidor', error: err });
    }
}

export default {
    register,
    login
}