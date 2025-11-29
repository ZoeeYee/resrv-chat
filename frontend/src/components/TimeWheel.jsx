import React from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

export default function TimeWheel({
  value,
  onChange,
  intervalMinutes = 15,
  className = "",
}) {
  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, h) => pad2(h)), []);
  const minutes = React.useMemo(() => {
    const list = [];
    for (let m = 0; m < 60; m += intervalMinutes) list.push(pad2(m));
    return list;
  }, [intervalMinutes]);

  const [hour, setHour] = React.useState(() => (value ? value.split(":")[0] : "12"));
  const [minute, setMinute] = React.useState(() => (value ? value.split(":")[1] : pad2(0)));

  React.useEffect(() => {
    if (!value) return;
    const [h, m] = value.split(":");
    setHour(h);
    setMinute(m);
  }, [value]);

  const emit = (h, m) => {
    const v = `${h}:${m}`;
    if (onChange) onChange({ target: { value: v } });
  };

  return (
    <div className={className || "flex items-center gap-2"}>
      <select
        value={hour}
        onChange={(e) => { setHour(e.target.value); emit(e.target.value, minute); }}
        size={6}
        className="px-2 py-2 rounded-md border border-gray-300 text-sm h-32 overflow-auto bg-white"
      >
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-gray-500">:</span>
      <select
        value={minute}
        onChange={(e) => { setMinute(e.target.value); emit(hour, e.target.value); }}
        size={6}
        className="px-2 py-2 rounded-md border border-gray-300 text-sm h-32 overflow-auto bg-white"
      >
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}


