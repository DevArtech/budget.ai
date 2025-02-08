import styles from "./Overview.module.css";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import ExpensesCard from "@/components/custom/Overview/ExpensesCard";
import SpendCard from "@/components/custom/Overview/SpendCard";
import TransactionsCard from "@/components/custom/Overview/TransactionsCard";
import TimelineCard from "@/components/custom/Overview/TimelineCard";

function Overview() {
  const { fetchInitialData, fetchTransactionsAndExpenses } = useStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchInitialData();
    fetchTransactionsAndExpenses();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderCards = () => {
    if (isMobile) {
      return (
        <>
          <SpendCard />
          <ExpensesCard />
          <TransactionsCard />
          <TimelineCard />
        </>
      );
    }

    return (
      <>
        <ExpensesCard />
        <SpendCard />
        <TransactionsCard />
        <TimelineCard />
      </>
    );
  };

  return <div className={styles.overview}>{renderCards()}</div>;
}

export default Overview;
