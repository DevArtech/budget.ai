import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Overview from "./Overview.tsx";
import NavBar from "./components/custom/NavBar.tsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Accounts from "./pages/Accounts.tsx";
import Transactions from "./pages/Transactions.tsx";
import { AssistantInterface } from "./components/custom/AssistantInterface.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <NavBar title="Budget.AI" backgroundColor="#2130cf" />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
      <AssistantInterface />
    </BrowserRouter>
  </StrictMode>
);
