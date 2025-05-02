
import React from "react";
import Layout from "@/components/Layout";
import PickingList from "@/components/orders/PickingList";
import { useParams, useLocation } from "react-router-dom";

const PickingListPage: React.FC = () => {
  // Get the order ID from the URL parameters
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  
  // Check if we need to highlight a specific box (coming back from printing)
  const searchParams = new URLSearchParams(location.search);
  const nextBox = searchParams.get('nextBox');
  const nextBoxNumber = nextBox ? parseInt(nextBox) : undefined;

  console.log("PickingListPage: Rendering with orderId:", id, "nextBox:", nextBox);

  if (!id) {
    console.error("PickingListPage: No order ID found in URL parameters");
    return (
      <Layout>
        <div className="p-4 text-red-500">
          Error: No order ID provided in the URL.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <PickingList 
          orderId={id} 
          nextBoxToFocus={nextBoxNumber} 
          key={`picking-${id}-${nextBox || 'default'}`} // Force re-render on box change
        />
      </div>
    </Layout>
  );
};

export default PickingListPage;
