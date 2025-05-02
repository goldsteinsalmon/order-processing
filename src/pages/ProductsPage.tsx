import React, { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Eye, PackagePlus, Save, Search, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { format, addDays, startOfDay, isSameDay, parseISO } from "date-fns";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const ProductsPage: React.FC = () => {
  const { products, orders, addProduct, updateProduct } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stockAdjustments, setStockAdjustments] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Sort products by SKU
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      return (a.sku || '').localeCompare(b.sku || '');
    });
  }, [products]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return sortedProducts;
    
    const lowerSearch = searchTerm.toLowerCase();
    return sortedProducts.filter((product) => 
      product.name.toLowerCase().includes(lowerSearch) ||
      (product.sku && product.sku.toLowerCase().includes(lowerSearch))
    );
  }, [sortedProducts, searchTerm]);

  // Initialize stock adjustments
  useEffect(() => {
    const initialAdjustments: Record<string, number> = {};
    products.forEach((product) => {
      initialAdjustments[product.id] = 0;
    });
    setStockAdjustments(initialAdjustments);
  }, [products]);

  // Calculate next 7 working days (excluding weekends)
  const next7WorkingDays = useMemo(() => {
    const workingDays = [];
    let currentDate = startOfDay(new Date());
    let daysAdded = 0;
    
    while (workingDays.length < 7) {
      daysAdded++;
      currentDate = addDays(startOfDay(new Date()), daysAdded);
      
      // Skip weekends (0 is Sunday, 6 is Saturday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays.push(currentDate);
      }
    }
    
    return workingDays;
  }, []);

  // Calculate forecast for each product
  const productForecasts = useMemo(() => {
    const forecasts: Record<string, Record<string, number>> = {};
    
    // Initialize forecasts for all products and dates
    products.forEach((product) => {
      forecasts[product.id] = {};
      next7WorkingDays.forEach((day) => {
        forecasts[product.id][format(day, "yyyy-MM-dd")] = 0;
      });
    });
    
    // Count products needed for each day from pending orders
    orders.forEach((order) => {
      if (order.status === "Pending" || order.status === "Processing") {
        const orderDate = parseISO(order.requiredDate || order.order_date);
        
        // Only consider orders going out in the next 7 working days
        const matchingDay = next7WorkingDays.find((day) => isSameDay(day, orderDate));
        if (matchingDay) {
          const dateKey = format(matchingDay, "yyyy-MM-dd");
          
          order.items.forEach((item) => {
            if (forecasts[item.productId] && forecasts[item.productId][dateKey] !== undefined) {
              forecasts[item.productId][dateKey] += item.quantity;
            }
          });
        }
      }
    });
    
    return forecasts;
  }, [next7WorkingDays, products, orders]);

  // Handle stock adjustment
  const handleStockAdjustment = (productId: string, value: string) => {
    const adjustment = parseInt(value) || 0;
    setStockAdjustments({
      ...stockAdjustments,
      [productId]: adjustment
    });
    setHasChanges(true);
  };

  const handleSaveStockAdjustments = () => {
    const updatedProducts = products.map((product) => {
      const adjustment = stockAdjustments[product.id] || 0;
      if (adjustment !== 0) {
        return {
          ...product,
          stock_level: product.stock_level + adjustment
        };
      }
      return product;
    });
    
    // Update only products that have changes
    updatedProducts.forEach((product) => {
      const originalProduct = products.find((p) => p.id === product.id);
      if (originalProduct && originalProduct.stock_level !== product.stock_level) {
        updateProduct(product);
      }
    });
    
    // Reset adjustments
    const resetAdjustments: Record<string, number> = {};
    products.forEach((product) => {
      resetAdjustments[product.id] = 0;
    });
    
    setStockAdjustments(resetAdjustments);
    setHasChanges(false);
    
    // Show success toast
    toast({
      title: "Stock Updated",
      description: "Stock levels have been successfully updated."
    });
  };

  // Handle duplicate product
  const handleDuplicateProduct = (productId: string) => {
    const productToDuplicate = products.find(p => p.id === productId);
    if (!productToDuplicate) return;
    
    // Navigate to create product page with state containing the product to duplicate
    navigate("/create-product", { 
      state: { 
        duplicateFrom: productToDuplicate,
        isDuplicating: true
      } 
    });
  };

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Products</h2>
        <Button onClick={() => navigate("/create-product")}>
          <PackagePlus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      
      {hasChanges && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex justify-between items-center">
          <p className="text-yellow-800">You have unsaved stock adjustments.</p>
          <Button onClick={handleSaveStockAdjustments} className="bg-green-600 hover:bg-green-700">
            <Save className="mr-2 h-4 w-4" /> Save Adjustments
          </Button>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Weight (g)</TableHead>
                <TableHead>Requires Weight</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Add Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    {searchTerm ? "No matching products found" : "No products found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.requiresWeightInput ? "N/A" : (product.weight || "N/A")}</TableCell>
                    <TableCell>
                      {product.requiresWeightInput ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          No
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{product.stock_level}</TableCell>
                    <TableCell className="w-40">
                      <div className="flex items-center">
                        <Input
                          type="number"
                          value={stockAdjustments[product.id] || ""}
                          onChange={(e) => handleStockAdjustment(product.id, e.target.value)}
                          className="w-24 text-right"
                          placeholder="Qty"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateProduct(product.id)}
                        >
                          <Copy className="h-4 w-4 mr-1" /> Duplicate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-semibold">Stock Forecast (Next 7 Working Days)</h3>
            <p className="text-sm text-gray-600">Shows products needed for pending orders by date</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium">SKU</th>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Current Stock</th>
                  {next7WorkingDays.map((day) => (
                    <th key={format(day, "yyyy-MM-dd")} className="px-4 py-3 text-center font-medium">
                      {format(day, "dd/MM")}
                      <div className="text-xs font-normal text-gray-500">
                        {format(day, "EEE")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3 + next7WorkingDays.length} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm ? "No matching products found" : "No products found"}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    // Calculate running stock level
                    let runningStock = product.stock_level;
                    const dailyStocks: Record<string, number> = {};
                    
                    next7WorkingDays.forEach((day) => {
                      const dateKey = format(day, "yyyy-MM-dd");
                      const dailyUsage = productForecasts[product.id]?.[dateKey] || 0;
                      runningStock -= dailyUsage;
                      dailyStocks[dateKey] = runningStock;
                    });
                    
                    return (
                      <tr key={product.id} className="border-b">
                        <td className="px-4 py-3">{product.sku}</td>
                        <td className="px-4 py-3">{product.name}</td>
                        <td className="px-4 py-3">{product.stock_level}</td>
                        {next7WorkingDays.map((day) => {
                          const dateKey = format(day, "yyyy-MM-dd");
                          const dailyUsage = productForecasts[product.id]?.[dateKey] || 0;
                          const remainingStock = dailyStocks[dateKey];
                          
                          // Determine cell color based on stock level - modified to not highlight zero values
                          let cellClass = "px-4 py-3 text-center";
                          if (remainingStock < 0) {
                            cellClass += " bg-red-100 text-red-800";
                          } else if (remainingStock > 0 && remainingStock < 10) {
                            cellClass += " bg-yellow-100 text-yellow-800";
                          }
                          
                          return (
                            <td key={dateKey} className={cellClass}>
                              {dailyUsage > 0 && (
                                <span className="block text-xs">(-{dailyUsage})</span>
                              )}
                              <span className={remainingStock < 0 ? "font-bold" : ""}>
                                {remainingStock}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductsPage;
