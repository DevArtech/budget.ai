import { create } from "zustand";
import { Transaction, Expense } from "../types";

export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  last_updated: string;
  transactions?: Transaction[];
}

export interface User {
  id: number;
  username: string;
  full_name: string | null;
}

interface BackendGoal {
  id: number;
  name: string;
  description: string;
  amount: number;
  progress: number;
  date: string;
  completed: boolean;
}

export interface Goal {
  id?: number;
  name: string;
  description: string;
  amount: number;
  progress?: number;
  deadline: Date;
  completed?: boolean;
  date?: string;
}

export const categories = {
  Housing: "#FF6B6B",
  Food: "#4ECDC4",
  Transportation: "#45B7D1",
  Utilities: "#96CEB4",
  Entertainment: "#FFEEAD",
  Work: "#D4A5A5",
  "Food and Drink": "#82ca9d",
  Service: "#4a90e2",
  Shops: "#f06292",
  Transfer: "#7986cb",
  Travel: "#ffd54f",
  Other: "#90a4ae",
};

interface StoreState {
  transactions: Transaction[];
  expenses: Expense[];
  budgetAllotment: number;
  spendOverTime: number;
  fixedPerMonth: number;
  warningPosition: number;
  savingsPercent: number;
  isLoading: boolean;
  hasLoaded: boolean;
  accounts: Account[];
  accountsLoaded: boolean;
  selectedAccountId: string;
  transactionsLoaded: boolean;
  goals: Goal[];
  goalsLoaded: boolean;
  user: User | null;
  userLoaded: boolean;
  linkToken: string | null;
  isLoggedIn: boolean;
  settingsLoaded: boolean;

  // Actions
  fetchInitialData: () => Promise<void>;
  fetchTransactionsAndExpenses: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchAccountTransactions: (accountId: string) => Promise<void>;
  addAccount: (account: {
    name: string;
    type: string;
    balance: number;
  }) => Promise<void>;
  addTransaction: (transaction: {
    title: string;
    amount: number;
    date: string;
    category: string;
    isIncome: boolean;
    account_id?: number;
    frequency?:
      | "daily"
      | "weekly"
      | "bi-weekly"
      | "monthly"
      | "quarterly"
      | "annually";
  }) => Promise<void>;
  deleteTransaction: (
    transactionId: number,
    type: "income" | "expense"
  ) => Promise<void>;
  updateWarningPosition: (position: number) => Promise<void>;
  refreshBudgetData: () => Promise<void>;
  setSelectedAccountId: (accountId: string) => void;

