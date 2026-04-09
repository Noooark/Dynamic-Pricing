"use client";

import { useEffect, useState } from "react";
import API from "../services/api";

export default function Home() {
  const [products, setProducts] = useState<string[][]>([]);

  useEffect(() => {
    API.get("/products")
      .then((res: { data: string[][] }) => {
        setProducts(res.data);
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Products</h1>

      {products.map((row, i) => (
        <div key={i}>
          {row.join(" - ")}
        </div>
      ))}
    </div>
  );
}