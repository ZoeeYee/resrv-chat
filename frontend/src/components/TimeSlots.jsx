import React from "react";

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function formatZhTW(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function TimeSlots({
  value,
  onChange,
  start = "00:00",
  end = "23:45",
  intervalMinutes = 15,
  className = "",
  disabled = false,
}) {
  const startM = toMinutes(start);
  const endM = toMinutes(end);
  const slots = React.useMemo(() => {
    const out = [];
    for (let t = startM; t <= endM; t += intervalMinutes) {
      out.push(fromMinutes(t));
    }
    return out;
  }, [startM, endM, intervalMinutes]);

  return (
    <div className={className || "grid grid-cols-4 gap-2"}>
      {slots.map((t) => {
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            disabled={disabled}
            onClick={() => onChange && onChange({ target: { value: t } })}
            className={
              `px-3 py-1 rounded border text-sm transition ` +
              (active
                ? "bg-[#b22a2a] border-[#b22a2a] text-white"
                : "border-[#b22a2a] text-[#b22a2a] hover:bg-[#e4b326] hover:text-white")
            }
          >
            {formatZhTW(t)}
          </button>
        );
      })}
    </div>
  );
}


