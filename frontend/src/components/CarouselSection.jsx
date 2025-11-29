import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import RestaurantCard from "./RestaurantCard";

export default function CarouselSection({ title, restaurants }) {

  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const scrollByOffset = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold">{title}</h3>
        <button className="text-sm text-red-500 hover:underline">查看全部</button>
      </div>
      <div className="relative">
        {/* 左箭頭 */}
        <button
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 px-2 py-1 rounded-full bg-white shadow hidden lg:block hover:bg-gray-200"
          onClick={() => scrollByOffset(-300)}
        >
          ‹
        </button>

        {/* 卡片容器 */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto space-x-4 scrollbar-hide pr-8"
        >
          {restaurants.map((item, index) => (
            <div key={index} className="flex-shrink-0 w-64">
              <RestaurantCard {...item} onClick={() => navigate(`/restaurant/${item.id}`)} />
            </div>
          ))}
        </div>

        {/* 右箭頭 */}
        <button
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 px-2 py-1 rounded-full bg-white shadow hidden lg:block hover:bg-gray-200"
          onClick={() => scrollByOffset(300)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
