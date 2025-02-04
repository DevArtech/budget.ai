import {
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AggregatedData, Transaction } from "@/types";
import styles from "./CardStyles.module.css";
import { useStore } from "@/store/useStore";
import { useEffect } from "react";
import { useState } from "react";

function TimelineCard() {
  const { transactions } = useStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Card
      className={styles.spanTwo}
      style={isMobile ? { marginBottom: "2rem" } : {}}
    >
      <CardHeader>
        <CardTitle
          className={styles.cardTitle}
          style={isMobile ? { textAlign: "center" } : {}}
        >
          Income/Expenses
        </CardTitle>
      </CardHeader>
      <CardContent style={isMobile ? { padding: "1rem" } : {}}>
        <div className={styles.incomeExpensesContainer}>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
            <LineChart
              data={transactions
                .reduce((acc: AggregatedData[], transaction: Transaction) => {
                  const date = new Date(transaction.date);
                  const monthYear = date.toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                  });

                  const existingEntry = acc.find(
                    (entry) => entry.date === monthYear
                  );
                  if (existingEntry) {
                    if (transaction.type === "income") {
                      existingEntry.income += transaction.amount;
                    } else {
                      existingEntry.expenses += transaction.amount;
                    }
                  } else {
                    acc.push({
                      date: monthYear,
                      income:
                        transaction.type === "income" ? transaction.amount : 0,
                      expenses:
                        transaction.type === "expense" ? transaction.amount : 0,
                    });
                  }
                  return acc;
                }, [])
                .map((entry) => ({
                  ...entry,
                  netGain: entry.income - entry.expenses,
                }))
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .reverse()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: string | number) =>
                  typeof value === "number" ? `$${value.toFixed(2)}` : value
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, fill: "#22c55e" }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, fill: "#ef4444" }}
              />
              <Line
                type="monotone"
                dataKey="netGain"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                strokeDasharray="5 5"
                activeDot={{ r: 6, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default TimelineCard;
