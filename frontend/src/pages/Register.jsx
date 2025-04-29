import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "male",
    age: "",
    weight: "",
    height: "",
    goal: "maintain",
    activityLevel: "moderate",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/register", formData);
      toast.success("Регистрация успешна! Теперь войдите.");
      navigate("/login");
    } catch (error) {
      console.error(error.response?.data?.message || "Ошибка регистрации");
      toast.error(error.response?.data?.message || "Ошибка регистрации");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Регистрация</h2>

        <input
          type="text"
          name="name"
          placeholder="Имя"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        >
          <option value="male">Мужчина</option>
          <option value="female">Женщина</option>
        </select>

        <input
          type="number"
          name="age"
          placeholder="Возраст"
          value={formData.age}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <input
          type="number"
          name="weight"
          placeholder="Вес (кг)"
          value={formData.weight}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <input
          type="number"
          name="height"
          placeholder="Рост (см)"
          value={formData.height}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <select
          name="goal"
          value={formData.goal}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        >
          <option value="lose">Похудение</option>
          <option value="maintain">Поддержание веса</option>
          <option value="gain">Набор массы</option>
        </select>

        <select
          name="activityLevel"
          value={formData.activityLevel}
          onChange={handleChange}
          className="w-full p-2 mb-6 border rounded"
          required
        >
          <option value="low">Минимальная активность</option>
          <option value="light">Легкая активность</option>
          <option value="moderate">Средняя активность</option>
          <option value="high">Высокая активность</option>
        </select>

        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}

export default Register;
