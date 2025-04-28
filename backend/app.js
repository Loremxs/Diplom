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

// Функция для расчета калорий
function calculateCalories({
  gender,
  age,
  height,
  weight,
  activityLevel,
  goal,
}) {
  let BMR;

  if (gender === "male") {
    BMR = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === "female") {
    BMR = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    throw new Error("Invalid gender");
  }

  const activityFactors = {
    low: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
  };

  const activityMultiplier = activityFactors[activityLevel];

  if (!activityMultiplier) {
    throw new Error("Invalid activity level");
  }

  let calories = BMR * activityMultiplier;

  if (goal === "lose") {
    calories *= 0.85;
  } else if (goal === "gain") {
    calories *= 1.15;
  } else if (goal === "maintain") {
    // ничего не делаем
  } else {
    throw new Error("Invalid goal");
  }

  return Math.round(calories);
}

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
  const {
    name,
    email,
    password,
    gender,
    age,
    weight,
    height,
    goal,
    activityLevel,
  } = req.body;

  if (
    !name ||
    !email ||
    !password ||
    !gender ||
    !age ||
    !weight ||
    !height ||
    !goal ||
    !activityLevel
  ) {
    return res
      .status(400)
      .json({
        message:
          "Все поля обязательны: имя, email, пароль, пол, возраст, вес, рост, цель, уровень активности",
      });
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

    // Расчет калорий
    const calories = calculateCalories({
      gender,
      age,
      height,
      weight,
      activityLevel,
      goal,
    });

    await pool.query(
      `INSERT INTO users (name, email, password, gender, age, weight, height, goal, activity_level, calories) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        name,
        email,
        hashedPassword,
        gender,
        age,
        weight,
        height,
        goal,
        activityLevel,
        calories,
      ]
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
      "SELECT name, email, gender, age, weight, height, goal, activity_level, calories FROM users WHERE id = $1",
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
  const fields = [
    "name",
    "email",
    "gender",
    "age",
    "weight",
    "height",
    "goal",
    "activity_level",
  ];
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${index}`;
    await client.query(query, values);

    const userResult = await client.query(
      "SELECT gender, age, weight, height, goal, activity_level FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = userResult.rows[0];

    if (
      user.weight &&
      user.height &&
      user.age &&
      user.gender &&
      user.goal &&
      user.activity_level
    ) {
      const newCalories = calculateCalories({
        gender: user.gender,
        age: user.age,
        weight: user.weight,
        height: user.height,
        goal: user.goal,
        activityLevel: user.activity_level,
      });

      await client.query("UPDATE users SET calories = $1 WHERE id = $2", [
        newCalories,
        req.user.id,
      ]);
    }

    await client.query("COMMIT");

    res.status(200).json({ message: "Профиль успешно обновлен" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Ошибка при обновлении профиля" });
  } finally {
    client.release();
  }
});

// Получение меню
app.get("/api/menu", authenticateToken, (req, res) => {
  res.json(mockMenu);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
