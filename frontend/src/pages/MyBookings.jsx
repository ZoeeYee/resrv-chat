import React from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../context/AppState";

export default function MyBookings() {
  const { bookings, deleteBooking, updateBooking } = useAppState();
  const [editingId, setEditingId] = React.useState(null);
  const [editDate, setEditDate] = React.useState("");
  const [editTime, setEditTime] = React.useState("");
  const has = bookings && bookings.length > 0;

  const isBookingPast = (booking) => {
    const now = new Date();
    const tw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const bookingDate = new Date(`${booking.date}T${booking.time}`);
    return bookingDate < tw;
  };

  const handleStartEdit = (booking) => {
    setEditingId(booking.bookingId || Date.now().toString());
    setEditDate(booking.date);
    setEditTime(booking.time);
  };

  const handleSaveEdit = (bookingId) => {
    updateBooking(bookingId, { date: editDate, time: editTime });
    setEditingId(null);
  };

  const getAllTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return slots;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12">
      <h1 className="text-2xl font-bold mb-6">我的訂位</h1>
      {!has ? (
        <div className="bg-white rounded-xl shadow p-6 text-gray-700">
          目前沒有任何訂位，去
          <Link className="text-[#b22a2a] underline mx-1" to="/">探索餐廳</Link>
          吧！
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow">
          <ul className="divide-y divide-gray-100">
            {bookings.map((b, i) => {
              const bookingId = b.bookingId || `booking_${i}_${b.createdAt}`;
              const isEditing = editingId === bookingId;
              const isPast = isBookingPast(b);
              
              return (
                <li key={i} className={`p-4 ${isPast ? 'opacity-50 bg-gray-50' : ''}`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="px-3 pr-8 py-2 rounded-md border border-gray-300 text-sm relative z-10"
                            style={{ width: '150px' }}
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-20">▼</span>
                        </div>
                        <div className="relative">
                          <select
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="px-3 pr-8 py-2 rounded-md border border-gray-300 text-sm appearance-none bg-white relative z-10"
                            style={{ width: '100px' }}
                          >
                            {getAllTimeSlots().map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">▼</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(bookingId)} className="px-3 py-1 bg-[#b22a2a] text-white text-sm rounded hover:bg-[#e4b326]">儲存</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400">取消</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-800">
                        <Link className="text-[#b22a2a] font-semibold hover:underline" to={`/restaurant/${b.restaurantId}`}>
                          {b.restaurantName}
                        </Link>
                        <span className="mx-2 text-gray-400">|</span>
                        <span>{b.date}</span>
                        <span className="mx-1">{b.time}</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span>{b.people} 位</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">建立於 {new Date(b.createdAt).toLocaleString()}</span>
                        {!isPast && (
                          <div className="flex gap-2">
                            <button onClick={() => handleStartEdit(b)} className="text-xs text-[#b22a2a] hover:underline">編輯</button>
                            <button onClick={() => deleteBooking(bookingId)} className="text-xs text-red-500 hover:underline">刪除</button>
                          </div>
                        )}
                        {isPast && <span className="text-xs text-gray-400">已過期</span>}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}


