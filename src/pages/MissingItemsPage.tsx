
import React from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { format, parseISO } from "date-fns";

const MissingItemsPage: React.FC = () => {
  const { missingItems } = useData();

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Missing Items</h2>
      
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">SKU</th>
                <th className="px-4 py-3 text-left font-medium">Quantity Missing</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
              </tr>
            </thead>
            <tbody>
              {missingItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No missing items found
                  </td>
                </tr>
              ) : (
                missingItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3">{item.orderId.substring(0, 8)}</td>
                    <td className="px-4 py-3">{item.product.name}</td>
                    <td className="px-4 py-3">{item.product.sku}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">
                      {format(parseISO(item.date), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 py-3">{item.order.customer.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default MissingItemsPage;
