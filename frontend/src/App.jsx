import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import MenuCard from "./components/MenuCard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [menu, setMenu] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      if (!token) {
        setMenu([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch("http://localhost:3000/api/menu", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMenu(data);
      } else {
        console.error("Ошибка при получении меню");
      }
      setIsLoading(false);
    };

    fetchMenu();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
    setToken(null);
    toast.success("Вы успешно вышли!");
    navigate("/login");
  };

  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <nav className="mb-6 flex justify-center gap-4">
        <Link to="/" className="text-blue-500 hover:underline">
          Главная
        </Link>
        {!isAuthenticated && (
          <>
            <Link to="/register" className="text-blue-500 hover:underline">
              Регистрация
            </Link>
            <Link to="/login" className="text-blue-500 hover:underline">
              Вход
            </Link>
          </>
        )}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="text-red-500 hover:underline"
          >
            Выйти
          </button>
        )}
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>
                <h1 className="text-3xl font-bold text-center mb-6">
                  Смарт Меню
                </h1>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-48 bg-gray-300 rounded-2xl animate-pulse"
                        />
                      ))
                    : menu.map((item) => <MenuCard key={item.id} {...item} />)}
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="/register" element={<Register setToken={setToken} />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;
