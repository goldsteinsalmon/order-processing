
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";

import OrdersPage from "./pages/OrdersPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import PickingListPage from "./pages/PickingListPage";
import CompletedOrdersPage from "./pages/CompletedOrdersPage";
import ViewCompletedOrderPage from "./pages/ViewCompletedOrderPage";
import EditCompletedOrderPage from "./pages/EditCompletedOrderPage";
import PrintBoxLabelPage from "./pages/PrintBoxLabelPage";
import ReturnsPage from "./pages/ReturnsPage";
import MissingItemsPage from "./pages/MissingItemsPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import CreateCustomerPage from "./pages/CreateCustomerPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CreateProductPage from "./pages/CreateProductPage";
import StandingOrdersPage from "./pages/StandingOrdersPage";
import CreateStandingOrderPage from "./pages/CreateStandingOrderPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<OrdersPage />} />
            <Route path="/create-order" element={<CreateOrderPage />} />
            <Route path="/order-details/:id" element={<OrderDetailsPage />} />
            <Route path="/picking-list/:id" element={<PickingListPage />} />
            <Route path="/print-box-label/:id" element={<PrintBoxLabelPage />} />
            <Route path="/completed-orders" element={<CompletedOrdersPage />} />
            <Route path="/view-completed-order/:id" element={<ViewCompletedOrderPage />} />
            <Route path="/edit-completed-order/:id" element={<EditCompletedOrderPage />} />
            <Route path="/standing-orders" element={<StandingOrdersPage />} />
            <Route path="/create-standing-order" element={<CreateStandingOrderPage />} />
            <Route path="/missing-items" element={<MissingItemsPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customer-details/:id" element={<CustomerDetailsPage />} />
            <Route path="/create-customer" element={<CreateCustomerPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product-details/:id" element={<ProductDetailsPage />} />
            <Route path="/create-product" element={<CreateProductPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DataProvider>
  </QueryClientProvider>
);

export default App;
