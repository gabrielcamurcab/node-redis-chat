import bcrypt from 'bcrypt';
import redis from '../services/redisService.js';

const users = {};

const Auth = function (user) {
    this.username = user.username;
    this.password = user.password;
};

Auth.register = async (newuser) => {
    return new Promise(async (resolve, reject) => {
        const user = new Auth(newuser);
        
        if (users[user.username]) {
            reject({ message: "Usuário já existe!" });
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);
        users[user.username] = { password: hashedPassword };

        resolve({ message: "Usuário cadastrado com sucesso!" });
    });
};

Auth.login = async (username, password) => {
    return new Promise(async (resolve, reject) => {
        const user = users[username];

        if (!user) {
            reject({ message: "Usuário não encontrado!" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            const sessionId = `${username}:${Date.now()}`;
            await redis.set(sessionId, JSON.stringify({ username }));

            resolve({ message: "Login bem-sucedido!" });
        } else {
            reject({ message: "Senha incorreta!" });
        }
    });
};

export default Auth;