/**
 * Alkalmazás gyökér: útvonalak (kezdőlap, bolt, admin), provider burkok nélkül (azok a main.tsx-ben vannak).
 * Itt gyűlik össze az útvonal-térkép és az admin védő komponens.
 */
import { Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { MainLayout } from "./components/layout/MainLayout";
import { AccountPage } from "./pages/AccountPage";
import { HomePage } from "./pages/HomePage";
import { ShopPage } from "./components/shop/ShopPage";
import { ProtectedAccount } from "./routes/ProtectedAccount";
import { ProtectedAdmin } from "./routes/ProtectedAdmin";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route
          path="account"
          element={
            <ProtectedAccount>
              <AccountPage />
            </ProtectedAccount>
          }
        />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            <AdminDashboard />
          </ProtectedAdmin>
        }
      />
    </Routes>
  );
}
