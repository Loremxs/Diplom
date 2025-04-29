import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleProfileClick = () => {
    navigate("/profile");
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
    setIsMenuOpen(false);
  };

  return (
    <nav className="flex justify-between items-center bg-white px-6 py-4 shadow-md">
      <Link to="/" className="flex items-center">
        <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
      </Link>

      <div className="flex items-center gap-4">
        {!token ? (
          <>
            <Link
              to="/login"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
              Вход
            </Link>
            <Link
              to="/register"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Регистрация
            </Link>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="focus:outline-none"
            >
              <img
                src="/avatar.png"
                alt="Профиль"
                className="h-10 w-10 rounded-full object-cover transform transition duration-200 hover:shadow-md hover:scale-105"
              />
            </button>

            <div
              className={`absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-2 z-50 transform transition-all duration-200 origin-top-right ${
                isMenuOpen
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0 pointer-events-none"
              }`}
            >
              <button
                onClick={handleProfileClick}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Профиль
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
