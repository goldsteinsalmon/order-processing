
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import CompletedOrdersPage from "./pages/CompletedOrdersPage";
import StandingOrdersPage from "./pages/StandingOrdersPage";
import ReturnsPage from "./pages/ReturnsPage";
import MissingItemsPage from "./pages/MissingItemsPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import StandingOrderDetailsPage from "./pages/StandingOrderDetailsPage";
import CreateCustomerPage from "./pages/CreateCustomerPage";
import CreateProductPage from "./pages/CreateProductPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import CreateStandingOrderPage from "./pages/CreateStandingOrderPage";
import { DataProvider } from "./context/DataContext";
import StandingOrderSchedulePage from "./pages/StandingOrderSchedulePage";
import EditStandingOrderPage from "./pages/EditStandingOrderPage";
import EditStandingOrderDeliveryPage from "./pages/EditStandingOrderDeliveryPage";
import PrintBoxLabelPage from "./pages/PrintBoxLabelPage";

const App: React.FC = () => {
  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<OrdersPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        
        <Route path="/customers" element={<OrdersPage />} />
        <Route path="/customer-details/:id" element={<CustomerDetailsPage />} />
        <Route path="/create-customer" element={<CreateCustomerPage />} />
        
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product-details/:id" element={<ProductDetailsPage />} />
        <Route path="/create-product" element={<CreateProductPage />} />
        
        <Route path="/order-details/:id" element={<OrderDetailsPage />} />
        <Route path="/create-order" element={<CreateOrderPage />} />
        <Route path="/completed-orders" element={<CompletedOrdersPage />} />
        
        <Route path="/standing-orders" element={<StandingOrdersPage />} />
        <Route path="/standing-order-details/:id" element={<StandingOrderDetailsPage />} />
        <Route path="/create-standing-order" element={<CreateStandingOrderPage />} />
        <Route path="/edit-standing-order/:id" element={<EditStandingOrderPage />} />
        <Route path="/standing-order-schedule/:id" element={<StandingOrderSchedulePage />} />
        <Route path="/edit-standing-order-delivery/:id" element={<EditStandingOrderDeliveryPage />} />
        
        <Route path="/returns" element={<ReturnsPage />} />
        
        <Route path="/missing-items" element={<MissingItemsPage />} />
        
        <Route path="/print-box-label/:id" element={<PrintBoxLabelPage />} />
      </Routes>
    </DataProvider>
  );
};

export default App;
