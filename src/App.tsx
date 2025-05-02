
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/HomePage";
import OrdersPage from "@/pages/OrdersPage";
import CustomersPage from "@/pages/CustomersPage";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import CustomerDetailsPage from "@/pages/CustomerDetailsPage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailsPage from "@/pages/ProductDetailsPage";
import CreateOrderPage from "@/pages/CreateOrderPage";
import CreateCustomerPage from "@/pages/CreateCustomerPage";
import CreateProductPage from "@/pages/CreateProductPage";
import PickingListPage from "@/pages/PickingListPage";
import BoxLabelPage from "@/pages/BoxLabelPage";
import StandingOrdersPage from "@/pages/StandingOrdersPage";
import CreateStandingOrderPage from "@/pages/CreateStandingOrderPage";
import StandingOrderDetailsPage from "@/pages/StandingOrderDetailsPage";
import EditStandingOrderPage from "@/pages/EditStandingOrderPage";
import ReturnsComplaintsPage from "@/pages/ReturnsComplaintsPage";
import ExportOrdersPage from "@/pages/ExportOrdersPage";
import BatchTrackingPage from "@/pages/BatchTrackingPage";
import EditOrderPage from "@/pages/EditOrderPage";
import ExportLabelPage from "@/pages/ExportLabelPage";
import IncompleteBatchPage from "@/pages/IncompleteBatchPage";
import LoginPage from "@/pages/LoginPage";
import EditStandingOrderDeliveryPage from "@/pages/EditStandingOrderDeliveryPage";
import NotFoundPage from "@/pages/NotFoundPage";
import SupabaseProtectedRoute from "@/components/SupabaseProtectedRoute";
import SupabaseDataProvider from "@/context/SupabaseDataContext";
import DataProvider from "@/context/DataContext";
import { SupabaseAuthProvider } from "@/context/SupabaseAuthContext";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <SupabaseAuthProvider>
        <SupabaseDataProvider>
          <DataProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <SupabaseProtectedRoute>
                      <HomePage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <SupabaseProtectedRoute>
                      <OrdersPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <SupabaseProtectedRoute>
                      <OrderDetailsPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id/edit"
                  element={
                    <SupabaseProtectedRoute>
                      <EditOrderPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id/picking"
                  element={
                    <SupabaseProtectedRoute>
                      <PickingListPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <SupabaseProtectedRoute>
                      <CustomersPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id"
                  element={
                    <SupabaseProtectedRoute>
                      <CustomerDetailsPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <SupabaseProtectedRoute>
                      <ProductsPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/products/:id"
                  element={
                    <SupabaseProtectedRoute>
                      <ProductDetailsPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/create-order"
                  element={
                    <SupabaseProtectedRoute>
                      <CreateOrderPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/create-customer"
                  element={
                    <SupabaseProtectedRoute>
                      <CreateCustomerPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/create-product"
                  element={
                    <SupabaseProtectedRoute>
                      <CreateProductPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/box-label/:orderId/:boxNumber"
                  element={
                    <SupabaseProtectedRoute>
                      <BoxLabelPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/standing-orders"
                  element={
                    <SupabaseProtectedRoute>
                      <StandingOrdersPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/standing-orders/:id"
                  element={
                    <SupabaseProtectedRoute>
                      <StandingOrderDetailsPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/create-standing-order"
                  element={
                    <SupabaseProtectedRoute>
                      <CreateStandingOrderPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/standing-orders/:id/edit"
                  element={
                    <SupabaseProtectedRoute>
                      <EditStandingOrderPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/standing-orders/:id/delivery/:date/edit"
                  element={
                    <SupabaseProtectedRoute>
                      <EditStandingOrderDeliveryPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/returns-complaints"
                  element={
                    <SupabaseProtectedRoute>
                      <ReturnsComplaintsPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/export-orders"
                  element={
                    <SupabaseProtectedRoute requireAdmin={true}>
                      <ExportOrdersPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/batch-tracking"
                  element={
                    <SupabaseProtectedRoute requireAdmin={true}>
                      <BatchTrackingPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/incomplete-batches"
                  element={
                    <SupabaseProtectedRoute requireAdmin={true}>
                      <IncompleteBatchPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route
                  path="/export-label/:orderId"
                  element={
                    <SupabaseProtectedRoute>
                      <ExportLabelPage />
                    </SupabaseProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
            <Toaster />
          </DataProvider>
        </SupabaseDataProvider>
      </SupabaseAuthProvider>
    </ThemeProvider>
  );
}

export default App;
