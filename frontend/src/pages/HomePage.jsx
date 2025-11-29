// src/pages/HomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import CarouselSection from "../components/CarouselSection";
import RestaurantCard from "../components/RestaurantCard";
import restaurants from "../data/restaurants";
import { useAppState } from "../context/AppState";

export default function HomePage() {
  const navigate = useNavigate();
  const { favoriteIds, isFavorite } = useAppState();
  const favoriteRestaurants = restaurants.filter(r => isFavorite(r.id));
  
  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* 第一個區塊：我的收藏 */}
      {favoriteRestaurants.length > 0 ? (
        <CarouselSection title="我的收藏" restaurants={favoriteRestaurants} />
      ) : (
        <div className="my-8">
          <h3 className="text-xl font-bold mb-2">我的收藏</h3>
          <p className="text-gray-600">還沒有收藏任何餐廳，快去探索並收藏你喜歡的餐廳吧！</p>
        </div>
      )}

      {/* 第二個區塊：現在可訂位的熱門餐廳 */}
      <h2 className="text-2xl font-bold my-6">現在可訂位的熱門餐廳</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {restaurants.map((item) => (
          <RestaurantCard
            key={item.id}
            {...item}
            onClick={() => navigate(`/restaurant/${item.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
