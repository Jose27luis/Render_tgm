import { createBrowserRouter } from "react-router-dom";
import RealESRGAN from "./components/RealESRGAN";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyImages from "./pages/MyImages";
import Profile from "./pages/Profile";
import Register from "./pages/Register";

// Función para verificar autenticación
const requireAuth = () => {
  const isAuthenticated = !!localStorage.getItem("token");
  if (!isAuthenticated) {
    return "/login";
  }
  return null;
};

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/profile",
      element: <Profile />,
      loader: requireAuth,
    },
    {
      path: "/dashboard",
      element: <Dashboard />,
      loader: requireAuth,
    },
    {
      path: "/my-images",
      element: <MyImages />,
      loader: requireAuth,
    },
    {
      path: "/real-esrgan",
      element: <RealESRGAN />,
      loader: requireAuth,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_normalizeFormMethod: true,
      v7_fetcherPersist: true,
      v7_prependBasename: true,
    },
  }
);
