import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import AppRoutes from "./router/routes";
import "choices.js/public/assets/styles/choices.min.css";
import "quill/dist/quill.snow.css";
import "./App.css";
import "./theme.css";


import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

