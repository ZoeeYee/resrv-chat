// src/data/restaurants.js
import base64Images from "../utils/base64Images";

const restaurants = [
  { id: 0, name: "築間幸福鍋物 台北農安店", image: base64Images.hotpot, location:"中山區", cuisine:"涮涮鍋", rating:4.5, reviews:14, times:["12:30","13:00","13:30"], },
  { id: 1, name: "八八燒肉", image: base64Images.bbq, location:"信義區", cuisine:"燒烤", rating:4.2, reviews:28, times:["12:15","12:45","13:15"], },
  { id: 2, name: "勺日咖啡 (Zhuori Coffee Table)", image: base64Images.cafe, location:"大安區", cuisine:"咖啡", rating:5.0, reviews:8, times:["12:30","13:00"], },
  { id: 3, name: "饗辣 台北捷運西門店", image: base64Images.spicy, location:"萬華區", cuisine:"麻辣鍋", rating:4.8, reviews:20, times:["12:30","13:00"], },
  { id: 4, name: "泰滾 Rolling Thai 南京店", image: base64Images.thai, location:"中山區", cuisine:"泰式火鍋", rating:4.6, reviews:15, times:["12:00","12:30"], },
  { id: 5, name: "和牛涮 日式鍋物放題 板橋店", image: base64Images.wagyu, location:"板橋區", cuisine:"日式火鍋", rating:4.7, reviews:18, times:["11:30","12:00"], },
  { id: 6, name: "串在一起平價串燒", image: base64Images.izakaya, location:"士林區", cuisine:"串燒", rating:4.3, reviews:12, times:["18:00","18:30"], },
  { id: 7, name: "Book ing bar 中山", image: base64Images.bar, location:"中山區", cuisine:"酒吧", rating:4.9, reviews:30, times:["20:00","21:00"], },
];
export default restaurants;
