import React from "react";

function generateTimeOptions(start = "00:00", end = "23:45", intervalMinutes = 15) {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const out = [];
  for (let t = startTotal; t <= endTotal; t += intervalMinutes) {
    const h = String(Math.floor(t / 60)).padStart(2, "0");
    const m = String(t % 60).padStart(2, "0");
    out.push(`${h}:${m}`);
  }
  return out;
}

export default function TimeSelect({ value, onChange, start = "00:00", end = "23:45", intervalMinutes = 15, className = "" }) {
  const options = React.useMemo(() => generateTimeOptions(start, end, intervalMinutes), [start, end, intervalMinutes]);
  return (
    <select
      value={value}
      onChange={onChange}
      className={className || "px-3 py-2 rounded-md border border-gray-300 text-sm"}
    >
      <option value="">選擇時間</option>
      {options.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}


