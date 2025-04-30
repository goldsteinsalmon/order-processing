
import React, { useState, useMemo } from "react";
import { Search, X, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Customer, Product } from "@/types";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ProductSelectionStepProps {
  orderItems: { productId: string; quantity: number; id: string }[];
  products: Product[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onItemChange: (id: string, field: "productId" | "quantity", value: string | number) => void;
  selectedCustomer: Customer | null;
  onContinue: () => void;
  onCancel: () => void;
  hideNavigationButtons?: boolean;
}

const ProductSelectionStep: React.FC<ProductSelectionStepProps> = ({
  orderItems,
  products,
  onAddItem,
  onRemoveItem,
  onItemChange,
  selectedCustomer,
  onContinue,
  onCancel,
  hideNavigationButtons = false
}) => {
  const [productSearch, setProductSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [activeProductItemId, setActiveProductItemId] = useState<string | null>(null);
  
  // Sort products by SKU
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => 
      a.sku.localeCompare(b.sku)
    );
  }, [products]);
  
  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (productSearch.trim() === "") return sortedProducts;
    
    const searchLower = productSearch.toLowerCase();
    return sortedProducts.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower)
    );
  }, [productSearch, sortedProducts]);
  
  const handleSelectProduct = (itemId: string, productId: string) => {
    onItemChange(itemId, "productId", productId);
    setShowProductSearch(false);
    setActiveProductItemId(null);
  };
  
  const getSelectedProductName = (productId: string) => {
    if (!productId) return "Select a product...";
    
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.sku})` : "Select a product...";
  };
  
  return (
    <div className="space-y-4">
      {selectedCustomer?.needsDetailedBoxLabels && (
        <div className="flex items-center text-sm text-blue-600 mb-2">
          <Package className="h-4 w-4 mr-1" />
          This customer requires detailed box labels
        </div>
      )}
      
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 font-medium">
          <div className="col-span-6 md:col-span-5">Product</div>
          <div className="col-span-3 md:col-span-3">SKU</div>
          <div className="col-span-2 md:col-span-3 text-center">Quantity</div>
          <div className="col-span-1"></div>
        </div>

        {/* Product Items */}
        {orderItems.map((item) => {
          const product = products.find(p => p.id === item.productId);
          return (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b">
              <div className="col-span-6 md:col-span-5">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => {
                    setActiveProductItemId(item.id);
                    setProductSearch(""); // Reset search when opening
                    setShowProductSearch(true);
                  }}
                >
                  <span className="truncate">
                    {getSelectedProductName(item.productId)}
                  </span>
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </div>
              <div className="col-span-3">
                {product ? product.sku : ""}
              </div>
              <div className="col-span-2 md:col-span-3">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity || ""}
                  onChange={(e) => onItemChange(item.id, "quantity", parseInt(e.target.value) || 0)}
                  className="text-center text-gray-500"
                  placeholder="Qty"
                />
              </div>
              <div className="col-span-1 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={orderItems.length <= 1}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          );
        })}
        
        <Button 
          type="button" 
          variant="outline"
          className="w-full mt-2" 
          onClick={onAddItem}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Another Product
        </Button>
      </div>
      
      {!hideNavigationButtons && (
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onContinue}>
            {selectedCustomer?.needsDetailedBoxLabels ? "Continue to Box Distribution" : "Create Order"}
          </Button>
        </div>
      )}
      
      {/* Product Search Dialog */}
      <CommandDialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <CommandInput 
            placeholder="Search products by name or SKU..."
            value={productSearch}
            onValueChange={setProductSearch}
            autoFocus={true}
            className="pl-8"
          />
        </div>
        <CommandList>
          <CommandEmpty>No products found.</CommandEmpty>
          <CommandGroup heading="Products">
            {filteredProducts.map(product => (
              <CommandItem 
                key={product.id} 
                value={`${product.name} ${product.sku}`} // Combined value for better matching
                onSelect={() => {
                  if (activeProductItemId) {
                    handleSelectProduct(activeProductItemId, product.id);
                  }
                }}
              >
                <span>{product.name}</span>
                <span className="ml-2 text-muted-foreground">({product.sku})</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default ProductSelectionStep;
