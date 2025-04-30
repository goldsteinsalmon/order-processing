
import React from "react";
import Layout from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ProductDetailsPage: React.FC = () => {
  const { products } = useData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const product = products.find(product => product.id === id);

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

      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Product Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-gray-600">SKU:</span>
                <span className="col-span-2 font-medium">{product.sku}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-gray-600">Stock Level:</span>
                <span className="col-span-2 font-medium">{product.stockLevel}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-gray-600">Unit:</span>
                <span className="col-span-2 font-medium">{product.unit}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Details</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailsPage;
