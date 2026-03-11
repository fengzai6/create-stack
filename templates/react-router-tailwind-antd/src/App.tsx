import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider } from "antd";
import { Outlet } from "react-router";

function App() {
  return (
    <StyleProvider layer>
      <ConfigProvider>
        <Outlet />
      </ConfigProvider>
    </StyleProvider>
  );
}

export default App;
