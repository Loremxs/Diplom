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
    return res.status(400).json({
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
// Генерация меню
app.post("/api/menu/generate", authenticateToken, async (req, res) => {
  try {
    const { diet, vegan, noFastfood } = req.body || {};

    const userResult = await pool.query(
      "SELECT calories FROM users WHERE id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const totalCalories = userResult.rows[0].calories || 2000;

    const mealTypeMap = {
      breakfast: "Завтрак",
      lunch: "Суп",
      dinner: "Горячее",
    };

    const targets = {
      breakfast: totalCalories * 0.3,
      lunch: totalCalories * 0.4,
      dinner: totalCalories * 0.3,
    };

    const buildFilterClause = () => {
      const clauses = [];
      if (diet) clauses.push("meal_type = 'Диетическое'");
      if (vegan) clauses.push("meal_type = 'Вегетарианское'");
      if (noFastfood) clauses.push("meal_type != 'Фастфуд'");
      return clauses.length ? " AND " + clauses.join(" AND ") : "";
    };

    const filterClause = buildFilterClause();

    const pickMealsFromSameRestaurant = async (type, targetCalories) => {
      const translatedType = mealTypeMap[type];

      const restaurantResult = await pool.query(
        `SELECT restaurant
         FROM meals
         WHERE meal_type = $1 ${filterClause}
         GROUP BY restaurant
         HAVING COUNT(*) >= 3
         ORDER BY RANDOM()
         LIMIT 1`,
        [translatedType]
      );

      if (restaurantResult.rows.length === 0) {
        console.warn(`[WARN] Нет ресторанов с блюдами для ${type}`);
        return [];
      }

      const restaurant = restaurantResult.rows[0].restaurant;

      const mealsResult = await pool.query(
        `SELECT * FROM meals
         WHERE meal_type = $1 AND restaurant = $2 ${filterClause}
         ORDER BY RANDOM()`,
        [translatedType, restaurant]
      );

      const meals = mealsResult.rows;
      const selected = [];
      let sum = 0;

      for (const meal of meals) {
        if (sum + meal.calories <= targetCalories * 1.1) {
          selected.push(meal);
          sum += meal.calories;
          if (sum >= targetCalories * 0.9) break;
        }
      }

      return selected;
    };

    const breakfast = await pickMealsFromSameRestaurant(
      "breakfast",
      targets.breakfast
    );
    const lunch = await pickMealsFromSameRestaurant("lunch", targets.lunch);
    const dinner = await pickMealsFromSameRestaurant("dinner", targets.dinner);

    const menu = [...breakfast, ...lunch, ...dinner];

    const summary = menu.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.fat += meal.fat;
        acc.carbs += meal.carbs;
        return acc;
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    res.json({ breakfast, lunch, dinner, summary });
  } catch (error) {
    console.error("Ошибка при генерации меню:", error);
    res.status(500).json({ message: "Ошибка сервера при генерации меню" });
  }
});

app.post("/api/menu/save", authenticateToken, async (req, res) => {
  try {
    const { breakfast, lunch, dinner } = req.body;

    if (!breakfast || !lunch || !dinner) {
      return res.status(400).json({ message: "Неполные данные меню" });
    }

    await pool.query(
      `INSERT INTO saved_menus (user_id, created_at, breakfast, lunch, dinner)
       VALUES ($1, NOW(), $2, $3, $4)`,
      [
        req.user.id,
        JSON.stringify(breakfast),
        JSON.stringify(lunch),
        JSON.stringify(dinner),
      ]
    );

    res.status(201).json({ message: "Меню успешно сохранено" });
  } catch (error) {
    console.error("Ошибка при сохранении меню:", error);
    res.status(500).json({ message: "Ошибка сервера при сохранении меню" });
  }
});
app.get("/api/menu/history", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, created_at, breakfast, lunch, dinner FROM saved_menus WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка получения истории меню:", error);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении истории меню" });
  }
});
app.delete("/api/menu/history", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM saved_menus WHERE user_id = $1", [
      req.user.id,
    ]);
    res.status(200).json({ message: "История очищена" });
  } catch (error) {
    console.error("Ошибка очистки истории:", error);
    res.status(500).json({ message: "Ошибка при очистке истории" });
  }
});
app.delete("/api/menu/:id", authenticateToken, async (req, res) => {
  const menuId = req.params.id;

  try {
    await pool.query("DELETE FROM saved_menus WHERE id = $1 AND user_id = $2", [
      menuId,
      req.user.id,
    ]);
    res.status(200).json({ message: "Меню удалено" });
  } catch (error) {
    console.error("Ошибка удаления меню:", error);
    res.status(500).json({ message: "Ошибка сервера при удалении меню" });
  }
});
// Заменить одно блюдо по типу
app.get("/api/menu/replace", authenticateToken, async (req, res) => {
  const {
    type,
    targetCalories,
    targetProtein,
    targetFat,
    targetCarbs,
    excludeId,
    restaurant,
  } = req.query;

  try {
    const result = await pool.query(
      `SELECT *,
        ABS(calories - $2) +
        ABS(protein - $3) * 10 +
        ABS(fat - $4) * 10 +
        ABS(carbs - $5) * 10 AS score
       FROM meals 
       WHERE meal_type = $1 AND restaurant = $6 AND id != $7
       ORDER BY score ASC 
       LIMIT 1`,
      [
        type,
        targetCalories,
        targetProtein,
        targetFat,
        targetCarbs,
        restaurant,
        excludeId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Подходящее блюдо не найдено" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка при замене блюда:", err);
    res.status(500).json({ message: "Ошибка при замене блюда" });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
