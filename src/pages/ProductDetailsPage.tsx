
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const ProductDetailsPage: React.FC = () => {
  const { products, updateProduct } = useData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const product = products.find(product => product.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(product ? { ...product } : null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedProduct) return;
    
    const { name, value } = e.target;
    setEditedProduct({
      ...editedProduct,
      [name]: name === "stockLevel" ? Number(value) : value,
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

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/products")} className="mr-4">
          <ArrowLeft className="mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">{product.name}</h2>
      </div>

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
    </Layout>
  );
};

export default ProductDetailsPage;
