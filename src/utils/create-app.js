import { ConfigProvider } from "antd";
import i18n from "i18next";
import React from "react";
import ReactDOM from "react-dom/client";
import { initReactI18next } from "react-i18next";
import { zh } from "../locales";

i18n.use(initReactI18next).init({
  resources: {
    zh: {
      ...zh,
    },
  },
  lng: "zh",
  interpolation: {
    escapeValue: false,
  },
});

export const createApp = (appComp) => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <ConfigProvider autoInsertSpaceInButton={false}>{appComp}</ConfigProvider>
    </React.StrictMode>
  );
};
