import React from "react";
import { useAppState } from "../context/AppState";
import { useNavigate } from "react-router-dom";

export default function RestaurantCard({
  id,
  name,
  image,
  location,
  cuisine,
  rating,
  reviews,
  times,
  onClick,
}) {
  const { isFavorite, toggleFavorite } = useAppState();
  const navigate = useNavigate();
  const stars = Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={i < Math.round(rating) ? "text-[#e4b326]" : "text-gray-300"} // 金黃星星
    >
      ★
    </span>
  ));

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition transform hover:scale-105 cursor-pointer relative"
      onClick={onClick}
    >
      <button
        type="button"
        aria-label="favorite"
        className={`absolute top-2 right-2 rounded-full p-2 text-sm ${isFavorite(id) ? 'text-[#b22a2a] bg-white' : 'text-gray-500 bg-white/90'} hover:text-[#b22a2a]`}
        onClick={(e) => { e.stopPropagation(); toggleFavorite(id); }}
      >
        {isFavorite(id) ? '❤' : '♡'}
      </button>
      <img
        src={image}
        alt={name}
        className="w-full h-40 object-cover rounded-t-lg"
      />
      <div className="p-4">
        <h4 className="font-bold text-base mb-1 truncate text-[#b22a2a]">
          {name}
        </h4>
        <p className="text-xs text-gray-500 mb-2">
          {cuisine} · {location}
        </p>
        <div className="flex items-center text-xs mb-3">
          {stars}
          <span className="ml-1 text-gray-700">{rating.toFixed(1)} 分</span>
          <span className="ml-1 text-gray-500">({reviews} 則評論)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {times.map((t, idx) => (
            <button
              key={idx}
              className="border border-[#b22a2a] text-[#b22a2a] px-2 py-1 text-xs rounded hover:bg-[#e4b326] hover:text-white transition"
              onClick={(e) => { e.stopPropagation(); navigate(`/restaurant/${id}?time=${encodeURIComponent(t)}`); }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