  // Goals actions
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: number) => Promise<void>;
  updateGoalProgress: (goalId: number, progress: number) => Promise<void>;

  // New actions for user and Plaid
  fetchUser: () => Promise<void>;
  logout: () => void;
  fetchLinkToken: () => Promise<void>;
  exchangePublicToken: (
    publicToken: string,
    institutionName: string
  ) => Promise<void>;

  // New actions for settings
  updateSpendWarning: (position: number) => Promise<void>;
  updateSavingsPercent: (percent: number) => Promise<void>;
  fetchUserSettings: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  transactions: [],
  expenses: [],
  budgetAllotment: 1,
  spendOverTime: 1,
  fixedPerMonth: 1,
  warningPosition: 25,
  savingsPercent: 20,
  isLoading: false,
  hasLoaded: false,
  accounts: [],
  accountsLoaded: false,
  selectedAccountId: "all",
  transactionsLoaded: false,
  goals: [],
  goalsLoaded: false,
  user: null,
  userLoaded: false,
  linkToken: null,
  isLoggedIn: !!localStorage.getItem("token"),
  settingsLoaded: false,

  setSelectedAccountId: (accountId: string) => {
    set({ selectedAccountId: accountId });
    if (accountId !== get().selectedAccountId) {
      get().fetchAccountTransactions(accountId);
    }
  },

  fetchAccountTransactions: async (accountId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      let url = "http://localhost:8000/transactions";
      if (accountId !== "all") {
        url = `http://localhost:8000/accounts/${accountId}/transactions`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      const transactionsWithColors = data.map((t: Transaction) => ({
        ...t,
        backgroundColor:
          categories[t.category as keyof typeof categories] || "#8884d8",
      }));
      set({ transactions: transactionsWithColors, transactionsLoaded: true });
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  },

  fetchInitialData: async () => {
    if (get().hasLoaded) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch user data to get spend warning position
      const userResponse = await fetch("http://localhost:8000/users/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (userResponse.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const userData = await userResponse.json();
      set({ warningPosition: userData.spend_warning });

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
        return;
      }

      const budgetData = await budgetResponse.json();
      set({ budgetAllotment: budgetData });

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
        return;
      }

      const fixedData = await fixedResponse.json();
      set({ fixedPerMonth: fixedData || 0 });

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
        return;
      }

      const spendData = await spendResponse.json();
      set({ spendOverTime: spendData, hasLoaded: true });
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  },

  fetchTransactionsAndExpenses: async () => {
    if (get().hasLoaded && !get().isLoading) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

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
        return;
      }

      const transactionsData = await transactionsResponse.json();
      const transactionsWithColors = transactionsData.map((t: Transaction) => ({
        ...t,
        backgroundColor:
          categories[t.category as keyof typeof categories] || "#8884d8",
      }));
      set({ transactions: transactionsWithColors });

      // Fetch expenses
      const expensesResponse = await fetch("http://localhost:8000/expenses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (expensesResponse.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const expensesData = await expensesResponse.json();
      set({ expenses: expensesData });
    } catch (error) {
      console.error("Error fetching transactions and expenses:", error);
    }
  },

  fetchAccounts: async () => {
    // Skip if already loaded and not being called as part of a refresh
    if (get().accountsLoaded && !get().isLoading) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:8000/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();

      // Fetch transactions for each account
      const accountsWithTransactions = await Promise.all(
        data.map(async (account: Account) => {
          const transactionsResponse = await fetch(
            `http://localhost:8000/accounts/${account.id}/transactions`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (transactionsResponse.status === 401) {
            localStorage.removeItem("token");
            return account;
          }

          if (transactionsResponse.ok) {
            const transactions = await transactionsResponse.json();
            return { ...account, transactions };
          }
          return account;
        })
      );

      set({
        accounts: accountsWithTransactions.filter(Boolean),
        accountsLoaded: true,
      });
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  },

  addAccount: async (account) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:8000/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(account),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to create account");
      }

      // Refresh accounts after successful creation
      await get().fetchAccounts();
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `http://localhost:8000/${transaction.isIncome ? "income" : "expenses"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transaction),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }

      // Only refresh necessary data after successful addition
      await get().fetchAccountTransactions(get().selectedAccountId);
      await get().fetchTransactionsAndExpenses();
      await get().refreshBudgetData();
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTransaction: async (
    transactionId: number,
    type: "income" | "expense"
  ) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const endpoint = type === "income" ? "income" : "expenses";
      const response = await fetch(
        `http://localhost:8000/${endpoint}/${transactionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      // Only refresh necessary data after successful deletion
      await get().fetchAccountTransactions(get().selectedAccountId);
      await get().fetchTransactionsAndExpenses();
      await get().refreshBudgetData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateWarningPosition: async (position: number) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Update warning position on the server
      const response = await fetch(
        `http://localhost:8000/users/me/update-spend-warning?spend_warning=${position}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update warning position");
      }

      // Only update local state after successful server update
      set({ warningPosition: position });
    } catch (error) {
      console.error("Error updating warning position:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshBudgetData: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

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
        return;
      }

      const budgetData = await budgetResponse.json();
      set({ budgetAllotment: budgetData });

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
        return;
      }

      const spendData = await spendResponse.json();
      set({ spendOverTime: spendData });

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
        return;
      }

      const fixedData = await fixedResponse.json();
      set({ fixedPerMonth: fixedData || 0 });
    } catch (error) {
      console.error("Error refreshing budget data:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGoals: async () => {
    if (get().goalsLoaded && !get().isLoading) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:8000/goals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch goals");
      }

      const data = await response.json();
      const goalsWithDates = data.map((goal: BackendGoal) => ({
        ...goal,
        deadline: new Date(goal.date),
      }));
      set({ goals: goalsWithDates, goalsLoaded: true });
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  },

  addGoal: async (goal) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const formattedGoal = {
        ...goal,
        date: goal.deadline.toISOString().split("T")[0],
        deadline: undefined,
      };

      const response = await fetch("http://localhost:8000/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedGoal),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to create goal");
      }

      await get().fetchGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateGoal: async (goal) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const formattedGoal = {
        ...goal,
        date: goal.deadline.toISOString().split("T")[0],
      };

      const response = await fetch(`http://localhost:8000/goals/${goal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedGoal),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update goal");
      }

      await get().fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteGoal: async (goalId) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`http://localhost:8000/goals/${goalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }

      await get().fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateGoalProgress: async (goalId, progress) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const goal = get().goals.find((g) => g.id === goalId);
      if (!goal) return;

      const formattedGoal = {
        ...goal,
        progress,
        date: goal.deadline.toISOString().split("T")[0],
      };

      const response = await fetch(`http://localhost:8000/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedGoal),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update goal progress");
      }

      await get().fetchGoals();
    } catch (error) {
      console.error("Error updating goal progress:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUser: async () => {
    // Skip if already loaded and not being called as part of a refresh
    if (get().userLoaded && !get().isLoading) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        set({ isLoggedIn: false, user: null, userLoaded: true });
        return;
      }

      const response = await fetch("http://localhost:8000/users/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        set({ isLoggedIn: false, user: null, userLoaded: true });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      set({ user: userData, isLoggedIn: true, userLoaded: true });
    } catch (error) {
      console.error("Error fetching user:", error);
      set({ isLoggedIn: false, user: null, userLoaded: true });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({
      isLoggedIn: false,
      user: null,
      userLoaded: false,
      linkToken: null,
      hasLoaded: false,
      accountsLoaded: false,
      transactionsLoaded: false,
      goalsLoaded: false,
      settingsLoaded: false,
    });
  },

  fetchLinkToken: async () => {
    try {
      const token = localStorage.getItem("token");
      const user = get().user;
      if (!token || !user) return;

      const response = await fetch(
        `http://localhost:8000/plaid/link-token?user_id=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch link token");
      }

      const data = await response.json();
      set({ linkToken: data.link_token });
    } catch (error) {
      console.error("Error fetching link token:", error);
    }
  },

  exchangePublicToken: async (publicToken: string, institutionName: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "http://localhost:8000/plaid/exchange-public-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            public_token: publicToken,
            name: institutionName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to exchange public token");
      }

      // Refresh accounts after successful connection
      await get().fetchAccounts();
    } catch (error) {
      console.error("Error exchanging public token:", error);
    }
  },

  fetchUserSettings: async () => {
    // Skip if already loaded and not being called as part of a refresh
    if (get().settingsLoaded && !get().isLoading) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:8000/users/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user settings");
      }

      const userData = await response.json();
      set({
        warningPosition: userData.spend_warning,
        savingsPercent: userData.savings_percent,
        settingsLoaded: true,
      });
    } catch (error) {
      console.error("Error fetching user settings:", error);
    }
  },

  updateSpendWarning: async (position: number) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`http://localhost:8000/users/me/update-spend-warning?spend_warning=${position}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update warning position");
      }

      set({ warningPosition: position });
    } catch (error) {
      console.error("Error updating warning position:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateSavingsPercent: async (percent: number) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `http://localhost:8000/users/me/update-savings-percent?savings_percent=${percent}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update savings percent");
      }

      set({ savingsPercent: percent });
    } catch (error) {
      console.error("Error updating savings percent:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
