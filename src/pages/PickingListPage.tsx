
import React from "react";
import Layout from "@/components/Layout";
import PickingList from "@/components/orders/PickingList";
import { useParams } from "react-router-dom";

const PickingListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <Layout>
      <PickingList />
    </Layout>
  );
};

export default PickingListPage;
