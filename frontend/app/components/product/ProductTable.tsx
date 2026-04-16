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
    // Bạn có thể thêm logic lưu vào localstorage hoặc gọi API giỏ hàng ở đây
  };

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tên sản phẩm</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Giá hiện tại</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            // Fix lỗi undefined bằng cách đặt giá trị mặc định là 0
            const displayPrice = product.displayPrice || product.current_price || 0;
            const hasDiscount = product.isVIP && product.displayPrice && product.displayPrice < product.current_price;

            return (
              <tr key={product.sku} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-blue-600">{product.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-800 font-medium">{product.product_name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-red-600">
                      {displayPrice.toLocaleString("vi-VN")} ₫
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-gray-400 line-through">
                        {product.current_price.toLocaleString("vi-VN")} ₫
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleAddToCart(product.sku)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform active:scale-95"
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
        <div className="p-10 text-center text-gray-500">
          Không tìm thấy sản phẩm nào trong kho.
        </div>
      )}
    </div>
  );
}