// src/pages/RestaurantDetail.jsx
import React from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import restaurants from "../data/restaurants";
import PeopleSelect from "../components/PeopleSelect";
import { useAppState } from "../context/AppState";
import TimeSlots from "../components/TimeSlots";

function getTaiwanTimeNow() {
  const now = new Date();
  const tw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const hours = tw.getHours();
  const minutes = tw.getMinutes();
  // 對齊到最接近的15分鐘（0, 15, 30, 45）
  const roundedMinutes = Math.round(minutes / 15) * 15;
  let h = hours;
  let m = roundedMinutes;
  // 如果分鐘數達到60，進位到小時
  if (m >= 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getTaiwanDateToday() {
  const now = new Date();
  const tw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const year = tw.getFullYear();
  const month = String(tw.getMonth() + 1).padStart(2, "0");
  const day = String(tw.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTimeRangeAroundNow() {
  const now = new Date();
  const tw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const hours = tw.getHours();
  const minutes = tw.getMinutes();
  // 對齊到最接近的15分鐘（向上取整）
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  let h = hours;
  let m = roundedMinutes;
  // 如果分鐘數達到60，進位到小時
  if (m >= 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  const currentTimeMins = h * 60 + m;
  // 計算前後1小時（正負1小時，共2小時的範圍）
  const startMins = Math.max(0, currentTimeMins - 60); // 前1小時
  const endMins = Math.min(23 * 60 + 45, currentTimeMins + 60); // 後1小時
  
  // 將分鐘數轉換為HH:MM格式
  const toHHMM = (mins) => {
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  
  // 生成時間範圍內的所有15分鐘間隔
  const slots = [];
  for (let t = Math.floor(startMins / 15) * 15; t <= Math.floor(endMins / 15) * 15; t += 15) {
    if (t >= 0 && t <= 23 * 60 + 45) {
      slots.push(toHHMM(t));
    }
  }
  
  return {
    current: toHHMM(currentTimeMins),
    start: toHHMM(startMins),
    end: toHHMM(endMins),
    slots: slots
  };
}

export default function RestaurantDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const restaurantId = Number(id);
  const restaurant = restaurants.find(r => r.id === restaurantId);
  const { isFavorite, toggleFavorite, reviewsMap, addReview, deleteReview, updateReview, addBooking, deleteBooking, updateBooking, getBookingsByRestaurant } = useAppState();
  const [date, setDate] = React.useState(() => getTaiwanDateToday());
  const timeRange = React.useMemo(() => getTimeRangeAroundNow(), []);
  const [time, setTime] = React.useState(() => timeRange.current);
  const [people, setPeople] = React.useState(2);
  const bookings = getBookingsByRestaurant(restaurantId);
  const bookingRef = React.useRef(null);
  const bookingsListRef = React.useRef(null);

  React.useEffect(() => {
    const qpTime = searchParams.get("time");
    if (qpTime) {
      setTime(qpTime);
      // 延遲到元素渲染後再捲動
      setTimeout(() => {
        if (bookingRef.current) bookingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [searchParams]);

  if (!restaurant) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-gray-700">找不到此餐廳。</p>
        <Link className="text-[#b22a2a] underline" to="/">回到首頁</Link>
      </div>
    );
  }

  const { name, image, location, cuisine, rating, reviews, times } = restaurant;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12">
      {/* Hero 區塊 */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 mb-6">
        <img src={image} alt={name} className="w-full h-full object-cover rounded-xl shadow" />
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg">
          <h1 className="text-xl md:text-2xl font-bold">{name}</h1>
          <p className="text-sm">{cuisine} · {location}</p>
        </div>
        <button
          type="button"
          aria-label="favorite"
          className={`absolute top-4 right-4 rounded-full px-3 py-2 text-base ${isFavorite(restaurantId) ? 'text-[#b22a2a] bg-white' : 'text-gray-700 bg-white/90'} hover:text-[#b22a2a]`}
          onClick={() => toggleFavorite(restaurantId)}
        >
          {isFavorite(restaurantId) ? '❤ 已收藏' : '♡ 收藏'}
        </button>
      </div>

      {/* 主內容：左側資訊 + 右側訂位卡 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左側資訊 */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#e4b326]">{"★".repeat(Math.round(rating))}</span>
            <span className="text-gray-700 font-medium">{rating.toFixed(1)} 分</span>
            <span className="text-gray-500">（{reviews} 則評論）</span>
          </div>

          <h2 className="text-lg font-semibold mb-2">這間餐廳介紹</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
            <li>歡樂時光首選</li>
            <li>人氣熱點</li>
            <li>鄰近首選</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">其他資訊</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
            <div>餐廳風格：休閒餐飲</div>
            <div>料理：{cuisine}</div>
            <div>位置：{location}</div>
            <div>價位：NT$999及以下</div>
          </div>
        </div>

        {/* 右側訂位區塊 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 已訂位列表 - 放在上方讓使用者更容易看到 */}
          {bookings.length > 0 && (
            <div ref={bookingsListRef} className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-[#b22a2a]">📋</span> 已訂位
                <span className="text-sm font-normal text-gray-500">({bookings.length} 筆)</span>
              </h3>
              <BookingList items={bookings} onDelete={deleteBooking} onUpdate={updateBooking} />
            </div>
          )}

          {/* 訂位卡 */}
          <aside ref={bookingRef} className="bg-white rounded-xl shadow p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4">訂位</h3>
          <form
            className="flex flex-col gap-3 mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!date || !time) return;
              addBooking({ restaurantId, restaurantName: name, date, time, people: Number(people) });
              // Reset time only, keep date and people for convenience
              setTime("");
              // 滾動到已訂位列表
              setTimeout(() => {
                if (bookingsListRef.current) {
                  bookingsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none z-10">📅</span>
              <input 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                type="date" 
                className="pl-10 pr-8 py-2 w-full rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22a2a] bg-white" 
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">▼</span>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-2">選擇時間</p>
              <div className="relative mb-3">
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="px-3 pr-8 py-2 w-full rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22a2a] appearance-none bg-white"
                >
                  {(() => {
                    const allSlots = [];
                    for (let h = 0; h < 24; h++) {
                      for (let m = 0; m < 60; m += 15) {
                        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                        allSlots.push(timeStr);
                      }
                    }
                    return allSlots.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ));
                  })()}
                </select>
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
              </div>
              {(() => {
                // 根據選擇的時間計算前後各4個時段（共9個）
                const getTimeRange = (selectedTime) => {
                  const [h, m] = selectedTime.split(":").map(Number);
                  const selectedMins = h * 60 + m;
                  // 前4個時段：每15分鐘一個，共4個，所以是 -60分鐘
                  // 後4個時段：每15分鐘一個，共4個，所以是 +60分鐘
                  const startMins = Math.max(0, selectedMins - 60);
                  const endMins = Math.min(23 * 60 + 45, selectedMins + 60);
                  
                  const toHHMM = (mins) => {
                    const hh = Math.floor(mins / 60);
                    const mm = mins % 60;
                    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
                  };
                  
                  return {
                    start: toHHMM(startMins),
                    end: toHHMM(endMins)
                  };
                };
                
                const dynamicRange = getTimeRange(time);
                
                return (
                  <TimeSlots
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    start={dynamicRange.start}
                    end={dynamicRange.end}
                    intervalMinutes={15}
                  />
                );
              })()}
            </div>
            <PeopleSelect maxPeople={20} value={people} onChange={(e) => setPeople(e.target.value)} rounded="md" />
            <button className="w-full bg-[#b22a2a] text-white py-2 rounded-md hover:bg-[#e4b326] transition" type="submit">送出訂位</button>
          </form>

          {Array.isArray(times) && times.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-700 mb-2">近期可訂位時段：</p>
              <div className="flex flex-wrap gap-2">
                {times.map((t, idx) => {
                  // 將時間格式轉換為 HH:MM (例如 "12:30" -> "12:30")
                  const normalizeTime = (timeStr) => {
                    // 如果已經是 HH:MM 格式，直接返回
                    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
                      const [h, m] = timeStr.split(":").map(Number);
                      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                    }
                    return timeStr;
                  };
                  const normalizedTime = normalizeTime(t);
                  const isSelected = time === normalizedTime;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTime(normalizedTime)}
                      className={`border px-2 py-1 text-xs rounded transition ${
                        isSelected
                          ? "bg-[#b22a2a] border-[#b22a2a] text-white"
                          : "border-[#b22a2a] text-[#b22a2a] hover:bg-[#e4b326] hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
        </div>
      </div>

      {/* 使用者評論 */}
      <div className="mt-8 bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">使用者評論</h3>
        <ReviewForm onSubmit={(r) => addReview(restaurantId, r)} />
        <ReviewList items={reviewsMap[restaurantId] || []} restaurantId={restaurantId} onDelete={deleteReview} onUpdate={updateReview} />
      </div>

      {/* 返回 */}
      <div className="mt-6">
        <Link className="text-[#b22a2a] underline" to="/">← 返回列表</Link>
      </div>
    </div>
  );
}

function ReviewForm({ onSubmit }) {
  const [name, setName] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  return (
    <form
      className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6"
      onSubmit={(e) => { e.preventDefault(); onSubmit({ name, rating, comment }); setComment(""); }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的名字（可留空）" className="px-3 py-2 rounded-md border border-gray-300 text-sm" />
      <select value={rating} onChange={(e) => setRating(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 text-sm">
        {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} 星</option>)}
      </select>
      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="寫下你的評論" className="px-3 py-2 rounded-md border border-gray-300 text-sm md:col-span-2" />
      <button className="bg-[#b22a2a] text-white px-4 py-2 rounded-md hover:bg-[#e4b326] transition">送出評論</button>
    </form>
  );
}

function ReviewList({ items, restaurantId, onDelete, onUpdate }) {
  const [editingId, setEditingId] = React.useState(null);
  const [editRating, setEditRating] = React.useState(5);
  const [editComment, setEditComment] = React.useState("");

  if (!items.length) return <p className="text-sm text-gray-600">還沒有評論，成為第一個評論的人吧！</p>;
  
  const handleStartEdit = (review) => {
    setEditingId(review.reviewId || Date.now().toString());
    setEditRating(review.rating || 5);
    setEditComment(review.comment || "");
  };

  const handleSaveEdit = (reviewId) => {
    onUpdate(restaurantId, reviewId, { rating: editRating, comment: editComment });
    setEditingId(null);
  };

  return (
    <ul className="space-y-4">
      {items.map((r, i) => {
        const reviewId = r.reviewId || `review_${i}_${r.createdAt}`;
        const isEditing = editingId === reviewId;
        
        return (
          <li key={i} className="border border-gray-100 rounded-lg p-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">{r.name || '匿名'}</span>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">星級：</span>
                  <select value={editRating} onChange={(e) => setEditRating(e.target.value)} className="px-2 py-1 rounded border border-gray-300 text-sm">
                    {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} 星</option>)}
                  </select>
                </div>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                  rows="3"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleSaveEdit(reviewId)} className="px-3 py-1 bg-[#b22a2a] text-white text-sm rounded hover:bg-[#e4b326]">儲存</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400">取消</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{r.name || '匿名'}</span>
                    <span className="text-[#e4b326]">{"★".repeat(r.rating || 5)}</span>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleStartEdit(r)} className="text-xs text-[#b22a2a] hover:underline">編輯</button>
                    <button onClick={() => onDelete(restaurantId, reviewId)} className="text-xs text-red-500 hover:underline">刪除</button>
                  </div>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{r.comment}</p>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BookingList({ items, onDelete, onUpdate }) {
  const [editingId, setEditingId] = React.useState(null);
  const [editDate, setEditDate] = React.useState("");
  const [editTime, setEditTime] = React.useState("");

  const isBookingPast = (booking) => {
    const now = new Date();
    const tw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const bookingDate = new Date(`${booking.date}T${booking.time}`);
    return bookingDate < tw;
  };

  if (!items.length) return <p className="text-sm text-gray-600">目前沒有任何訂位。</p>;
  
  const handleStartEdit = (booking) => {
    setEditingId(booking.bookingId || Date.now().toString());
    setEditDate(booking.date);
    setEditTime(booking.time);
  };

  const handleSaveEdit = (bookingId) => {
    onUpdate(bookingId, { date: editDate, time: editTime });
    setEditingId(null);
  };

  // 生成所有15分钟间隔的时间选项
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
    <ul className="divide-y divide-gray-100">
      {items.map((b, i) => {
        const bookingId = b.bookingId || `booking_${i}_${b.createdAt}`;
        const isEditing = editingId === bookingId;
        const isPast = isBookingPast(b);
        
        return (
          <li key={i} className={`py-3 ${isPast ? 'opacity-50 bg-gray-50' : ''}`}>
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
              <div className="space-y-2">
                <div className="font-medium text-gray-800">{b.restaurantName}</div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                  <span>📅 {b.date}</span>
                  <span>🕐 {b.time}</span>
                  <span>👥 {b.people} 位</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400">建立於 {new Date(b.createdAt).toLocaleString()}</span>
                  {!isPast && (
                    <div className="flex gap-3">
                      <button onClick={() => handleStartEdit(b)} className="text-xs text-[#b22a2a] hover:underline">編輯</button>
                      <button onClick={() => onDelete(bookingId)} className="text-xs text-red-500 hover:underline">刪除</button>
                    </div>
                  )}
                  {isPast && <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">已過期</span>}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}


