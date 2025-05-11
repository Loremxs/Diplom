import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

function History() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await fetch("http://localhost:3000/api/menu/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        } else {
          toast.error("Ошибка при загрузке истории");
        }
      } catch (err) {
        console.error("Ошибка:", err);
        toast.error("Ошибка при загрузке истории");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    const token = localStorage.getItem("token");

    const result = await Swal.fire({
      title: "Удалить всю историю?",
      text: "Вы уверены, что хотите удалить все сохранённые меню?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Удалить",
      cancelButtonText: "Отмена",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch("http://localhost:3000/api/menu/history", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setHistory([]);
        toast.success("История успешно очищена");
      } else {
        toast.error("Ошибка при удалении истории");
      }
    } catch (err) {
      console.error("Ошибка:", err);
      toast.error("Ошибка при удалении истории");
    }
  };

  const handleDeleteMenu = async (id) => {
    const token = localStorage.getItem("token");

    const result = await Swal.fire({
      title: "Удалить меню?",
      text: "Это действие нельзя отменить.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Удалить",
      cancelButtonText: "Отмена",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3000/api/menu/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        toast.success("Меню удалено");
      } else {
        toast.error("Ошибка при удалении меню");
      }
    } catch (err) {
      console.error("Ошибка:", err);
      toast.error("Ошибка при удалении меню");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-6">История Меню</h1>

      {history.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleClearHistory}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Очистить историю
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-center">Загрузка...</p>
      ) : history.length === 0 ? (
        <p className="text-center">История пуста.</p>
      ) : (
        history.map((entry) => (
          <div
            key={entry.id}
            className="bg-white p-6 rounded-lg shadow-md mb-6 hover:shadow-lg transition relative"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteMenu(entry.id);
              }}
              className="absolute top-2 right-2 p-1 rounded hover:bg-red-100 transition"
              title="Удалить"
            >
              <img
                src="/trash.png" // <- путь обновлён под твою структуру
                alt="Удалить"
                className="w-6 h-6 object-contain"
              />
            </button>

            <div
              onClick={() => setSelectedMenu(entry)}
              className="cursor-pointer"
            >
              <h2 className="text-xl font-semibold">
                📅 {new Date(entry.created_at).toLocaleString("ru-RU")}
              </h2>
              <p className="text-gray-500">Нажмите, чтобы просмотреть детали</p>
            </div>
          </div>
        ))
      )}

      {selectedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Меню от{" "}
              {new Date(selectedMenu.created_at).toLocaleString("ru-RU")}
            </h2>

            {["breakfast", "lunch", "dinner"].map((mealType) => (
              <div key={mealType} className="mb-6">
                <h3 className="text-xl font-semibold mb-2">
                  {mealType === "breakfast"
                    ? "Завтрак"
                    : mealType === "lunch"
                    ? "Обед"
                    : "Ужин"}
                </h3>
                <ul className="list-disc ml-6 space-y-1 text-gray-700">
                  {selectedMenu[mealType].map((item, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{item.name}</span> —{" "}
                      {item.calories || 0} ккал, Б: {item.protein || 0} / Ж:{" "}
                      {item.fat || 0} / У: {item.carbs || 0}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  localStorage.setItem(
                    "generatedMenu",
                    JSON.stringify(selectedMenu)
                  );
                  toast.success("Меню установлено как активное");
                  setSelectedMenu(null);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Повторить меню
              </button>

              <button
                onClick={() => setSelectedMenu(null)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
