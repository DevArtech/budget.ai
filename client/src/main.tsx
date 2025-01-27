import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Overview from "./Overview.tsx";
import NavBar from "./components/custom/NavBar.tsx";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Accounts from "./pages/Accounts.tsx";
import Transactions from "./pages/Transactions.tsx";
import Goals from "./pages/Goals.tsx";
import Login from "./pages/Login.tsx";
import { AssistantInterface } from "./components/custom/AssistantInterface.tsx";
import { Toaster } from "@/components/ui/toaster";
import { PlaidConnect } from "./components/custom/PlaidConnect.tsx";

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

// Wrapper component to conditionally render AssistantInterface
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      <Toaster />
      <NavBar title="Budget.AI" backgroundColor="#2130cf" />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/login" element={<Login />} />
        <Route path="/connect-bank" element={<PlaidConnect />} />
      </Routes>
      {!isLoginPage && <AssistantInterface />}
    </>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </StrictMode>
);
