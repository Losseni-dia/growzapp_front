// src/components/ui/GrowzToaster.tsx
import { Toaster } from "react-hot-toast";

export default function GrowzToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 5000,
        style: {
          background: "#1B5E20",
          color: "white",
          fontWeight: "bold",
          fontSize: "1rem",
          borderRadius: "12px",
          padding: "16px 24px",
          boxShadow: "0 8px 25px rgba(27, 94, 32, 0.4)",
          border: "3px solid #FFC107",
        },
        success: {
          iconTheme: {
            primary: "#FFC107",
            secondary: "#1B5E20",
          },
        },
        error: {
          style: {
            background: "#C62828",
            border: "3px solid #FF5252",
          },
        },
      }}
    />
  );
}
