import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    PieChart as RechartsChart,
    Pie,
    ResponsiveContainer,
    Tooltip,
    Legend,
  } from "recharts";
import styles from "./CardStyles.module.css";
import { useStore, categories } from "@/store/useStore";

function ExpensesCard() {
    const {
        expenses,
        fixedPerMonth,
      } = useStore();

    const expensesByCategory = expenses.reduce(
        (acc: Record<string, number>, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        },
        {}
      );

    const pieChartData = Object.entries(expensesByCategory).map(
        ([category, value]) => ({
          name: category,
          value,
          fill: categories[category as keyof typeof categories] || "#8884d8",
        })
      );

    return (
        <Card>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {pieChartData.length > 0 ? (
            <div className="relative">
              <div className={styles.fixedExpensesContainer}>
                <h2 className={styles.fixedExpensesTitle}>
                  Fixed Expenses per Month: ${fixedPerMonth}
                </h2>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <RechartsChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                </RechartsChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.noExpensesContainer}>
              <p className={styles.noExpensesText}>No expenses to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
}

export default ExpensesCard;