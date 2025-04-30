
import React from "react";
import Layout from "@/components/Layout";
import PickingList from "@/components/orders/PickingList";
import { useParams } from "react-router-dom";

const PickingListPage: React.FC = () => {
  // The ID is now properly passed to the PickingList component via URL params
  return (
    <Layout>
      <PickingList />
    </Layout>
  );
};

export default PickingListPage;
