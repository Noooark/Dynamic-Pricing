"use client";

interface Product {
  sku: string;
  product_name: string; // Khớp với tên cột trong Supabase
  current_price: number;
  displayPrice?: number;
  isVIP?: boolean;
}

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const handleAddToCart = (sku: string) => {
    console.log(`Thêm sản phẩm ${sku} vào giỏ hàng`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/80">
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
              SKU
            </th>
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
              Tên sản phẩm
            </th>
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
              Giá hiện tại
            </th>
            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const displayPrice = product.displayPrice || product.current_price || 0;
            const hasDiscount =
              product.isVIP &&
              product.displayPrice &&
              product.displayPrice < product.current_price;

            return (
              <tr
                key={product.sku}
                className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/55"
              >
                <td className="px-5 py-5 sm:px-6">
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 font-mono text-sm font-semibold text-blue-700">
                    {product.sku}
                  </span>
                </td>
                <td className="px-5 py-5 sm:px-6">
                  <div className="max-w-md">
                    <p className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                      {product.product_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Sản phẩm điện tử chính hãng, theo dõi giá theo thời gian thực.
                    </p>
                  </div>
                </td>
                <td className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-900 sm:text-lg">
                      {displayPrice.toLocaleString("vi-VN")} ₫
                    </span>
                    {hasDiscount && (
                      <span className="mt-1 text-xs text-slate-400 line-through">
                        {product.current_price.toLocaleString("vi-VN")} ₫
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-5 text-center sm:px-6">
                  <button
                    onClick={() => handleAddToCart(product.sku)}
                    className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 hover:-translate-y-0.5 hover:bg-blue-600 active:scale-95"
                  >
                    Thêm giỏ hàng
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {products.length === 0 && (
        <div className="p-10 text-center text-slate-500">
          Không tìm thấy sản phẩm nào trong kho.
        </div>
      )}
    </div>
  );
}
