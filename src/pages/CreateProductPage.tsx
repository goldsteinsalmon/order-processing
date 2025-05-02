
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Product } from "@/types";

const CreateProductPage: React.FC = () => {
  const { addProduct } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get any duplicate product data from location state
  const duplicateProduct = location.state?.duplicateFrom as Product | undefined;
  const isDuplicating = location.state?.isDuplicating as boolean | undefined;

  // Form state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [requiresWeightInput, setRequiresWeightInput] = useState(false);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [stockLevel, setStockLevel] = useState(0);

  // Populate form with duplicate data if available
  useEffect(() => {
    if (duplicateProduct && isDuplicating) {
      setName(duplicateProduct.name + " (Copy)");
      // For SKU, suggest a modified version to avoid duplicate SKUs
      setSku(duplicateProduct.sku + "-COPY");
      setDescription(duplicateProduct.description || "");
      setRequiresWeightInput(duplicateProduct.requiresWeightInput || false);
      setWeight(duplicateProduct.requiresWeightInput ? undefined : duplicateProduct.weight);
      setStockLevel(0); // Reset stock level for new product
    }
  }, [duplicateProduct, isDuplicating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sku) {
      toast({
        title: "Error",
        description: "Name and SKU are required.",
        variant: "destructive"
      });
      return;
    }

    const newProduct = {
      id: uuidv4(),
      name,
      sku,
      description: description || "",
      requiresWeightInput,
      weight: requiresWeightInput ? undefined : weight,
      stock_level: stockLevel,
      created: new Date().toISOString()
    };

    addProduct(newProduct);

    toast({
      title: "Success",
      description: isDuplicating ? "Product duplicated successfully." : "Product created successfully."
    });

    navigate("/products");
  };

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isDuplicating ? "Duplicate Product" : "New Product"}
        </h2>
        <Button variant="outline" onClick={() => navigate("/products")}>
          Back to Products
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>
              {isDuplicating ? "Duplicate Product Information" : "Product Information"}
              {isDuplicating && (
                <p className="mt-2 text-sm text-muted-foreground">
                  You're creating a copy of an existing product. Please adjust the details as needed.
                </p>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="required">Product Name *</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku" className="required">SKU *</Label>
                <Input 
                  id="sku" 
                  value={sku} 
                  onChange={(e) => setSku(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="requiresWeightInput" 
                    checked={requiresWeightInput}
                    onCheckedChange={(checked) => {
                      setRequiresWeightInput(checked);
                      if (checked) {
                        setWeight(undefined);
                      }
                    }}
                  />
                  <Label htmlFor="requiresWeightInput">Requires Weight Input</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable if weight needs to be entered when picking this product
                </p>
              </div>
              
              {!requiresWeightInput && (
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (g)</Label>
                  <Input 
                    id="weight" 
                    type="number"
                    min="0"
                    step="0.01"
                    value={weight || ""}
                    onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="stockLevel">Initial Stock Level</Label>
                <Input 
                  id="stockLevel" 
                  type="number"
                  min="0"
                  value={stockLevel}
                  onChange={(e) => setStockLevel(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => navigate("/products")}>
              Cancel
            </Button>
            <Button type="submit">
              {isDuplicating ? "Create Duplicate" : "Create Product"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </Layout>
  );
};

export default CreateProductPage;
