
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import CustomersPage from "./pages/CustomersPage";
import AdminPage from "./pages/AdminPage";
import PickingListPage from "./pages/PickingListPage";
import EditCompletedOrderPage from "./pages/EditCompletedOrderPage";
import ViewCompletedOrderPage from "./pages/ViewCompletedOrderPage";
import BatchTrackingPage from "./pages/BatchTrackingPage";
import ExportOrdersPage from "./pages/ExportOrdersPage";
import ExportOrdersViewPage from "./pages/ExportOrdersViewPage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
  return (
    <DataProvider>
      <AuthProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Routes accessible to all users, including regular users */}
          <Route path="/orders" element={
            <ProtectedRoute allowUserAccess={true}>
              <OrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/completed-orders" element={
            <ProtectedRoute allowUserAccess={true}>
              <CompletedOrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/order-details/:id" element={
            <ProtectedRoute allowUserAccess={true}>
              <OrderDetailsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/view-completed-order/:id" element={
            <ProtectedRoute allowUserAccess={true}>
              <ViewCompletedOrderPage />
            </ProtectedRoute>
          } />
          
          <Route path="/export-orders" element={
            <ProtectedRoute allowUserAccess={true}>
              <ExportOrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/export-orders-view" element={
            <ProtectedRoute allowUserAccess={true}>
              <ExportOrdersViewPage />
            </ProtectedRoute>
          } />
          
          {/* Routes restricted to manager/admin only */}
          <Route path="/customers" element={
            <ProtectedRoute>
              <CustomersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/customer-details/:id" element={
            <ProtectedRoute>
              <CustomerDetailsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/create-customer" element={
            <ProtectedRoute>
              <CreateCustomerPage />
            </ProtectedRoute>
          } />
          
          <Route path="/products" element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/product-details/:id" element={
            <ProtectedRoute>
              <ProductDetailsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/create-product" element={
            <ProtectedRoute>
              <CreateProductPage />
            </ProtectedRoute>
          } />
          
          <Route path="/create-order" element={
            <ProtectedRoute>
              <CreateOrderPage />
            </ProtectedRoute>
          } />
          
          <Route path="/edit-order/:id" element={
            <ProtectedRoute>
              <EditCompletedOrderPage />
            </ProtectedRoute>
          } />
          
          <Route path="/edit-completed-order/:id" element={
            <ProtectedRoute>
              <EditCompletedOrderPage />
            </ProtectedRoute>
          } />
          
          <Route path="/picking-list" element={
            <ProtectedRoute>
              <PickingListPage />
            </ProtectedRoute>
          } />
          
          <Route path="/picking-list/:id" element={
            <ProtectedRoute>
              <PickingListPage />
            </ProtectedRoute>
          } />
          
          <Route path="/standing-orders" element={
            <ProtectedRoute>
              <StandingOrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/standing-order-details/:id" element={
            <ProtectedRoute>
              <StandingOrderDetailsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/create-standing-order" element={
            <ProtectedRoute>
              <CreateStandingOrderPage />
            </ProtectedRoute>
          } />
          
          <Route path="/edit-standing-order/:id" element={
            <ProtectedRoute>
              <EditStandingOrderPage />
            </ProtectedRoute>
          } />
          
          <Route path="/standing-order-schedule/:id" element={
            <ProtectedRoute>
              <StandingOrderSchedulePage />
            </ProtectedRoute>
          } />
          
          <Route path="/edit-standing-order-delivery/:id" element={
            <ProtectedRoute>
              <EditStandingOrderDeliveryPage />
            </ProtectedRoute>
          } />
          
          <Route path="/returns" element={
            <ProtectedRoute>
              <ReturnsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/missing-items" element={
            <ProtectedRoute>
              <MissingItemsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/print-box-label" element={
            <ProtectedRoute>
              <PrintBoxLabelPage />
            </ProtectedRoute>
          } />
          
          <Route path="/print-box-label/:id" element={
            <ProtectedRoute>
              <PrintBoxLabelPage />
            </ProtectedRoute>
          } />
          
          <Route path="/batch-tracking" element={
            <ProtectedRoute>
              <BatchTrackingPage />
            </ProtectedRoute>
          } />
          
          {/* Admin-only route */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </DataProvider>
  );
};

export default App;
