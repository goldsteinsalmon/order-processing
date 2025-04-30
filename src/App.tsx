import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/CustomersPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import CompletedOrdersPage from "./pages/CompletedOrdersPage";
import StandingOrdersPage from "./pages/StandingOrdersPage";
import ReturnsPage from "./pages/ReturnsPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import MissingItemsPage from "./pages/MissingItemsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import StandingOrderDetailsPage from "./pages/StandingOrderDetailsPage";
import ReturnDetailsPage from "./pages/ReturnDetailsPage";
import ComplaintDetailsPage from "./pages/ComplaintDetailsPage";
import CreateCustomerPage from "./pages/CreateCustomerPage";
import CreateProductPage from "./pages/CreateProductPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import CreateStandingOrderPage from "./pages/CreateStandingOrderPage";
import CreateReturnPage from "./pages/CreateReturnPage";
import CreateComplaintPage from "./pages/CreateComplaintPage";
import EditCustomerPage from "./pages/EditCustomerPage";
import EditProductPage from "./pages/EditProductPage";
import EditOrderPage from "./pages/EditOrderPage";
import EditStandingOrderPage from "./pages/EditStandingOrderPage";
import EditReturnPage from "./pages/EditReturnPage";
import EditComplaintPage from "./pages/EditComplaintPage";
import { DataProvider } from "./context/DataContext";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import MissingItemDetailsPage from "./pages/MissingItemDetailsPage";
import CreateMissingItemPage from "./pages/CreateMissingItemPage";
import EditMissingItemPage from "./pages/EditMissingItemPage";
import StandingOrderSchedulePage from "./pages/StandingOrderSchedulePage";
import EditStandingOrderDeliveryPage from "./pages/EditStandingOrderDeliveryPage";
import PickersPage from "./pages/PickersPage";
import CreatePickerPage from "./pages/CreatePickerPage";
import EditPickerPage from "./pages/EditPickerPage";

const App: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <DataProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {isLoggedIn ? (
          <>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customer-details/:id" element={<CustomerDetailsPage />} />
            <Route path="/create-customer" element={<CreateCustomerPage />} />
            <Route path="/edit-customer/:id" element={<EditCustomerPage />} />

            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product-details/:id" element={<ProductDetailsPage />} />
            <Route path="/create-product" element={<CreateProductPage />} />
            <Route path="/edit-product/:id" element={<EditProductPage />} />

            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/order-details/:id" element={<OrderDetailsPage />} />
            <Route path="/create-order" element={<CreateOrderPage />} />
            <Route path="/edit-order/:id" element={<EditOrderPage />} />
            <Route path="/completed-orders" element={<CompletedOrdersPage />} />

            <Route path="/standing-orders" element={<StandingOrdersPage />} />
            <Route path="/standing-order-details/:id" element={<StandingOrderDetailsPage />} />
            <Route path="/create-standing-order" element={<CreateStandingOrderPage />} />
            <Route path="/edit-standing-order/:id" element={<EditStandingOrderPage />} />
            <Route path="/standing-order-schedule/:id" element={<StandingOrderSchedulePage />} />
            <Route path="/edit-standing-order-delivery/:id" element={<EditStandingOrderDeliveryPage />} />

            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/return-details/:id" element={<ReturnDetailsPage />} />
            <Route path="/create-return" element={<CreateReturnPage />} />
            <Route path="/edit-return/:id" element={<EditReturnPage />} />

            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/complaint-details/:id" element={<ComplaintDetailsPage />} />
            <Route path="/create-complaint" element={<CreateComplaintPage />} />
            <Route path="/edit-complaint/:id" element={<EditComplaintPage />} />

            <Route path="/missing-items" element={<MissingItemsPage />} />
            <Route path="/missing-item-details/:id" element={<MissingItemDetailsPage />} />
            <Route path="/create-missing-item" element={<CreateMissingItemPage />} />
            <Route path="/edit-missing-item/:id" element={<EditMissingItemPage />} />

            <Route path="/users" element={<UsersPage />} />
            <Route path="/pickers" element={<PickersPage />} />
            <Route path="/create-picker" element={<CreatePickerPage />} />
            <Route path="/edit-picker/:id" element={<EditPickerPage />} />

            <Route path="/settings" element={<SettingsPage />} />
          </>
        ) : (
          <Route path="*" element={<LoginPage />} />
        )}
      </Routes>
    </DataProvider>
  );
};

export default App;
