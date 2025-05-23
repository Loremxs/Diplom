import React, { useEffect, useState } from "react";
import MenuCard from "../components/MenuCard";
import { toast } from "react-toastify";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

function Home() {
  const [menu, setMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    diet: false,
    vegan: false,
    noFastfood: false,
  });

  useEffect(() => {
    const savedMenu = localStorage.getItem("generatedMenu");
    if (savedMenu) {
      setMenu(JSON.parse(savedMenu));
    }
  }, []);

  const generateMenu = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:3000/api/menu/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filters),
      });

      if (res.ok) {
        const data = await res.json();
        const { breakfast, lunch, dinner, summary } = data;
        const simplified = { breakfast, lunch, dinner, summary };
        setMenu(simplified);
        localStorage.setItem("generatedMenu", JSON.stringify(simplified));
        toast.success("Меню успешно сгенерировано!");
      } else {
        toast.error("Ошибка при генерации меню");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ошибка сети");
    } finally {
      setIsLoading(false);
    }
  };

  const saveMenu = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:3000/api/menu/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(menu),
      });

      if (res.ok) {
        toast.success("Меню сохранено в историю!");
      } else {
        toast.error("Ошибка при сохранении меню");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ошибка сети");
    }
  };

  const replaceDish = async (mealType, index) => {
    const token = localStorage.getItem("token");
    const dishToReplace = menu[mealType][index];

    try {
      const params = new URLSearchParams({
        type: dishToReplace.meal_type,
        targetCalories: Number(dishToReplace.calories),
        targetProtein: Number(dishToReplace.protein),
        targetFat: Number(dishToReplace.fat),
        targetCarbs: Number(dishToReplace.carbs),
        excludeId: dishToReplace.id,
        restaurant: dishToReplace.restaurant,
      });

      const res = await fetch(
        `http://localhost:3000/api/menu/replace?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const newDish = await res.json();
        const updated = { ...menu };
        updated[mealType][index] = newDish;
        setMenu(updated);
        toast.success("Блюдо заменено");
      } else {
        toast.error("Не удалось заменить блюдо");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ошибка замены");
    }
  };

  const exportToPDF = () => {
    const content = [];

    content.push({
      text: "Смарт Меню",
      fontSize: 18,
      bold: true,
      margin: [0, 0, 0, 10],
    });

    ["breakfast", "lunch", "dinner"].forEach((mealType) => {
      const title =
        mealType === "breakfast"
          ? "Завтрак"
          : mealType === "lunch"
          ? "Обед"
          : "Ужин";

      content.push({
        text: title,
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
      });

      const items = menu[mealType].map((item) => {
        return `${item.name} — ${item.calories} ккал (Б: ${item.protein}, Ж: ${item.fat}, У: ${item.carbs})`;
      });

      content.push({ ul: items, fontSize: 11 });
    });

    const docDefinition = {
      content,
      defaultStyle: {
        font: "Roboto",
      },
    };

    pdfMake.createPdf(docDefinition).download("smart_menu.pdf");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-6">Смарт Меню</h1>

      <div className="flex justify-center gap-4 mb-4">
        <label>
          <input
            type="checkbox"
            checked={filters.diet}
            onChange={() => setFilters({ ...filters, diet: !filters.diet })}
          />{" "}
          Диетическое
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.vegan}
            onChange={() => setFilters({ ...filters, vegan: !filters.vegan })}
          />{" "}
          Вегетарианское
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.noFastfood}
            onChange={() =>
              setFilters({ ...filters, noFastfood: !filters.noFastfood })
            }
          />{" "}
          Без фастфуда
        </label>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={generateMenu}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
          disabled={isLoading}
        >
          {isLoading ? "Генерация..." : "Сгенерировать меню"}
        </button>

        {menu && (
          <>
            <button
              onClick={saveMenu}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition"
            >
              Сохранить меню
            </button>
            <button
              onClick={exportToPDF}
              className="bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-800 transition"
            >
              Экспорт в PDF
            </button>
          </>
        )}
      </div>

      {menu ? (
        <div className="space-y-10">
          {["breakfast", "lunch", "dinner"].map((mealType) => {
            const restaurant = menu[mealType]?.[0]?.restaurant || "неизвестно";
            return (
              <div key={mealType}>
                <h2 className="text-2xl font-semibold mb-4">
                  {mealType === "breakfast"
                    ? "Завтрак"
                    : mealType === "lunch"
                    ? "Обед"
                    : "Ужин"}
                </h2>
                <p className="text-gray-500 mb-3">Ресторан: {restaurant}</p>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {menu[mealType].map((item, idx) => {
                    let label = "";
                    let icon = "";
                    if (
                      ["Суп", "Горячее", "Завтрак"].includes(item.meal_type)
                    ) {
                      label = "Основное";
                      icon = "/meal.png";
                    } else if (
                      ["Салат", "Гарнир", "Закуска"].includes(item.meal_type)
                    ) {
                      label = "Гарнир";
                      icon = "/garnier.png";
                    } else if (item.meal_type === "Напиток") {
                      label = "Напиток";
                      icon = "/drink.png";
                    }

                    return (
                      <div key={`${mealType}-${idx}`}>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                          <img src={icon} alt={label} className="w-5 h-5" />{" "}
                          {label}
                        </p>
                        <MenuCard
                          {...item}
                          onDelete={() => {
                            const updated = { ...menu };
                            updated[mealType] = updated[mealType].filter(
                              (_, i) => i !== idx
                            );
                            setMenu(updated);
                          }}
                          onReplace={() => replaceDish(mealType, idx)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500">Меню ещё не сгенерировано</p>
      )}

      {menu?.summary && (
        <div className="mt-12 bg-white rounded-xl shadow p-4 text-center text-lg font-medium">
          Итого: {menu.summary.calories} ккал / Б:{" "}
          {(menu.summary.protein || 0).toFixed(1)} г / Ж:{" "}
          {(menu.summary.fat || 0).toFixed(1)} г / У:{" "}
          {(menu.summary.carbs || 0).toFixed(1)} г
        </div>
      )}
    </div>
  );
}

export default Home;
