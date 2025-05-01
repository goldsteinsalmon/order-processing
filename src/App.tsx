
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
import SupabaseProtectedRoute from "./components/SupabaseProtectedRoute";
import { SupabaseAuthProvider } from "./context/SupabaseAuthContext";
import SupabaseDataProvider from "./context/SupabaseDataContext";
import { Toaster } from "@/components/ui/toaster";

const App: React.FC = () => {
  return (
    <SupabaseAuthProvider>
      <SupabaseDataProvider>
        <DataProvider>
          <AuthProvider>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Default redirect to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Routes accessible to all users, including regular users */}
              <Route path="/orders" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <OrdersPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/completed-orders" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <CompletedOrdersPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/order-details/:id" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <OrderDetailsPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/view-completed-order/:id" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <ViewCompletedOrderPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/export-orders" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <ExportOrdersPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/export-orders-view" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <ExportOrdersViewPage />
                </SupabaseProtectedRoute>
              } />
              
              {/* New: Allow access to picking list for regular users */}
              <Route path="/picking-list" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <PickingListPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/picking-list/:id" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <PickingListPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/print-box-label" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <PrintBoxLabelPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/print-box-label/:id" element={
                <SupabaseProtectedRoute allowUserAccess={true}>
                  <PrintBoxLabelPage />
                </SupabaseProtectedRoute>
              } />
              
              {/* Routes restricted to manager/admin only */}
              <Route path="/customers" element={
                <SupabaseProtectedRoute>
                  <CustomersPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/customer-details/:id" element={
                <SupabaseProtectedRoute>
                  <CustomerDetailsPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/create-customer" element={
                <SupabaseProtectedRoute>
                  <CreateCustomerPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/products" element={
                <SupabaseProtectedRoute>
                  <ProductsPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/product-details/:id" element={
                <SupabaseProtectedRoute>
                  <ProductDetailsPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/create-product" element={
                <SupabaseProtectedRoute>
                  <CreateProductPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/create-order" element={
                <SupabaseProtectedRoute>
                  <CreateOrderPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/edit-order/:id" element={
                <SupabaseProtectedRoute>
                  <EditCompletedOrderPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/edit-completed-order/:id" element={
                <SupabaseProtectedRoute>
                  <EditCompletedOrderPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/standing-orders" element={
                <SupabaseProtectedRoute>
                  <StandingOrdersPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/standing-order-details/:id" element={
                <SupabaseProtectedRoute>
                  <StandingOrderDetailsPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/create-standing-order" element={
                <SupabaseProtectedRoute>
                  <CreateStandingOrderPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/edit-standing-order/:id" element={
                <SupabaseProtectedRoute>
                  <EditStandingOrderPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/standing-order-schedule/:id" element={
                <SupabaseProtectedRoute>
                  <StandingOrderSchedulePage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/edit-standing-order-delivery/:id" element={
                <SupabaseProtectedRoute>
                  <EditStandingOrderDeliveryPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/returns" element={
                <SupabaseProtectedRoute>
                  <ReturnsPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/missing-items" element={
                <SupabaseProtectedRoute>
                  <MissingItemsPage />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/batch-tracking" element={
                <SupabaseProtectedRoute>
                  <BatchTrackingPage />
                </SupabaseProtectedRoute>
              } />
              
              {/* Admin-only route */}
              <Route path="/admin" element={
                <SupabaseProtectedRoute requireAdmin={true}>
                  <AdminPage />
                </SupabaseProtectedRoute>
              } />
            </Routes>
            <Toaster />
          </AuthProvider>
        </DataProvider>
      </SupabaseDataProvider>
    </SupabaseAuthProvider>
  );
};

export default App;
