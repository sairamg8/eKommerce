import { RouterProvider } from "react-router";
import routes from "./config";

export function AppRoutes() {
  return <RouterProvider router={routes} />;
}
