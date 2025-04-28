import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    gender: "",
    age: "",
    weight: "",
    height: "",
    goal: "",
    activity_level: "",
    calories: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await fetch("http://localhost:3000/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          toast.error("Не удалось загрузить профиль");
        }
      } catch (error) {
        console.error(error);
        toast.error("Ошибка сервера при загрузке профиля");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

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
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast.success("Профиль успешно обновлен!");

        // 👉 После успешного обновления повторно запрашиваем профиль
        const updatedProfile = await fetch(
          "http://localhost:3000/api/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (updatedProfile.ok) {
          const freshData = await updatedProfile.json();
          setProfile(freshData); // обновляем профиль на фронте
        }
      } else {
        toast.error("Ошибка при обновлении профиля");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ошибка сервера при обновлении профиля");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Профиль</h2>

        <input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleChange}
          placeholder="Имя"
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <input
          type="email"
          name="email"
          value={profile.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <select
          name="gender"
          value={profile.gender}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        >
          <option value="">Выберите пол</option>
          <option value="male">Мужчина</option>
          <option value="female">Женщина</option>
        </select>

        <input
          type="number"
          name="age"
          value={profile.age}
          onChange={handleChange}
          placeholder="Возраст"
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <input
          type="number"
          name="weight"
          value={profile.weight}
          onChange={handleChange}
          placeholder="Вес (кг)"
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <input
          type="number"
          name="height"
          value={profile.height}
          onChange={handleChange}
          placeholder="Рост (см)"
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <select
          name="goal"
          value={profile.goal}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        >
          <option value="">Выберите цель</option>
          <option value="lose">Похудение</option>
          <option value="maintain">Поддержание веса</option>
          <option value="gain">Набор массы</option>
        </select>

        <select
          name="activity_level"
          value={profile.activity_level}
          onChange={handleChange}
          className="w-full p-2 mb-6 border rounded"
          required
        >
          <option value="">Уровень активности</option>
          <option value="low">Минимальная активность</option>
          <option value="light">Легкая активность</option>
          <option value="moderate">Средняя активность</option>
          <option value="high">Высокая активность</option>
        </select>

        {/* Рассчитанные калории */}
        <div className="mb-6 text-center text-gray-700">
          <strong>Рассчитанные калории:</strong> {profile.calories} ккал/день
        </div>

        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Сохранить изменения
        </button>
      </form>
    </div>
  );
}

export default Profile;
