
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { ArrowLeft, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Product } from "@/types";

const ProductDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, updateProduct } = useData();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  
  // Load product data
  useEffect(() => {
    if (!id) return;
    
    const foundProduct = products.find(p => p.id === id);
    if (foundProduct) {
      setProduct(foundProduct);
      setEditedProduct(foundProduct);
    }
  }, [id, products]);
  
  const handleEditToggle = () => {
    if (isEditing && editedProduct) {
      // Save changes
      updateProduct(editedProduct);
      setProduct(editedProduct);
      toast({
        title: "Success",
        description: "Product updated successfully."
      });
    }
    
    setIsEditing(!isEditing);
  };
  
  const handleInputChange = (field: keyof Product, value: any) => {
    if (!editedProduct) return;
    
    setEditedProduct({
      ...editedProduct,
      [field]: value
    });
  };
  
  const handleRequiresWeightInputChange = (checked: boolean) => {
    if (!editedProduct) return;
    
    setEditedProduct({
      ...editedProduct,
      requires_weight_input: checked,
      // Clear weight if we're now requiring weight input
      weight: checked ? undefined : editedProduct.weight
    });
  };
  
  if (!product) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button variant="outline" onClick={() => navigate("/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/products")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Product Details</h2>
        <div className="ml-auto">
          <Button onClick={handleEditToggle}>
            {isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" /> Save
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editedProduct?.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">{product.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                {isEditing ? (
                  <Input
                    id="sku"
                    value={editedProduct?.sku || ""}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">{product.sku}</p>
                )}
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={editedProduct?.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50 min-h-[80px]">
                    {product.description || "No description"}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock_level">Stock Level</Label>
                {isEditing ? (
                  <Input
                    id="stock_level"
                    type="number"
                    min="0"
                    value={editedProduct?.stock_level || 0}
                    onChange={(e) => handleInputChange("stock_level", parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">{product.stock_level}</p>
                )}
              </div>
              
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="requires_weight_input">Requires Weight Input</Label>
                {isEditing ? (
                  <div className="flex items-center h-10">
                    <Switch
                      id="requires_weight_input"
                      checked={editedProduct?.requires_weight_input || false}
                      onCheckedChange={handleRequiresWeightInputChange}
                    />
                    <span className="ml-2">
                      {editedProduct?.requires_weight_input ? "Yes" : "No"}
                    </span>
                  </div>
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    {product.requires_weight_input ? "Yes" : "No"}
                  </p>
                )}
              </div>
              
              {(!editedProduct?.requires_weight_input || !isEditing) && (
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (g)</Label>
                  {isEditing && !editedProduct?.requires_weight_input ? (
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editedProduct?.weight || ""}
                      onChange={(e) => handleInputChange("weight", e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  ) : (
                    <p className="p-2 border rounded-md bg-gray-50">
                      {product.weight || "Not specified"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProductDetailsPage;
