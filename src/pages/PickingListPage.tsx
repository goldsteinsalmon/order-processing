
import React from "react";
import Layout from "@/components/Layout";
import PickingList from "@/components/orders/PickingList";
import { useParams } from "react-router-dom";

const PickingListPage: React.FC = () => {
  // Get the order ID from the URL parameters
  const { id } = useParams<{ id: string }>();

  return (
    <Layout>
      <PickingList orderId={id} />
    </Layout>
  );
};

export default PickingListPage;
