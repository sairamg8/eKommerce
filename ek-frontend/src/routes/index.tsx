import { Navigate, Route, Routes } from "react-router-dom";
import { StorefrontLayout } from "../components/layout/StorefrontLayout";
import { AccountLayout } from "../components/layout/AccountLayout";
import { HomePage } from "./storefront/HomePage";
import { CatalogPage } from "./storefront/CatalogPage";
import { ProductPage } from "./storefront/ProductPage";
import { CartPage } from "./storefront/CartPage";
import { CheckoutPage } from "./storefront/CheckoutPage";
import { TrackPage } from "./storefront/TrackPage";
import { SupportPage } from "./storefront/SupportPage";
import { MerchantsPage } from "./storefront/MerchantsPage";
import { OrdersPage } from "./account/OrdersPage";
import { OrderDetailPage } from "./account/OrderDetailPage";
import { ProfilePage } from "./account/ProfilePage";
import { AddressesPage } from "./account/AddressesPage";
import { ReviewsPage } from "./account/ReviewsPage";
import { WishlistPage } from "./account/WishlistPage";
import { CustomerMessagesPage } from "./account/MessagesPage";
import { ReturnsPage } from "./account/ReturnsPage";
import { AdminLayout } from "../components/layout/AdminLayout";
import { MerchantLayout } from "../components/layout/MerchantLayout";
import { DeliveryLayout } from "../components/layout/DeliveryLayout";
import { DeliveryTasksPage } from "./delivery/TasksPage";
import { DeliveryShipmentsPage } from "./delivery/ShipmentsPage";
import { DeliveryPerformancePage } from "./delivery/PerformancePage";
import { MerchantDashboardPage } from "./merchant/DashboardPage";
import { MerchantProductsPage } from "./merchant/ProductsPage";
import { ProductFormPage } from "./merchant/product-form/ProductFormPage";
import { MerchantOrdersPage } from "./merchant/OrdersPage";
import { MerchantInventoryPage } from "./merchant/InventoryPage";
import { MerchantPayoutsPage } from "./merchant/PayoutsPage";
import { MerchantMessagesPage } from "./merchant/MessagesPage";
import { MerchantReturnsPage } from "./merchant/ReturnsPage";
import { MerchantSettingsPage } from "./merchant/SettingsPage";
import { AdminDashboardPage } from "./admin/DashboardPage";
import { AdminMerchantsPage } from "./admin/MerchantsPage";
import { AdminOrdersPage } from "./admin/OrdersPage";
import { AdminProductsPage } from "./admin/ProductsPage";
import { AdminUsersPage } from "./admin/UsersPage";
import { AdminCouponsPage } from "./admin/CouponsPage";
import { AdminPayoutsPage } from "./admin/PayoutsPage";
import { AdminShipmentsPage } from "./admin/ShipmentsPage";
import { AdminTicketsPage } from "./admin/TicketsPage";
import { AdminSupportChatPage } from "./admin/SupportChatPage";
import { AdminSettingsPage } from "./admin/SettingsPage";
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import { MerchantSignupPage } from "./auth/MerchantSignupPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<CatalogPage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="merchants" element={<MerchantsPage />} />

        <Route path="account" element={<AccountLayout />}>
          <Route index element={<Navigate to="/account/orders" replace />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="messages" element={<CustomerMessagesPage />} />
          <Route path="returns" element={<ReturnsPage />} />
        </Route>
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="merchants" element={<AdminMerchantsPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="shipments" element={<AdminShipmentsPage />} />
        <Route path="payouts" element={<AdminPayoutsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="tickets" element={<AdminTicketsPage />} />
        <Route path="chat" element={<AdminSupportChatPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/sell" element={<MerchantSignupPage />} />

      <Route path="/merchant" element={<MerchantLayout />}>
        <Route index element={<MerchantDashboardPage />} />
        <Route path="products" element={<MerchantProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="orders" element={<MerchantOrdersPage />} />
        <Route path="inventory" element={<MerchantInventoryPage />} />
        <Route path="payouts" element={<MerchantPayoutsPage />} />
        <Route path="messages" element={<MerchantMessagesPage />} />
        <Route path="returns" element={<MerchantReturnsPage />} />
        <Route path="settings" element={<MerchantSettingsPage />} />
      </Route>
      <Route path="/delivery" element={<DeliveryLayout />}>
        <Route index element={<DeliveryTasksPage />} />
        <Route path="shipments" element={<DeliveryShipmentsPage />} />
        <Route path="performance" element={<DeliveryPerformancePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
