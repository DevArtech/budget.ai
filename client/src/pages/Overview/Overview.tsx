import styles from "./Overview.module.css";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import ExpensesCard from "@/components/custom/Overview/ExpensesCard";
import SpendCard from "@/components/custom/Overview/SpendCard";
import TransactionsCard from "@/components/custom/Overview/TransactionsCard";
import TimelineCard from "@/components/custom/Overview/TimelineCard";

function Overview() {
  const { fetchInitialData, fetchTransactionsAndExpenses } = useStore();

  useEffect(() => {
    fetchInitialData();
    fetchTransactionsAndExpenses();
  }, []);

  return (
    <>
      <div className={styles.overview}>
        <ExpensesCard />
        {/* <SpendCard />
        <TransactionsCard />
        <TimelineCard /> */}
      </div>
    </>
  );
}

export default Overview;
