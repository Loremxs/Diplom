import React from "react";
function MenuCard({ name, calories, protein, fat, carbs }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition">
      <h2 className="text-xl font-semibold mb-2">{name}</h2>
      <p>Калории: {calories} ккал</p>
      <p>Белки: {protein} г</p>
      <p>Жиры: {fat} г</p>
      <p>Углеводы: {carbs} г</p>
    </div>
  );
}

export default MenuCard;
