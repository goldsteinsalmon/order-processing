
import React, { useMemo } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { format, parseISO } from "date-fns";
import { MissingItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MissingItemsPage: React.FC = () => {
  const { missingItems, removeMissingItem } = useData();
  const navigate = useNavigate();
  
  // Group missing items by product
  const groupedByProduct = useMemo(() => {
    const grouped: Record<string, {
      product: { id: string; name: string; sku: string; };
      items: MissingItem[];
      totalQuantity: number;
    }> = {};
    
    missingItems.forEach((item) => {
      const productId = item.product.id;
      if (!grouped[productId]) {
        grouped[productId] = {
          product: {
            id: productId,
            name: item.product.name,
            sku: item.product.sku
          },
          items: [],
          totalQuantity: 0
        };
      }
      
      grouped[productId].items.push(item);
      grouped[productId].totalQuantity += item.quantity;
    });
    
    return Object.values(grouped);
  }, [missingItems]);

  const handleResolveItem = (itemId: string) => {
    removeMissingItem(itemId);
  };

  const handleGoToOrder = (orderId: string) => {
    navigate(`/picking-list/${orderId}`);
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Missing Items</h2>
      
      {groupedByProduct.length === 0 ? (
        <div className="bg-white p-6 rounded-md shadow-sm text-center text-gray-500">
          No missing items found
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByProduct.map((group) => (
            <div key={group.product.id} className="rounded-md border overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-medium">
                  {group.product.name} (SKU: {group.product.sku})
                </h3>
                <p className="text-sm text-gray-600">
                  Total Missing: <span className="font-semibold">{group.totalQuantity}</span>
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium">Order ID</th>
                      <th className="px-4 py-3 text-left font-medium">Quantity Missing</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Customer</th>
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-3">{item.orderId.substring(0, 8)}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">
                          {format(parseISO(item.date), "dd/MM/yyyy")}
                        </td>
                        <td className="px-4 py-3">{item.order?.customer?.name || "Unknown"}</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGoToOrder(item.orderId)}
                            >
                              Edit Order
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex items-center"
                              onClick={() => handleResolveItem(item.id)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Resolve
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-4 py-3 font-medium">Total</td>
                      <td className="px-4 py-3 font-medium">{group.totalQuantity}</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default MissingItemsPage;
