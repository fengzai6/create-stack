import {
  createBrowserRouter,
  RouterProvider,
  type RouteObject,
} from "react-router";

import App from "@/App";
import { Home } from "@/pages/home";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
    index: true, // 当给属性index设置为true时，该组件为父组件的首页
  },
];

const baseRoutes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    children: routes,
  },
];

export const Router = () => {
  return <RouterProvider router={createBrowserRouter(baseRoutes)} />;
};
