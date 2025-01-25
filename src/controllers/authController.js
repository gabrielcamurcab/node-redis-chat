import Auth from "../models/authModel.js";


const register = async (req, res) => {
    const { username, password } = req.body;
    try {
        const newUser = new Auth({ username, password });
        const register = await Auth.register(newUser);
        res.status(201).json(register);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const login = await Auth.login(username, password);
        res.status(200).json(login);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export default {
    register,
    login
}