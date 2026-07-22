"use client";

import React from "react";
import { AppProvider } from "@/context/appContext";
import { Toaster } from "react-hot-toast";

import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/global.css";

function App({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "14px",
              },
              success: {
                style: {
                  background: "#10b981",
                  color: "#fff",
                },
              },
              error: {
                style: {
                  background: "#ef4444",
                  color: "#fff",
                },
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}

export default App;