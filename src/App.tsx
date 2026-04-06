/**
 * Alkalmazás gyökér: útvonalak (kezdőlap, bolt, admin), provider burkok nélkül (azok a main.tsx-ben vannak).
 * Itt gyűlik össze az útvonal-térkép és az admin védő komponens.
 */
import { Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { MainLayout } from "./components/layout/MainLayout";
import { CookieBanner } from "./components/privacy/CookieBanner";
import { CookiePreferencesModal } from "./components/privacy/CookiePreferencesModal";
import { AccountPage } from "./pages/AccountPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { CookiePage } from "./pages/CookiePage";
import { HomePage } from "./pages/HomePage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { TermsPage } from "./pages/TermsPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ShopPage } from "./components/shop/ShopPage";
import { ProtectedAccount } from "./routes/ProtectedAccount";
import { ProtectedAdmin } from "./routes/ProtectedAdmin";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="aszf" element={<TermsPage />} />
          <Route path="suti-tajekoztato" element={<CookiePage />} />
          <Route
            path="adatkezelesi-tajekoztato"
            element={<PrivacyPage />}
          />
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
      <CookieBanner />
      <CookiePreferencesModal />
    </>
  );
}
