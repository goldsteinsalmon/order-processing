
import React from "react";
import Layout from "@/components/Layout";
import OrdersList from "@/components/orders/OrdersList";

const OrdersPage: React.FC = () => {
  return (
    <Layout>
      <OrdersList />
    </Layout>
  );
};

export default OrdersPage;
