import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer, Plus, Minus, Package, PackagePlus, Boxes, Weight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderItem, Box, BoxItem } from "@/types";
import { Badge } from "@/components/ui/badge";

// Interface for box distribution of products
interface BoxDistribution {
  boxNumber: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    weight: number;
  }[];
  totalBoxWeight: number;
}

// Interface for product box settings
interface ProductBoxSetting {
  boxCount: number;
  itemsPerBox: number;
  manualDistribution: boolean;
}

const PrintBoxLabel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const specificBoxParam = searchParams.get('box');
  
  const navigate = useNavigate();
  const { orders, completedOrders } = useData();
  
  // Check in both orders and completedOrders since the order might have just been moved
  const order = [...orders, ...completedOrders].find(order => order.id === id);
  
  const [labelCount, setLabelCount] = useState<number>(1);
  const [boxDistributions, setBoxDistributions] = useState<BoxDistribution[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  
  // Product-specific box settings
  const [productBoxes, setProductBoxes] = useState<Record<string, ProductBoxSetting>>({});

  // Set document title
  useEffect(() => {
    document.title = `Box Label - ${order?.customer.name || "Order"}`;
  }, [order]);

  // Set selected box from URL parameter
  useEffect(() => {
    if (specificBoxParam) {
      const boxNumber = parseInt(specificBoxParam);
      if (!isNaN(boxNumber)) {
        setSelectedBox(boxNumber);
      }
    }
  }, [specificBoxParam]);

  // Initialize from box distributions if they exist
  useEffect(() => {
    if (!order) return;
    
    if (order.boxDistributions && order.boxDistributions.length > 0) {
      // Convert the order's box distributions to the format we need
      const distributions = order.boxDistributions.map(box => {
        // Calculate box weight from the items and any manually entered weights
        let totalBoxWeight = 0;
        
        // Map the items and include any picked weights
        const updatedItems = box.items.map(item => {
          // Find the original order item to get the manually entered weight if available
          const orderItem = order.items.find(oi => 
            oi.productId === item.productId && 
            oi.boxNumber === box.boxNumber
          );
          
          // Use picked weight from order item if it exists and requires weight input
          const weight = orderItem && orderItem.product.requiresWeightInput && orderItem.pickedWeight
            ? orderItem.pickedWeight
            : item.weight;
          
          totalBoxWeight += weight || 0;
          
          return {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            weight: weight || 0
          };
        });
        
        return {
          boxNumber: box.boxNumber,
          items: updatedItems,
          totalBoxWeight
        };
      });
      
      // Calculate the true total weight across all boxes
      const calculatedTotalWeight = distributions.reduce((sum, box) => sum + box.totalBoxWeight, 0);
      
      setBoxDistributions(distributions);
      setTotalWeight(calculatedTotalWeight);
      
      console.log("Box distributions with weights:", distributions);
      console.log("Total weight calculated:", calculatedTotalWeight);
      
      return;
    }

    // Initialize product box settings
    if (order) {
      const initialProductBoxes: Record<string, ProductBoxSetting> = {};
      
      order.items.forEach(item => {
        // For each product, initialize with default values
        initialProductBoxes[item.id] = {
          boxCount: 1,
          itemsPerBox: item.quantity,
          manualDistribution: false
        };
      });
      
      setProductBoxes(initialProductBoxes);
      
      // Generate initial box distribution
      if (order.customer.needsDetailedBoxLabels) {
        generateBoxDistributions();
      }
    }
  }, [order]);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleBackToOrders = () => {
    if (order.status === "Completed") {
      navigate("/completed-orders");
    } else {
      navigate("/");
    }
  };

  const handleBackToPicking = () => {
    if (id) {
      navigate(`/picking-list/${id}`);
    }
  };

  // Handle changes to box count
  const handleBoxCountChange = (itemId: string, value: number) => {
    const item = order.items.find(i => i.id === itemId);
    if (!item) return;
    
    const newCount = Math.max(1, value);
    const newItemsPerBox = Math.ceil(item.quantity / newCount);
    
    setProductBoxes(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        boxCount: newCount,
        itemsPerBox: newItemsPerBox
      }
    }));
    
    generateBoxDistributions();
  };

  // Handle changes to items per box
  const handleItemsPerBoxChange = (itemId: string, value: number) => {
    const item = order.items.find(i => i.id === itemId);
    if (!item) return;
    
    const newItemsPerBox = Math.max(1, Math.min(value, item.quantity));
    const newBoxCount = Math.ceil(item.quantity / newItemsPerBox);
    
    setProductBoxes(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        boxCount: newBoxCount,
        itemsPerBox: newItemsPerBox
      }
    }));
    
    generateBoxDistributions();
  };

  // Generate box distributions based on product box settings
  const generateBoxDistributions = () => {
    if (!order) return;

    const newBoxDistributions: BoxDistribution[] = [];
    let newTotalWeight = 0;
    let maxBoxes = 0;

    // Find the total number of boxes needed
    order.items.forEach(item => {
      const boxSettings = productBoxes[item.id];
      if (boxSettings) {
        maxBoxes = Math.max(maxBoxes, boxSettings.boxCount);
      }
    });

    // Create boxes
    for (let boxNum = 1; boxNum <= maxBoxes; boxNum++) {
      const boxItems: BoxDistribution["items"] = [];

      // Distribute products across boxes
      order.items.forEach(item => {
        const boxSettings = productBoxes[item.id];
        
        if (!boxSettings) return;
        
        // If this item belongs in this box
        if (boxNum <= boxSettings.boxCount) {
          const itemsInThisBox = 
            boxNum === boxSettings.boxCount ? 
            item.quantity - (boxSettings.itemsPerBox * (boxNum - 1)) : 
            boxSettings.itemsPerBox;
          
          // Get manually entered weight if available
          let itemWeight = 0;
          
          if (item.product.requiresWeightInput && item.pickedWeight) {
            // For items with manually entered weights, apply the weight proportionally
            const weightPerItem = item.pickedWeight / item.quantity;
            itemWeight = weightPerItem * itemsInThisBox;
          } else if (item.product.weight) {
            // For items with standard weights, multiply by quantity
            itemWeight = item.product.weight * itemsInThisBox;
          }
          
          if (itemsInThisBox > 0) {
            boxItems.push({
              productId: item.productId,
              productName: item.product.name,
              quantity: itemsInThisBox,
              weight: itemWeight
            });
          }
        }
      });

      // Calculate total box weight
      const boxWeight = boxItems.reduce((sum, item) => sum + item.weight, 0);
      newTotalWeight += boxWeight;

      // Only add box if it contains items
      if (boxItems.length > 0) {
        newBoxDistributions.push({
          boxNumber: boxNum,
          items: boxItems,
          totalBoxWeight: boxWeight
        });
      }
    }

    setBoxDistributions(newBoxDistributions);
    setTotalWeight(newTotalWeight);
    
    console.log("Generated box distributions:", newBoxDistributions);
    console.log("Total calculated weight:", newTotalWeight);
  };

  // Function to filter box distributions by selected box
  const filteredBoxDistributions = selectedBox 
    ? boxDistributions.filter(box => box.boxNumber === selectedBox)
    : boxDistributions;

  // Check if any item in the order has a manually entered weight
  const hasManuallyEnteredWeights = order.items.some(
    item => item.product.requiresWeightInput && item.pickedWeight && item.pickedWeight > 0
  );
  
  // Calculate the total order weight from all picked weights
  const getTotalOrderWeight = () => {
    // If using box distributions, use the sum of box weights
    if (boxDistributions.length > 0) {
      return boxDistributions.reduce((sum, box) => sum + box.totalBoxWeight, 0);
    }
    
    // Otherwise check if items have manually entered weights
    const hasManuallyEnteredWeights = order.items.some(
      item => item.product.requiresWeightInput && item.pickedWeight && item.pickedWeight > 0
    );
    
    if (hasManuallyEnteredWeights) {
      // Sum all picked weights
      return order.items.reduce((total, item) => {
        if (item.product.requiresWeightInput && item.pickedWeight) {
          return total + item.pickedWeight;
        }
        return total + (item.product.weight ? item.product.weight * item.quantity : 0);
      }, 0);
    }
    
    // Fallback to standard product weights
    return order.items.reduce((total, item) => 
      total + (item.product.weight ? item.product.weight * item.quantity : 0), 0);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Controls - hidden during printing */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center">
          {specificBoxParam ? (
            <Button variant="ghost" onClick={handleBackToPicking} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Picking
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleBackToOrders} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
          <h2 className="text-2xl font-bold">Print Box Labels</h2>
          {selectedBox && (
            <Badge className="ml-2 bg-blue-500">Box {selectedBox}</Badge>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="labelCount" className="mr-2">Number of Labels:</label>
            <Input 
              id="labelCount"
              type="number" 
              min="1" 
              max="20"
              value={labelCount} 
              onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
              className="w-20" 
            />
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Box selection for previously configured boxes */}
      {order.customer.needsDetailedBoxLabels && boxDistributions.length > 0 && !selectedBox && (
        <div className="print:hidden mb-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Boxes className="h-5 w-5 mr-2" /> 
                Select Box to Print
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {boxDistributions.map(box => (
                  <Button 
                    key={box.boxNumber} 
                    variant="outline" 
                    className="flex flex-col h-24 border border-gray-200" 
                    onClick={() => setSelectedBox(box.boxNumber)}
                  >
                    <Package className="h-6 w-6 mb-2" />
                    <span className="font-medium">Box {box.boxNumber}</span>
                    <span className="text-xs text-gray-500">{box.items.length} items</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Box Label Controls - only shown for customers with needsDetailedBoxLabels */}
      {order.customer.needsDetailedBoxLabels && boxDistributions.length === 0 && (
        <div className="print:hidden mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Configure Box Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Set how products are distributed across boxes. The system will automatically calculate weights.
              </p>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Total Quantity</TableHead>
                    <TableHead>Number of Boxes</TableHead>
                    <TableHead>Items Per Box</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => {
                    const boxSettings = productBoxes[item.id] || { boxCount: 1, itemsPerBox: item.quantity };
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-muted-foreground">{item.product.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center w-32">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleBoxCountChange(item.id, boxSettings.boxCount - 1)}
                              disabled={boxSettings.boxCount <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input 
                              type="number" 
                              min="1" 
                              value={boxSettings.boxCount}
                              onChange={(e) => handleBoxCountChange(item.id, parseInt(e.target.value) || 1)}
                              className="mx-2 w-14 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleBoxCountChange(item.id, boxSettings.boxCount + 1)}
                              disabled={boxSettings.boxCount >= item.quantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center w-32">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleItemsPerBoxChange(item.id, boxSettings.itemsPerBox - 1)}
                              disabled={boxSettings.itemsPerBox <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input 
                              type="number" 
                              min="1" 
                              max={item.quantity}
                              value={boxSettings.itemsPerBox}
                              onChange={(e) => handleItemsPerBoxChange(item.id, parseInt(e.target.value) || 1)}
                              className="mx-2 w-14 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleItemsPerBoxChange(item.id, boxSettings.itemsPerBox + 1)}
                              disabled={boxSettings.itemsPerBox >= item.quantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <div className="mt-4">
                <Button onClick={generateBoxDistributions} variant="secondary">
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Regenerate Box Distribution
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Box distribution preview */}
          <div className="mt-6 print:hidden">
            <h3 className="text-lg font-medium mb-3">Box Distribution Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boxDistributions.map((box) => (
                <Card key={box.boxNumber} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      Box {box.boxNumber} of {boxDistributions.length}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {box.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{item.productName}</span>
                          <span className="font-medium">{item.quantity} {item.weight > 0 ? `(${(item.weight/1000).toFixed(2)} kg)` : ''}</span>
                        </div>
                      ))}
                      {box.totalBoxWeight > 0 && (
                        <div className="border-t pt-1 mt-2 flex justify-between items-center">
                          <span className="font-medium">Box Weight:</span>
                          <span className="font-bold">{(box.totalBoxWeight/1000).toFixed(2)} kg</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {totalWeight > 0 && (
              <div className="mt-4 text-right">
                <span className="font-bold">Total Order Weight: {(getTotalOrderWeight()/1000).toFixed(2)} kg</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Labels for printing */}
      <div className="print-labels">
        {order.customer.needsDetailedBoxLabels ? (
          // Detailed box labels
          filteredBoxDistributions.map((box) => (
            Array.from({ length: labelCount }).map((_, labelIndex) => (
              <div key={`${box.boxNumber}-${labelIndex}`} className="box-label border rounded-lg mb-4 page-break-after">
                <div className="box-label-content p-6">
                  <div className="flex flex-col">
                    {/* Customer name in large font */}
                    <h1 className="text-4xl font-bold text-center mb-2">{order.customer.name}</h1>
                    
                    {/* Order ID and Box number */}
                    <div className="flex justify-between mb-4">
                      <p className="text-sm">Order: {order.id}</p>
                      <p className="text-sm font-bold">Box {box.boxNumber} of {boxDistributions.length}</p>
                    </div>
                    
                    {/* Products and quantities in this box */}
                    <div className="w-full mb-4 border-t border-b py-2">
                      <h3 className="font-bold mb-2">Box Contents:</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="text-sm text-gray-600 border-b">
                            <th className="text-left py-1">Product</th>
                            <th className="text-center py-1">Quantity</th>
                            {box.items.some(item => item.weight > 0) && (
                              <th className="text-right py-1">Weight</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {box.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2">{item.productName}</td>
                              <td className="py-2 text-center font-medium">{item.quantity}</td>
                              {box.items.some(item => item.weight > 0) && (
                                <td className="py-2 text-right">
                                  {item.weight > 0 ? (
                                    <span className="bg-gray-100 px-2 py-1 rounded inline-flex items-center">
                                      <Weight className="h-3 w-3 mr-1" />
                                      {(item.weight/1000).toFixed(2)} kg
                                    </span>
                                  ) : '—'}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Box weight - only show if there's weight data */}
                    {box.totalBoxWeight > 0 && (
                      <div className="flex justify-between items-center text-right mt-2">
                        <span className="font-bold">Total Box Weight:</span>
                        <span className="font-bold text-lg">{(box.totalBoxWeight/1000).toFixed(2)} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ))
        ) : (
          // Simple box labels - only show weight information if manually entered
          Array.from({ length: labelCount }).map((_, index) => (
            <div key={index} className="box-label border rounded-lg mb-4">
              <div className="box-label-content p-6">
                <div className="flex flex-col">
                  {/* Customer name in large font */}
                  <h1 className="text-4xl font-bold text-center mb-2">{order.customer.name}</h1>
                  
                  {/* Order ID in smaller font */}
                  <p className="text-sm mb-4">Order: {order.id}</p>
                  
                  {/* Products and quantities in tabular format */}
                  <div className="w-full mb-4 border-t border-b py-2">
                    <table className="w-full">
                      <thead>
                        <tr className="text-sm text-gray-600 border-b">
                          <th className="text-left py-1">Product</th>
                          <th className="text-center py-1">Quantity</th>
                          {hasManuallyEnteredWeights && (
                            <th className="text-right py-1">Weight</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2">{item.product.name}</td>
                            <td className="py-2 text-center font-medium">{item.quantity}</td>
                            {hasManuallyEnteredWeights && (
                              <td className="py-2 text-right">
                                {item.product.requiresWeightInput && item.pickedWeight && item.pickedWeight > 0 ? (
                                  <span className="bg-gray-100 px-2 py-1 rounded inline-flex items-center">
                                    <Weight className="h-3 w-3 mr-1" />
                                    {(item.pickedWeight/1000).toFixed(2)} kg
                                  </span>
                                ) : '—'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Add total weight if at least one item has manually entered weight */}
                  {hasManuallyEnteredWeights && (
                    <div className="flex justify-between items-center text-right mt-2">
                      <span className="font-bold">Total Weight:</span>
                      <span className="font-bold text-lg">
                        {(getTotalOrderWeight() / 1000).toFixed(2)} kg
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PrintBoxLabel;
