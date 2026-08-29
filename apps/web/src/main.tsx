import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { requestBackendReadiness } from "./lib/backendReadiness";
import "./styles.css";

const initialBackendReadinessPromise = requestBackendReadiness();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App initialReadinessPromise={initialBackendReadinessPromise} />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
);
