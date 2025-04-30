
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";

const ViewCompletedOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completedOrders } = useData();

  const order = completedOrders.find(order => order.id === id);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Button variant="outline" onClick={() => navigate("/completed-orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Completed Orders
        </Button>
      </div>
    );
  }

  // Helper function to generate change description
  const getChangeDescription = (order) => {
    if (!order.changes || order.changes.length === 0) return null;
    
    // Get the list of changed products
    const changedProducts = order.changes.map(change => {
      if (change.originalQuantity === 0) {
        return `Added ${change.newQuantity} ${change.productName}`;
      } else if (change.newQuantity === 0) {
        return `Removed ${change.productName}`;
      } else {
        return `Changed ${change.productName} from ${change.originalQuantity} to ${change.newQuantity}`;
      }
    });
    
    return changedProducts.join("; ");
  };

  // Calculate order totals
  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
  
  // Get batch numbers for each item
  const getItemBatchNumber = (item) => {
    // First check if the item has its own batch number
    if (item.batchNumber) {
      return item.batchNumber;
    }
    
    // Then check the pickingProgress batchNumbers mapping
    if (order.pickingProgress?.batchNumbers && order.pickingProgress.batchNumbers[item.id]) {
      return order.pickingProgress.batchNumbers[item.id];
    }
    
    // Fall back to the order's batch number
    return order.batchNumber || "N/A";
  };

  // Get blown pouches for each item
  const getItemBlownPouches = (item) => {
    // First check if the item has its own blown pouches
    if (item.blownPouches !== undefined) {
      return item.blownPouches;
    }
    
    // Then check the pickingProgress blownPouches mapping
    if (order.pickingProgress?.blownPouches && order.pickingProgress.blownPouches[item.id]) {
      return order.pickingProgress.blownPouches[item.id];
    }
    
    // Default to 0
    return 0;
  };
  
  const changeDesc = getChangeDescription(order);
  
  // Helper to format weight in kg with proper precision
  const formatWeight = (weightInGrams) => {
    if (!weightInGrams && weightInGrams !== 0) return "N/A";
    return `${(weightInGrams / 1000).toFixed(3)} kg`;
  };
  
  // Get the picker name from either picker field or pickedBy field
  const getPickerName = () => {
    if (order.picker) {
      return order.picker;
    } else if (order.pickedBy) {
      // This is a fallback in case picker name isn't saved but ID is
      return order.pickedBy;
    }
    return "N/A";
  };

  // Calculate total weight of all items with picked weights
  const calculateTotalWeight = () => {
    if (!order.items) return 0;
    
    const totalWeight = order.items.reduce((acc, item) => {
      if (item.pickedWeight) {
        return acc + Number(item.pickedWeight);
      }
      return acc;
    }, 0);
    
    return totalWeight;
  };

  const totalWeight = calculateTotalWeight();
  
  // Group items by box for display
  const itemsByBox = order.items.reduce((acc, item) => {
    const boxNumber = item.boxNumber || 0;
    if (!acc[boxNumber]) {
      acc[boxNumber] = [];
    }
    acc[boxNumber].push(item);
    return acc;
  }, {});

  // Calculate items count and weight per box
  const boxSummaries = Object.entries(itemsByBox).map(([boxNumber, items]) => {
    const boxItems = items as typeof order.items;
    const itemCount = boxItems.reduce((sum, item) => sum + item.quantity, 0);
    const boxWeight = boxItems.reduce((sum, item) => {
      if (item.pickedWeight) {
        return sum + Number(item.pickedWeight);
      }
      return sum;
    }, 0);
    
    return {
      boxNumber: Number(boxNumber),
      itemCount,
      boxWeight
    };
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/completed-orders")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Completed Order Details</h2>
        </div>
      </div>

      {changeDesc && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-medium">
              This order has been modified. Changes: {changeDesc}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-3">
                <dt className="font-medium">Order ID:</dt>
                <dd className="col-span-2">{order.id}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Order Date:</dt>
                <dd className="col-span-2">{format(parseISO(order.orderDate), "MMMM d, yyyy")}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Completion Date:</dt>
                <dd className="col-span-2">
                  {order.updated ? format(parseISO(order.updated), "MMMM d, yyyy") : "N/A"}
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Status:</dt>
                <dd className="col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {order.status}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Delivery Method:</dt>
                <dd className="col-span-2">{order.deliveryMethod}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Picker:</dt>
                <dd className="col-span-2">{getPickerName()}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Blown Pouches:</dt>
                <dd className="col-span-2">{order.totalBlownPouches || 0}</dd>
              </div>
              {order.customerOrderNumber && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Customer Order #:</dt>
                  <dd className="col-span-2">{order.customerOrderNumber}</dd>
                </div>
              )}
              {order.notes && (
                <div className="grid grid-cols-3">
                  <dt className="font-medium">Notes:</dt>
                  <dd className="col-span-2">{order.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-3">
                <dt className="font-medium">Name:</dt>
                <dd className="col-span-2">{order.customer.name}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Type:</dt>
                <dd className="col-span-2">{order.customer.type}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Email:</dt>
                <dd className="col-span-2">{order.customer.email}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Phone:</dt>
                <dd className="col-span-2">{order.customer.phone}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium">Address:</dt>
                <dd className="col-span-2">{order.customer.address}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Box</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead className="text-right">Blown Pouches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => {
                  // Check if this specific item has changes
                  const itemChanges = order.changes?.find(change => 
                    change.productId === item.productId
                  );
                  
                  return (
                    <TableRow key={item.id} className={itemChanges ? "bg-red-50" : ""}>
                      <TableCell>
                        {item.product.name}
                        {itemChanges && (
                          <div className="text-red-600 text-xs mt-1">
                            {itemChanges.originalQuantity === 0 
                              ? "New item" 
                              : itemChanges.newQuantity === 0
                                ? "Item removed"
                                : `Changed from ${itemChanges.originalQuantity}`
                            }
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{item.product.sku}</TableCell>
                      <TableCell className="text-right">{item.boxNumber || "N/A"}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {item.product.requiresWeightInput 
                          ? (item.pickedWeight ? formatWeight(item.pickedWeight) : "N/A")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{getItemBatchNumber(item)}</TableCell>
                      <TableCell className="text-right">{getItemBlownPouches(item)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {boxSummaries.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Box Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Box Number</TableHead>
                    <TableHead className="text-right">Total Items</TableHead>
                    <TableHead className="text-right">Box Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boxSummaries.map((box) => (
                    <TableRow key={box.boxNumber}>
                      <TableCell>{box.boxNumber === 0 ? "Unassigned" : `Box ${box.boxNumber}`}</TableCell>
                      <TableCell className="text-right">{box.itemCount}</TableCell>
                      <TableCell className="text-right">{formatWeight(box.boxWeight)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{totalItems}</TableCell>
                    <TableCell className="text-right">{formatWeight(totalWeight)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {order.changes && order.changes.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Original Quantity</TableHead>
                    <TableHead className="text-right">Updated Quantity</TableHead>
                    <TableHead>Date Changed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.changes.map((change, index) => (
                    <TableRow key={index}>
                      <TableCell>{change.productName}</TableCell>
                      <TableCell className="text-right">{change.originalQuantity}</TableCell>
                      <TableCell className="text-right">{change.newQuantity}</TableCell>
                      <TableCell>
                        {change.date ? format(parseISO(change.date), "dd/MM/yyyy HH:mm") : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewCompletedOrder;
