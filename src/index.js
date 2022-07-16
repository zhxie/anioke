import { ConfigProvider } from "antd";
import i18n from "i18next";
import React from "react";
import ReactDOM from "react-dom/client";
import { initReactI18next } from "react-i18next";
import App from "./App";
import zh from "./locales/zh";

i18n.use(initReactI18next).init({
  resources: {
    zh: {
      translation: {
        ...zh,
      },
    },
  },
  lng: "zh",
  interpolation: {
    escapeValue: false,
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ConfigProvider autoInsertSpaceInButton={false}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
