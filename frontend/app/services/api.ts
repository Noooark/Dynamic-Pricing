import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',   // hoặc URL ngrok của backend
  timeout: 10000,
});

export default API;