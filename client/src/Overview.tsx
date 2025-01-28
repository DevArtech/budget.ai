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
import "./App.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import HouseIcon from "@mui/icons-material/House";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import DeleteIcon from "@mui/icons-material/Delete";
import WorkIcon from "@mui/icons-material/Work";
import HandymanIcon from "@mui/icons-material/Handyman";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import FlightIcon from "@mui/icons-material/Flight";
import CategoryIcon from "@mui/icons-material/Category";
import { TransactionDialog } from "./components/custom/TransactionDialog";
import { SpendSettingsDialog } from "./components/custom/SpendSettingsDialog";
import { useNavigate } from "react-router-dom";
import { useStore, categories } from "./store/useStore";
import { Transaction } from "./types";

interface DayCheckboxProps {
  value: string;
  selected?: boolean;
}

interface AggregatedData {
  date: string;
  income: number;
  expenses: number;
}

function DayCheckbox({ value, selected }: DayCheckboxProps) {
  const [isSelected, setIsSelected] = useState(selected || false);
  return (
    <Button
      style={{
        backgroundColor: isSelected ? "#4ade80" : "#eff0f3",
        color: isSelected ? "white" : "black",
      }}
      onClick={() => setIsSelected(!isSelected)}
    >
      {value}
    </Button>
  );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const deleteTransaction = useStore((state) => state.deleteTransaction);

  const handleDelete = async () => {
    await deleteTransaction(transaction.id, transaction.type);
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  return (
    <div
      className="transaction-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-row items-center gap-4">
        {transaction.category == "Housing" && (
          <HouseIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {(transaction.category == "Food" ||
          transaction.category == "Food and Drink") && (
          <FastfoodIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Transportation" && (
          <DirectionsBusIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Utilities" && (
          <WaterDropIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {(transaction.category == "Entertainment" ||
          transaction.category == "Recreation") && (
          <TheaterComedyIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Work" && (
          <WorkIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Service" && (
          <HandymanIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Shops" && (
          <StorefrontIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Transfer" && (
          <SyncAltIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Travel" && (
          <FlightIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Other" && (
          <CategoryIcon sx={{ color: transaction.backgroundColor }} />
        )}
        <div className="flex flex-col">
          <p
            className="text-lg font-bold"
            style={{
              maxWidth: "21rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {transaction.title}
          </p>
          <p className="text-sm text-gray-500">{transaction.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p
          className="text-lg font-bold"
          style={{
            color: transaction.type === "income" ? "#22c55e" : "#ef4444",
          }}
        >
          {transaction.type === "income" ? "+" : "-"}$
          {transaction.amount.toFixed(2)}
        </p>
        {isHovered && (
          <Button
            variant="ghost"
            size="icon"
            className="delete-button h-8 w-8 p-0"
            onClick={handleDelete}
          >
            <DeleteIcon color="error" fontSize="large" />
          </Button>
        )}
      </div>
    </div>
  );
}

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
  } = useStore();

  useEffect(() => {
    fetchInitialData();
    fetchTransactionsAndExpenses();
  }, []);

  useEffect(() => {
    const safeToSpend = Math.max(0, budgetAllotment - spendOverTime);
    const spendPercentage = 100 - (spendOverTime / budgetAllotment) * 100;
    const isNearWarning = warningPosition >= spendPercentage;

    setSpendData([
      {
        name: "Safe-to-Spend",
        value: safeToSpend,
        fill: isNearWarning ? "#ffd700" : "#82ca9d",
      },
      {
        name: "Dummy",
        value: budgetAllotment,
        fill: isNearWarning ? "#ffd700" : "#82ca9d",
      },
    ]);
  }, [budgetAllotment, spendOverTime, warningPosition]);

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

  return (
    <div className="overview">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {pieChartData.length > 0 ? (
            <div className="relative">
              <div
                className="absolute flex flex-col items-center"
                style={{ top: "-5%" }}
              >
                <h2 className="text-xl">
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
            <div className="flex items-center justify-center h-full">
              <p className="text-lg text-gray-500">No expenses to display</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle className="text-2xl">Spend</CardTitle>
          <SpendSettingsDialog
            onWarningPositionChange={handleWarningPositionChange}
            onSavingsPercentChange={handleSavingsPercentChange}
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="relative">
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
                    className="radial-bar"
                    background
                    dataKey="value"
                    cornerRadius={30}
                    fill={spendData[0].fill}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div
                    className="warning-label"
                    style={getRadialPosition(warningPosition)}
                  >
                    <span
                      className="h-full"
                      style={{ width: "1px", backgroundColor: "black" }}
                    />
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center items-center justify-center">
                <div
                  className="text-4xl font-bold"
                  style={{ color: spendData[0].fill }}
                >
                  ${Math.floor(spendData[0].value).toString()}
                  <sup className="text-2xl font-normal">
                    {(spendData[0].value % 1).toFixed(2).substring(1)}
                  </sup>
                </div>
                <div className="text-sm text-gray-500">{spendData[0].name}</div>
                <div className="text-xs text-gray-400 mt-2">Apr 28 - May 4</div>
              </div>
              <div className="day-buttons flex flex-row gap-2">
                <DayCheckbox value="S" />
                <DayCheckbox value="M" />
                <DayCheckbox value="T" />
                <DayCheckbox value="W" />
                <DayCheckbox value="T" selected />
                <DayCheckbox value="F" selected />
                <DayCheckbox value="S" selected />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card style={{ gridRow: "span 2" }}>
        <CardHeader>
          <CardTitle className="text-2xl">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              maxHeight: "85vh",
              gap: "1.5rem",
              padding: transactions.length > 0 ? "1rem" : "0",
            }}
            className="flex flex-col items-center overflow-y-auto"
          >
            {transactions.map((transaction, index) => (
              <TransactionItem key={index} transaction={transaction} />
            ))}
          </div>
          <div className="new-transaction">
            <TransactionDialog onSubmit={handleNewTransaction} />
          </div>
        </CardContent>
      </Card>
      <Card style={{ gridColumn: "span 2" }}>
        <CardHeader>
          <CardTitle className="text-2xl">Income/Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
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
