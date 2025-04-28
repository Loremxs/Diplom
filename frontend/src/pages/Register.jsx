import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Register({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // После успешной регистрации — сразу логиним пользователя
        const loginResponse = await fetch("http://localhost:3000/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          const { token } = loginData;
          localStorage.setItem("token", token);
          localStorage.setItem("isAuthenticated", "true");
          setToken(token); // Обновляем состояние токена
          toast.success("Регистрация успешна! Заполните профиль.");
          setTimeout(() => navigate("/profile-setup"), 1500);
        } else {
          toast.error("Ошибка автоматического входа после регистрации");
        }
      } else {
        toast.error(data.message || "Ошибка регистрации");
      }
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
      toast.error("Ошибка сервера при регистрации");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Регистрация</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600"
        >
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}

export default Register;
