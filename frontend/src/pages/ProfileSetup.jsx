import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function ProfileSetup() {
  const [step, setStep] = useState(1); // Следим за текущим шагом
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState("");
  const navigate = useNavigate();

  const validateStepOne = () => {
    if (!gender) {
      toast.error("Выберите пол");
      return false;
    }
    if (!age || age < 10 || age > 100) {
      toast.error("Введите корректный возраст (10–100 лет)");
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    if (!weight || weight < 20 || weight > 300) {
      toast.error("Введите корректный вес (20–300 кг)");
      return false;
    }
    if (!height || height < 80 || height > 250) {
      toast.error("Введите корректный рост (80–250 см)");
      return false;
    }
    if (!goal) {
      toast.error("Выберите цель питания");
      return false;
    }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStepOne()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStepTwo()) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Вы не авторизованы");
      navigate("/login");
      return;
    }

    const response = await fetch("http://localhost:3000/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gender, age, weight, height, goal }),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success("Профиль успешно заполнен!");
      setTimeout(() => navigate("/"), 1500);
    } else {
      toast.error(data.message || "Ошибка заполнения профиля");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md transition-all duration-500">
        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-2">Шаг {step} из 2</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${step === 1 ? 50 : 100}%` }}
            ></div>
          </div>
        </div>

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">
              Основная информация
            </h2>

            <div className="mb-4">
              <label className="block mb-2 font-semibold">Пол</label>
              <div className="flex gap-4">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Мужской"
                    onChange={(e) => setGender(e.target.value)}
                    required
                  />{" "}
                  Мужской
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Женский"
                    onChange={(e) => setGender(e.target.value)}
                    required
                  />{" "}
                  Женский
                </label>
              </div>
            </div>

            <input
              type="number"
              placeholder="Возраст"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full p-3 mb-4 rounded-lg border border-gray-300"
              required
            />

            <button
              onClick={handleNext}
              className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 mt-4"
            >
              Далее
            </button>
          </>
        )}

        {step === 2 && (
          <>
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

            <div className="mb-4">
              <label className="block mb-2 font-semibold">
                Цель по питанию
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300"
                required
              >
                <option value="">Выберите цель</option>
                <option value="Похудение">Похудение</option>
                <option value="Набор массы">Набор массы</option>
                <option value="Поддержание веса">Поддержание веса</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 mt-4"
            >
              Сохранить профиль
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default ProfileSetup;
