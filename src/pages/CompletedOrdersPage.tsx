
import React from "react";
import Layout from "@/components/Layout";
import CompletedOrders from "@/components/orders/CompletedOrders";

const CompletedOrdersPage: React.FC = () => {
  return (
    <Layout>
      <CompletedOrders />
    </Layout>
  );
};

export default CompletedOrdersPage;
