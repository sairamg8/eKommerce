import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./store/ThemeContext";
import { ToastProvider } from "./store/ToastContext";
import { AuthProvider } from "./store/AuthContext";
import { CartProvider } from "./store/CartContext";
import { PersonaBar } from "./components/layout/PersonaBar";
import { Toaster } from "./components/ui/Toaster";
import { AppRoutes } from "./routes";
import { Provider } from "react-redux";
import store from "./store";

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <BrowserRouter>
                <PersonaBar />
                <AppRoutes />
                <Toaster />
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}
