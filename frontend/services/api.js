import axios from "axios";

const API = axios.create({
  // Lưu ý: Đảm bảo link này trùng với link ngrok đang chạy ở terminal của bạn
  baseURL: "https://nonempirically-araucarian-leia.ngrok-free.dev",
  headers: {
    "Content-Type": "application/json",
    // QUAN TRỌNG: Header này giúp gọi trực tiếp API mà không bị chặn bởi trang cảnh báo của ngrok
    "ngrok-skip-browser-warning": "69420", 
  },
});

export default API;