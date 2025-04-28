const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Настройки подключения к базе данных
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const JWT_SECRET = process.env.JWT_SECRET;

// Моковые данные для тестового меню
const mockMenu = [
  {
    id: 1,
    name: "Цезарь с курицей",
    calories: 320,
    protein: 25,
    fat: 18,
    carbs: 20,
  },
  {
    id: 2,
    name: "Салат с тунцом",
    calories: 280,
    protein: 22,
    fat: 12,
    carbs: 15,
  },
  {
    id: 3,
    name: "Каша овсяная с фруктами",
    calories: 350,
    protein: 8,
    fat: 5,
    carbs: 60,
  },
];

// Middleware для проверки токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Нет токена, доступ запрещён" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Токен недействителен" });

    req.user = user;
    next();
  });
}

// Регистрация пользователя
app.post("/api/register", async (req, res) => {
  const { name, email, password, gender, age } = req.body;

  if (!name || !email || !password || !gender || !age) {
    return res
      .status(400)
      .json({ message: "Имя, Email, Пароль, Пол и Возраст обязательны" });
  }

  try {
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password, gender, age) VALUES ($1, $2, $3, $4, $5)",
      [name, email, hashedPassword, gender, age]
    );

    res.status(201).json({ message: "Регистрация успешна" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
  }
});

// Вход пользователя
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email и пароль обязательны" });
  }

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Вход успешен", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера при входе" });
  }
});

// Получение профиля
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name, email, gender, age, weight, height, goal FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при получении профиля" });
  }
});

// Обновление профиля (частичное обновление)
app.put("/api/profile", authenticateToken, async (req, res) => {
  const fields = ["name", "email", "gender", "age", "weight", "height", "goal"];
  const updates = [];
  const values = [];
  let index = 1;

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${index}`);
      values.push(req.body[field]);
      index++;
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "Нет данных для обновления" });
  }

  values.push(req.user.id);

  const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${index}`;

  try {
    await pool.query(query, values);
    res.status(200).json({ message: "Профиль успешно обновлен" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при обновлении профиля" });
  }
});

// Получение меню
app.get("/api/menu", authenticateToken, (req, res) => {
  res.json(mockMenu);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
