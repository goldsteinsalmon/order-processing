
import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const ProductDetailsPage: React.FC = () => {
  const { products, updateProduct, orders, completedOrders } = useData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const product = products.find(product => product.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(product ? { ...product } : null);
  
  // Date range filter for purchase history
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Calculate purchase history for this product
  const purchaseHistory = useMemo(() => {
    if (!product) return [];

    // Combine all orders (active + completed)
    const allOrders = [...orders, ...completedOrders];
    
    // Filter orders by date if date filters are applied
    let filteredOrders = allOrders;
    if (dateFrom || dateTo) {
      filteredOrders = allOrders.filter(order => {
        const orderDate = order.orderDate ? parseISO(order.orderDate) : parseISO(order.created);
        
        if (dateFrom && dateTo) {
          return isWithinInterval(orderDate, {
            start: startOfDay(dateFrom),
            end: endOfDay(dateTo)
          });
        } else if (dateFrom) {
          return orderDate >= startOfDay(dateFrom);
        } else if (dateTo) {
          return orderDate <= endOfDay(dateTo);
        }
        return true;
      });
    }
    
    // Get all orders with this product and calculate total quantity
    let totalQuantity = 0;
    
    filteredOrders.forEach(order => {
      if (!order.items) return;
      
      // Find items with this product
      const productItems = order.items.filter(item => item.productId === product.id);
      if (productItems.length === 0) return;
      
      // Sum quantities for this order
      const quantityForOrder = productItems.reduce((sum, item) => sum + item.quantity, 0);
      totalQuantity += quantityForOrder;
    });
    
    return totalQuantity;
  }, [product, orders, completedOrders, dateFrom, dateTo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedProduct) return;
    
    const { name, value } = e.target;
    setEditedProduct({
      ...editedProduct,
      [name]: name === "stockLevel" || name === "weight" ? Number(value) : value,
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (!editedProduct) return;
    
    setEditedProduct({
      ...editedProduct,
      requiresWeightInput: checked
    });
  };

  const handleSave = () => {
    if (!editedProduct) return;
    updateProduct(editedProduct);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProduct({ ...product });
    setIsEditing(false);
  };

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  if (!product) {
    return (
      <Layout>
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/products")} className="mr-4">
            <ArrowLeft className="mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Product Not Found</h2>
        </div>
        <div className="bg-white p-6 rounded-md shadow-sm">
          <p>The product you're looking for doesn't exist or may have been removed.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/products")} className="mr-4">
          <ArrowLeft className="mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">{product.name}</h2>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <div className="bg-white p-6 rounded-md shadow-sm">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Product Information</h3>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit Product</Button>
              ) : (
                <div className="space-x-2">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Product Name
                        </label>
                        <Input
                          name="name"
                          value={editedProduct?.name || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          SKU
                        </label>
                        <Input
                          name="sku"
                          value={editedProduct?.sku || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Stock Level
                        </label>
                        <Input
                          name="stockLevel"
                          type="number"
                          value={editedProduct?.stockLevel || 0}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Weight (grams)
                        </label>
                        <Input
                          name="weight"
                          type="number"
                          value={editedProduct?.weight || 0}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="requiresWeightInput" 
                          checked={editedProduct?.requiresWeightInput || false}
                          onCheckedChange={handleCheckboxChange}
                        />
                        <label 
                          htmlFor="requiresWeightInput" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Requires weight input during picking
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="text-gray-600">Product Name:</span>
                        <span className="col-span-2 font-medium">{product.name}</span>
                      </div>
                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="text-gray-600">SKU:</span>
                        <span className="col-span-2 font-medium">{product.sku}</span>
                      </div>
                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="text-gray-600">Stock Level:</span>
                        <span className="col-span-2 font-medium">{product.stockLevel}</span>
                      </div>
                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="text-gray-600">Weight:</span>
                        <span className="col-span-2 font-medium">{product.weight || 'N/A'} grams</span>
                      </div>
                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="text-gray-600">Requires Weight Input:</span>
                        <span className="col-span-2 font-medium">{product.requiresWeightInput ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Description</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      name="description"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
                      value={editedProduct?.description || ""}
                      onChange={handleChange}
                    />
                  </div>
                ) : (
                  <p className="text-gray-700">{product.description || "No description provided."}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] pl-3 text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className="pointer-events-auto"
                        disabled={(date) => date.getDay() === 0 || date.getDay() === 6} // Disable Saturday and Sunday
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] pl-3 text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        disabled={(date) => 
                          (dateFrom ? date < dateFrom : false) || 
                          date.getDay() === 0 || 
                          date.getDay() === 6 // Disable Saturday and Sunday
                        }
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <Button variant="outline" onClick={clearDateFilters}>
                  Clear Filters
                </Button>
              </div>
              
              <div className="mb-4 p-6 border rounded-md bg-gray-50">
                <div className="text-lg font-medium">Total Sales: <span className="text-xl font-bold">{purchaseHistory}</span></div>
                {(dateFrom || dateTo) && (
                  <div className="text-sm text-gray-500 mt-1">
                    {dateFrom && dateTo && `From ${format(dateFrom, "PPP")} to ${format(dateTo, "PPP")}`}
                    {dateFrom && !dateTo && `From ${format(dateFrom, "PPP")}`}
                    {!dateFrom && dateTo && `Until ${format(dateTo, "PPP")}`}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default ProductDetailsPage;
