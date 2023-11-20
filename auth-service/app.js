const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const PORT = 3001;
const SECRET_KEY = "ing-software-2";

mongoose.connect("mongodb://localhost:27017/auth_service", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

app.use(bodyParser.json());

app.post("/auth/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    return res.status(201).json({ message: "Usuario creado exitosamente" });
  } catch (error) {
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    return res.status(200).json({ access_token: token });
  } catch (error) {
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

app.get("/auth/protected", (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  jwt.verify(token.replace("Bearer ", ""), SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }

    return res.status(200).json({ logged_in_as: decoded.username });
  });
});

db.once("open", () => {
  console.log("Conexión a MongoDB establecida");
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
});

db.on("error", console.error.bind(console, "Error de conexión a MongoDB:"));
