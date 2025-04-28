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
      <div className="flex justify-center items-center h-screen">
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-2xl p-8 max-w-2xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Личный кабинет</h1>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Имя</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Пол</label>
            <select
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300"
              required
            >
              <option value="">Выберите пол</option>
              <option value="Мужской">Мужской</option>
              <option value="Женский">Женский</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Возраст (лет)</label>
            <input
              type="number"
              name="age"
              value={profile.age}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Вес (кг)</label>
            <input
              type="number"
              name="weight"
              value={profile.weight}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Рост (см)</label>
            <input
              type="number"
              name="height"
              value={profile.height}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Цель питания</label>
            <select
              name="goal"
              value={profile.goal}
              onChange={handleChange}
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
            type="submit"
            className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 mt-4"
          >
            Сохранить изменения
          </button>
        </div>
      </form>
    </div>
  );
}

export default Profile;
