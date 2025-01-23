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
import { TransactionDialog } from "./components/custom/TransactionDialog";
import { SpendSettingsDialog } from "./components/custom/SpendSettingsDialog";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: number;
  title: string;
  date: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  backgroundColor?: string;
  frequency?:
    | "daily"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "quarterly"
    | "annually";
}

interface AggregatedData {
  date: string;
  income: number;
  expenses: number;
}

interface DayCheckboxProps {
  value: string;
  selected?: boolean;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  date: string;
  category: string;
  recurrence?:
    | "daily"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "quarterly"
    | "annually";
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

function TransactionItem({
  transaction,
  categories,
  setTransactions,
  setExpenses,
  setFixedPerMonth,
  setBudgetAllotment,
  setSpendOverTime,
}: {
  transaction: Transaction;
  categories: Record<string, string>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setFixedPerMonth: React.Dispatch<React.SetStateAction<number>>;
  setBudgetAllotment: React.Dispatch<React.SetStateAction<number>>;
  setSpendOverTime: React.Dispatch<React.SetStateAction<number>>;
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = async () => {
    try {
      const endpoint = transaction.type === "income" ? "income" : "expenses";
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/${endpoint}/${transaction.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      // Refresh all data after deletion
      const refreshData = async () => {
        try {
          // Refresh transactions
          const transactionsResponse = await fetch(
            "http://localhost:8000/transactions",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (transactionsResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const transactionsData = await transactionsResponse.json();
          const transactionsWithColors = transactionsData.map(
            (t: Transaction) => ({
              ...t,
              backgroundColor:
                categories[t.category as keyof typeof categories] || "#8884d8",
            })
          );
          setTransactions(transactionsWithColors);

          // Refresh expenses
          const expensesResponse = await fetch(
            "http://localhost:8000/expenses",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (expensesResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const expensesData = await expensesResponse.json();
          setExpenses(expensesData);

          // Refresh fixed per month
          const fixedResponse = await fetch(
            "http://localhost:8000/expenses/fixed-per-month",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (fixedResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const fixedData = await fixedResponse.json();
          setFixedPerMonth(fixedData || 0);

          // Refresh budget allotment
          const budgetResponse = await fetch(
            "http://localhost:8000/spend/budget-allotment",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (budgetResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const budgetData = await budgetResponse.json();
          setBudgetAllotment(budgetData);

          // Refresh spend over time
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

          const spendResponse = await fetch(
            `http://localhost:8000/spend/spend-over-time?start_date=${
              startOfWeek.toISOString().split("T")[0]
            }&end_date=${endOfWeek.toISOString().split("T")[0]}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (spendResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const spendData = await spendResponse.json();
          setSpendOverTime(spendData);
        } catch (error) {
          console.error("Error refreshing data:", error);
        }
      };

      refreshData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
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
        {transaction.category == "Food" && (
          <FastfoodIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Transportation" && (
          <DirectionsBusIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Utilities" && (
          <WaterDropIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Entertainment" && (
          <TheaterComedyIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category == "Work" && (
          <WorkIcon sx={{ color: transaction.backgroundColor }} />
        )}
        <div className="flex flex-col">
          <p className="text-lg font-bold">{transaction.title}</p>
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
          {transaction.type === "income" ? "+" : "-"}${transaction.amount}
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetAllotment, setBudgetAllotment] = useState<number>(1);
  const [spendOverTime, setSpendOverTime] = useState<number>(1);
  const [fixedPerMonth, setFixedPerMonth] = useState<number>(1);
  const [warningPosition, setWarningPosition] = useState<number>(25);
  const [spendData, setSpendData] = useState([
    {
      name: "Safe-to-Spend",
      value: spendOverTime,
      fill: "#82ca9d",
    },
    {
      name: "Dummy",
      value: budgetAllotment,
      fill: "#82ca9d",
    },
  ]);

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

  const categories = {
    Housing: "#8884d8",
    Food: "#82ca9d",
    Transportation: "#ffc658",
    Utilities: "#ff8042",
    Entertainment: "#26547D",
    Work: "#9c27b0",
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch user data to get spend warning position
        const userResponse = await fetch("http://localhost:8000/users/me/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();
        setWarningPosition(userData.spend_warning);

        // Fetch budget allotment
        const budgetResponse = await fetch(
          "http://localhost:8000/spend/budget-allotment",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (budgetResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!budgetResponse.ok) {
          throw new Error("Failed to fetch budget allotment");
        }

        const budgetData = await budgetResponse.json();
        setBudgetAllotment(budgetData);

        // Fetch fixed per month expenses
        const fixedResponse = await fetch(
          "http://localhost:8000/expenses/fixed-per-month",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (fixedResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!fixedResponse.ok) {
          throw new Error("Failed to fetch fixed expenses");
        }

        const fixedData = await fixedResponse.json();
        setFixedPerMonth(fixedData || 0);

        // Fetch spend over time
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

        const spendResponse = await fetch(
          `http://localhost:8000/spend/spend-over-time?start_date=${
            startOfWeek.toISOString().split("T")[0]
          }&end_date=${endOfWeek.toISOString().split("T")[0]}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (spendResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!spendResponse.ok) {
          throw new Error("Failed to fetch spend over time");
        }

        const spendData = await spendResponse.json();
        setSpendOverTime(spendData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    const fetchTransactionsAndExpenses = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch transactions
        const transactionsResponse = await fetch(
          "http://localhost:8000/transactions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (transactionsResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!transactionsResponse.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const transactionsData = await transactionsResponse.json();
        const transactionsWithColors = transactionsData.map(
          (t: Transaction) => ({
            ...t,
            backgroundColor:
              categories[t.category as keyof typeof categories] || "#8884d8",
          })
        );
        setTransactions(transactionsWithColors);

        // Fetch expenses
        const expensesResponse = await fetch("http://localhost:8000/expenses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (expensesResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!expensesResponse.ok) {
          throw new Error("Failed to fetch expenses");
        }

        const expensesData = await expensesResponse.json();
        setExpenses(expensesData);
      } catch (error) {
        console.error("Error fetching transactions and expenses:", error);
      }
    };

    fetchTransactionsAndExpenses();
  }, [navigate]);

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
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/${transaction.isIncome ? "income" : "expenses"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...transaction,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }

      // Refresh all data after adding transaction
      const refreshData = async () => {
        try {
          // Refresh transactions
          const transactionsResponse = await fetch(
            "http://localhost:8000/transactions",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (transactionsResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const transactionsData = await transactionsResponse.json();
          const transactionsWithColors = transactionsData.map(
            (t: Transaction) => ({
              ...t,
              backgroundColor:
                categories[t.category as keyof typeof categories] || "#8884d8",
            })
          );
          setTransactions(transactionsWithColors);

          // Refresh expenses
          const expensesResponse = await fetch(
            "http://localhost:8000/expenses",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (expensesResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const expensesData = await expensesResponse.json();
          setExpenses(expensesData);

          // Refresh fixed per month
          const fixedResponse = await fetch(
            "http://localhost:8000/expenses/fixed-per-month",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (fixedResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const fixedData = await fixedResponse.json();
          setFixedPerMonth(fixedData || 0);

          // Refresh budget allotment
          const budgetResponse = await fetch(
            "http://localhost:8000/spend/budget-allotment",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (budgetResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const budgetData = await budgetResponse.json();
          setBudgetAllotment(budgetData);

          // Refresh spend over time
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

          const spendResponse = await fetch(
            `http://localhost:8000/spend/spend-over-time?start_date=${
              startOfWeek.toISOString().split("T")[0]
            }&end_date=${endOfWeek.toISOString().split("T")[0]}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (spendResponse.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const spendData = await spendResponse.json();
          setSpendOverTime(spendData);
        } catch (error) {
          console.error("Error refreshing data:", error);
        }
      };

      refreshData();
    } catch (error) {
      console.error("Error adding transaction:", error);
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

  const handleWarningPositionChange = (position: number) => {
    setWarningPosition(position);
  };

  const handleSavingsPercentChange = (_: number) => {
    const refreshData = async () => {
      const token = localStorage.getItem("token");
      try {
        console.log("Refreshing data...");
        // Refresh budget allotment
        const budgetResponse = await fetch(
          "http://localhost:8000/spend/budget-allotment",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (budgetResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const budgetData = await budgetResponse.json();
        setBudgetAllotment(budgetData);

        // Refresh spend over time
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

        const spendResponse = await fetch(
          `http://localhost:8000/spend/spend-over-time?start_date=${
            startOfWeek.toISOString().split("T")[0]
          }&end_date=${endOfWeek.toISOString().split("T")[0]}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (spendResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const spendData = await spendResponse.json();
        setSpendOverTime(spendData);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    };

    refreshData();
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
                  <Tooltip formatter={(value) => `$${value}`} />
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
              <TransactionItem
                key={index}
                transaction={transaction}
                categories={categories}
                setTransactions={setTransactions}
                setExpenses={setExpenses}
                setFixedPerMonth={setFixedPerMonth}
                setBudgetAllotment={setBudgetAllotment}
                setSpendOverTime={setSpendOverTime}
              />
            ))}
          </div>
          <div className="new-transaction">
            <TransactionDialog
              onSubmit={
                handleNewTransaction as (transaction: {
                  title: string;
                  amount: number;
                  date: string;
                  category: string;
                  isIncome: boolean;
                  recurrence?:
                    | "daily"
                    | "weekly"
                    | "bi-weekly"
                    | "monthly"
                    | "quarterly"
                    | "annually";
                }) => void
              }
            />
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
