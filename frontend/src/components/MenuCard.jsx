import React from "react";

function MenuCard({
  name,
  calories,
  protein,
  fat,
  carbs,
  onDelete,
  onReplace,
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow relative">
      {(onDelete || onReplace) && (
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
          {onDelete && (
            <button onClick={onDelete} title="Удалить блюдо">
              <img
                src="/remove.png"
                alt="Удалить"
                className="w-5 h-5 hover:scale-110 transition-transform"
              />
            </button>
          )}
          {onReplace && (
            <button onClick={onReplace} title="Заменить блюдо">
              <img
                src="/replace.png"
                alt="Заменить"
                className="w-5 h-5 hover:scale-110 transition-transform"
              />
            </button>
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-gray-700">
        {calories} ккал — Б: {protein}, Ж: {fat}, У: {carbs}
      </p>
    </div>
  );
}

export default MenuCard;
