import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Overview from "./Overview.tsx";
import NavBar from "./components/custom/NavBar.tsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Accounts from "./pages/Accounts.tsx";
import Transactions from "./pages/Transactions.tsx";
import Login from "./pages/Login.tsx";
import { AssistantInterface } from "./components/custom/AssistantInterface.tsx";
import { Toaster } from "@/components/ui/toaster";

// Cleanup function to clear assistant history
const clearAssistantHistory = async () => {
  try {
    const token = localStorage.getItem("token");
    await fetch("/assistant/clear", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Failed to clear assistant history:", error);
  }
};

// Add event listener for page unload
window.addEventListener("beforeunload", () => {
  clearAssistantHistory();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster />
      <NavBar title="Budget.AI" backgroundColor="#2130cf" />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <AssistantInterface />
    </BrowserRouter>
  </StrictMode>
);
