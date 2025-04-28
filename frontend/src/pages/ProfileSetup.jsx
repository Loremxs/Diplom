import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function ProfileSetup() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Вы не авторизованы");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weight: parseInt(weight),
          height: parseInt(height),
          goal: goal,
        }),
      });

      if (response.ok) {
        toast.success("Физические параметры сохранены!");
        setTimeout(() => navigate("/"), 1500);
      } else {
        toast.error("Ошибка при сохранении данных");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ошибка сервера при сохранении данных");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-500">Шаг 2 из 2</p>
          <div className="w-full h-1 bg-green-500 rounded-full mt-2"></div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">
          Физические параметры
        </h2>

        <input
          type="number"
          placeholder="Вес (кг)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300"
          required
        />

        <input
          type="number"
          placeholder="Рост (см)"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300"
          required
        />

        <label className="block mb-1 font-semibold">Цель по питанию</label>
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300"
          required
        >
          <option value="">Выберите цель</option>
          <option value="Похудение">Похудение</option>
          <option value="Набор массы">Набор массы</option>
          <option value="Поддержание веса">Поддержание веса</option>
        </select>

        <button
          type="submit"
          className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 mt-4"
        >
          Сохранить профиль
        </button>
      </form>
    </div>
  );
}

export default ProfileSetup;
