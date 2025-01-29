import {
  PieChart as RechartsChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
} from "recharts";
import styles from "./Overview.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { TransactionDialog } from "@/components/custom/TransactionDialog/TransactionDialog";
import { SpendSettingsDialog } from "@/components/custom/SpendSettingsDialog/SpendSettingsDialog";
import { useNavigate } from "react-router-dom";
import { useStore, categories } from "@/store/useStore";
import { Transaction, AggregatedData } from "@/types";
import DayCheckbox from "@/components/custom/DayCheckbox/DayCheckbox";
import TransactionItem from "../../components/custom/TransactionItem/TransactionItem";

function Overview() {
  const navigate = useNavigate();
  const [barData, setBarData] = useState<unknown[]>([]);
  const [spendData, setSpendData] = useState([
    {
      name: "Safe-to-Spend",
      value: 0,
      fill: "#82ca9d",
    },
    {
      name: "Dummy",
      value: 0,
      fill: "#82ca9d",
    },
  ]);
  const [selectedDays, setSelectedDays] = useState<{ [key: string]: boolean }>({
    Sun: true,
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: true,
  });

  const {
    transactions,
    expenses,
    budgetAllotment,
    spendOverTime,
    fixedPerMonth,
    warningPosition,
    isLoading,
    fetchInitialData,
    fetchTransactionsAndExpenses,
    addTransaction,
    updateWarningPosition,
    refreshBudgetData,
    deleteTransaction,
  } = useStore();

  useEffect(() => {
    fetchInitialData();
    fetchTransactionsAndExpenses();
  }, []);

  const handleDaySelect = (day: string, isSelected: boolean) => {
    const dayMap: { [key: string]: string } = {
      'M': 'Mon',
      'T': 'Tue',
      'W': 'Wed',
      'R': 'Thu',
      'F': 'Fri'
    };
    
    let mappedDay;
    if (day === 'S') {
      // Get all day buttons
      const buttons = document.querySelectorAll('.day-buttons button');
      // If this is the first button (index 0), it's Sunday
      const buttonIndex = Array.from(buttons).findIndex(button => button === document.activeElement);
      mappedDay = buttonIndex === 0 ? 'Sun' : 'Sat';
    } else {
      mappedDay = dayMap[day];
    }
      
    setSelectedDays(prev => ({ ...prev, [mappedDay]: isSelected }));
  };

  useEffect(() => {
    const calculateSpendForSelectedDays = () => {
      const selectedDayCount = Object.values(selectedDays).filter(Boolean).length || 1;
      const dailyBudget = budgetAllotment / 7;
      const selectedDaysBudget = dailyBudget * selectedDayCount;
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const selectedDaysSpend = transactions
        .filter(transaction => {
          if (transaction.type !== 'expense') return false;
          
          const transactionDate = new Date(transaction.date);
          const dayOfWeek = transactionDate.getDay();
          const dayMap: { [key: number]: string } = {
            0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
          };
          
          return (
            transactionDate >= startOfWeek &&
            transactionDate <= today &&
            selectedDays[dayMap[dayOfWeek]]
          );
        })
        .reduce((total, transaction) => total + transaction.amount, 0);

      const safeToSpend = Math.max(0, selectedDaysBudget - selectedDaysSpend);
      const spendPercentage = 100 - (selectedDaysSpend / selectedDaysBudget) * 100;
      const isNearWarning = warningPosition >= spendPercentage;

      setSpendData([
        {
          name: "Safe-to-Spend",
          value: safeToSpend,
          fill: isNearWarning ? "#ffd700" : "#82ca9d",
        },
        {
          name: "Dummy",
          value: selectedDaysBudget,
          fill: isNearWarning ? "#ffd700" : "#82ca9d",
        },
      ]);
    };

    calculateSpendForSelectedDays();
  }, [selectedDays, budgetAllotment, transactions, warningPosition, spendOverTime]);

  useEffect(() => {
    const modifiedData = spendData.map((item) => {
      if (item.name === "Safe-to-Spend" && item.value === 0) {
        return { ...item, value: 0.01 };
      }
      return item;
    });
    setBarData(modifiedData);
  }, [spendData]);

  const handleNewTransaction = async (transaction: {
    title: string;
    amount: number;
    date: string;
    category: string;
    isIncome: boolean;
    frequency?:
      | "daily"
      | "weekly"
      | "bi-weekly"
      | "monthly"
      | "quarterly"
      | "annually";
  }) => {
    await addTransaction(transaction);
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  const handleWarningPositionChange = async (position: number) => {
    await updateWarningPosition(position);
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  const handleSavingsPercentChange = async () => {
    await refreshBudgetData();
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  // Calculate aggregated expenses by category
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

  const getRadialPosition = (percentage: number) => {
    // Convert percentage (0-100) to angle between startAngle (-30) and endAngle (210)
    const startAngle = -20;
    const endAngle = 200;
    const angleInDegrees =
      startAngle + (percentage / 100) * (endAngle - startAngle);
    const angleInRadians = (angleInDegrees * Math.PI) / 180;

    // Calculate x and y coordinates on a circle
    const offset = 275;
    const x = -Math.cos(angleInRadians) * offset;
    const y = -Math.sin(angleInRadians) * offset;

    // Return transform CSS with coordinates clamped between -315 and 315
    return {
      transform: `translate(${Math.max(-315, Math.min(315, x))}%, ${Math.max(
        -315,
        Math.min(315, y)
      )}%) rotate(${90 + angleInDegrees}deg)`,
    };
  };

  const handleDelete = async (transaction: Transaction) => {
    await deleteTransaction(transaction.id, transaction.type);
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  return (
    <div className={styles.overview}>
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
      <Card>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardTitle}>Spend</CardTitle>
          <SpendSettingsDialog
            onWarningPositionChange={handleWarningPositionChange}
            onSavingsPercentChange={handleSavingsPercentChange}
          />
        </CardHeader>
        <CardContent>
          <div className={styles.spendContainer}>
            <div className={styles.spendRelativeContainer}>
              <ResponsiveContainer width={400} height={350}>
                <RadialBarChart
                  innerRadius="80%"
                  outerRadius="125%"
                  data={barData}
                  startAngle={210}
                  endAngle={-30}
                  style={{ position: "relative" }}
                >
                  <RadialBar
                    className={styles.radialBar}
                    background
                    dataKey="value"
                    cornerRadius={30}
                    fill={spendData[0].fill}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className={styles.warningIndicatorContainer}>
                <div className={styles.warningIndicatorInner}>
                  <div
                    className={styles.warningLabel}
                    style={getRadialPosition(warningPosition)}
                  >
                    <span className={styles.warningLine} />
                  </div>
                </div>
              </div>
              <div className={styles.spendValueContainer}>
                <div
                  className={styles.spendValue}
                  style={{ color: spendData[0].fill }}
                >
                  ${Math.floor(spendData[0].value).toString()}
                  <sup className={styles.spendValueDecimal}>
                    {(spendData[0].value % 1).toFixed(2).substring(1)}
                  </sup>
                </div>
                <div className={styles.spendName}>{spendData[0].name}</div>
                <div className={styles.spendDate}>Apr 28 - May 4</div>
              </div>
              <div className={styles.dayButtons}>
                <DayCheckbox value="S" selected={selectedDays.Sun} onChange={handleDaySelect} />
                <DayCheckbox value="M" selected={selectedDays.Mon} onChange={handleDaySelect} />
                <DayCheckbox value="T" selected={selectedDays.Tue} onChange={handleDaySelect} />
                <DayCheckbox value="W" selected={selectedDays.Wed} onChange={handleDaySelect} />
                <DayCheckbox value="R" selected={selectedDays.Thu} onChange={handleDaySelect} />
                <DayCheckbox value="F" selected={selectedDays.Fri} onChange={handleDaySelect} />
                <DayCheckbox value="S" selected={selectedDays.Sat} onChange={handleDaySelect} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className={styles.spanTwoRows}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={styles.transactionsContainer}
            style={{ padding: transactions.length > 0 ? "1rem" : "0" }}
          >
            {transactions.map((transaction, index) => (
              <TransactionItem 
                key={index} 
                transaction={transaction} 
                onDelete={() => handleDelete(transaction)}
              />
            ))}
          </div>
          <div className="new-transaction">
            <TransactionDialog onSubmit={handleNewTransaction} />
          </div>
        </CardContent>
      </Card>
      <Card className={styles.spanTwo}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>Income/Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.incomeExpensesContainer}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={transactions
                  .reduce((acc: AggregatedData[], transaction) => {
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
                          transaction.type === "income"
                            ? transaction.amount
                            : 0,
                        expenses:
                          transaction.type === "expense"
                            ? transaction.amount
                            : 0,
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
    </div>
  );
}

export default Overview;