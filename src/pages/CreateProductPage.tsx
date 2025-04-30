
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { addProduct } = useData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    stockLevel: 0,
    weight: 0, // Default weight in grams
    requiresWeightInput: false // New field for weight input requirement
  });

  const [errors, setErrors] = useState({
    name: "",
    sku: "",
    stockLevel: "",
    weight: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "stockLevel" || name === "weight" ? Number(value) : value
    });

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      requiresWeightInput: checked
    });
  };

  const validateForm = () => {
    const newErrors = {
      name: !formData.name ? "Product name is required" : "",
      sku: !formData.sku ? "SKU is required" : "",
      stockLevel: formData.stockLevel < 0 ? "Stock level cannot be negative" : "",
      weight: formData.weight < 0 ? "Weight cannot be negative" : ""
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const newProduct = {
      id: uuidv4(),
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      stockLevel: formData.stockLevel,
      weight: formData.weight,
      requiresWeightInput: formData.requiresWeightInput
    };

    addProduct(newProduct);
    toast({
      title: "Product created",
      description: `Product ${formData.name} has been created successfully.`
    });
    navigate("/products");
  };

  return (
    <Layout>
      <div className="flex justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/products")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">New Product</h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Product Name*
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="sku" className="block text-sm font-medium">
                SKU*
              </label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Enter product SKU"
              />
              {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="stockLevel" className="block text-sm font-medium">
                Initial Stock Level
              </label>
              <Input
                id="stockLevel"
                name="stockLevel"
                type="number"
                min="0"
                value={formData.stockLevel}
                onChange={handleChange}
                placeholder="Enter initial stock level"
              />
              {errors.stockLevel && <p className="text-sm text-red-500">{errors.stockLevel}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="weight" className="block text-sm font-medium">
                Weight (grams)
              </label>
              <Input
                id="weight"
                name="weight"
                type="number"
                min="0"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Enter weight in grams"
              />
              {errors.weight && <p className="text-sm text-red-500">{errors.weight}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="requiresWeightInput" 
                checked={formData.requiresWeightInput}
                onCheckedChange={handleCheckboxChange}
              />
              <label 
                htmlFor="requiresWeightInput" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Requires weight input during picking
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => navigate("/products")}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" /> Create Product
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateProductPage;
