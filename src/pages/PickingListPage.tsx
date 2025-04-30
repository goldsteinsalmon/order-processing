
import React, { useEffect } from "react";
import Layout from "@/components/Layout";
import PickingList from "@/components/orders/PickingList";
import { useParams, useLocation, useNavigate } from "react-router-dom";

const PickingListPage: React.FC = () => {
  // Get the order ID from the URL parameters
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we need to highlight a specific box (coming back from printing)
  const searchParams = new URLSearchParams(location.search);
  const nextBox = searchParams.get('nextBox');
  const nextBoxNumber = nextBox ? parseInt(nextBox) : undefined;

  // Force a re-render when returning from printing page to update box status
  useEffect(() => {
    // This effect will trigger whenever the search params change
    // which happens when returning from print page with nextBox param
  }, [location.search]);

  return (
    <Layout>
      <PickingList 
        orderId={id} 
        nextBoxToFocus={nextBoxNumber} 
        key={`picking-${id}-${nextBox || 'default'}`} // Force re-render on box change
      />
    </Layout>
  );
};

export default PickingListPage;
