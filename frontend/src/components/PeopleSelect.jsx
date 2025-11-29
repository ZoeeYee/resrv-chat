import React from "react";

export default function PeopleSelect({ maxPeople = 10, value, onChange, rounded = "full" }) {
  const roundedClass = rounded === "full" ? "rounded-full" : "rounded-md";
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">👤</span>
      <select
        value={value}
        onChange={onChange}
        className={`pl-10 pr-8 py-2 w-full ${roundedClass} border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22a2a] appearance-none bg-white`}
      >
        {Array.from({ length: maxPeople }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1} 位
          </option>
        ))}
        <option value={`${maxPeople}+`}>{maxPeople} 位以上</option>
      </select>
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
    </div>
  );
}
