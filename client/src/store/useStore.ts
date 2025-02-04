import { create } from "zustand";
import { Transaction, Expense } from "../types";
import api from "../lib/api";

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

  deleteAccount: (accountId: number) => Promise<void>;
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
      let url = "/transactions";
      if (accountId !== "all") {
        url = `/accounts/${accountId}/transactions`;
      }

      const response = await api.get(url);
      const transactionsWithColors = response.data.map((t: Transaction) => ({
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
      // Fetch user data to get spend warning position
      const userResponse = await api.get("/users/me/");
      const userData = await userResponse.data;
      set({ warningPosition: userData.spend_warning });

      // Fetch budget allotment
      const budgetResponse = await api.get("/spend/budget-allotment");
      const budgetData = await budgetResponse.data;
      set({ budgetAllotment: budgetData });

      // Fetch fixed per month expenses
      const fixedResponse = await api.get("/expenses/fixed-per-month");
      const fixedData = await fixedResponse.data;
      console.log(fixedData);
      set({ fixedPerMonth: fixedData });

      // Fetch spend over time
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

      const spendResponse = await api.get(
        `/spend/spend-over-time?start_date=${
          startOfWeek.toISOString().split("T")[0]
        }&end_date=${endOfWeek.toISOString().split("T")[0]}`
      );

      if (spendResponse.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const spendData = await spendResponse.data;
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
      const transactionsResponse = await api.get("/transactions");

      if (transactionsResponse.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const transactionsData = await transactionsResponse.data;
      const transactionsWithColors = transactionsData.map((t: Transaction) => ({
        ...t,
        backgroundColor:
          categories[t.category as keyof typeof categories] || "#8884d8",
      }));
      set({ transactions: transactionsWithColors });

      // Fetch expenses
      const expensesResponse = await api.get("/expenses");

      if (expensesResponse.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const expensesData = await expensesResponse.data;
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

      const response = await api.get("/accounts");

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      // Fetch transactions for each account
      const accountsWithTransactions = await Promise.all(
        response.data.map(async (account: Account) => {
          try {
            const transactionsResponse = await api.get(
              `/accounts/${account.id}/transactions`
            );
            return { ...account, transactions: transactionsResponse.data };
          } catch (error) {
            console.error(
              `Error fetching transactions for account ${account.id}:`,
              error
            );
            return account;
          }
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

      await api.post("/accounts", account);
      // Refresh accounts after successful creation
      await get().fetchAccounts();
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.post(
        `/${transaction.isIncome ? "income" : "expenses"}`,
        transaction
      );

      // Only refresh necessary data after successful addition
      await get().fetchAccountTransactions(get().selectedAccountId);
      await get().fetchTransactionsAndExpenses();
      await get().refreshBudgetData();
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
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
      await api.delete(`/${endpoint}/${transactionId}`);

      // Only refresh necessary data after successful deletion
      await get().fetchAccountTransactions(get().selectedAccountId);
      await get().fetchTransactionsAndExpenses();
      await get().refreshBudgetData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateWarningPosition: async (position: number) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.put("/users/me/update-spend-warning", {
        spend_warning: position,
      });

      // Only update local state after successful server update
      set({ warningPosition: position });
    } catch (error) {
      console.error("Error updating warning position:", error);
      throw error;
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
      const budgetResponse = await api.get("/spend/budget-allotment");
      const budgetData = await budgetResponse.data;
      set({ budgetAllotment: budgetData });

      // Refresh spend over time
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

      const spendResponse = await api.get(
        `/spend/spend-over-time?start_date=${
          startOfWeek.toISOString().split("T")[0]
        }&end_date=${endOfWeek.toISOString().split("T")[0]}`
      );

      if (spendResponse.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const spendData = await spendResponse.data;
      set({ spendOverTime: spendData });

      // Refresh fixed per month
      const fixedResponse = await api.get("/expenses/fixed-per-month");
      const fixedData = await fixedResponse.data;
      set({ fixedPerMonth: fixedData });
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

      const response = await api.get("/goals");

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const goalsWithDates = response.data.map((goal: BackendGoal) => ({
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

      await api.post("/goals", formattedGoal);
      await get().fetchGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
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

      await api.put(`/goals/${goal.id}`, formattedGoal);
      await get().fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteGoal: async (goalId) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.delete(`/goals/${goalId}`);
      await get().fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
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

      await api.put(`/goals/${goalId}`, formattedGoal);
      await get().fetchGoals();
    } catch (error) {
      console.error("Error updating goal progress:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUser: async () => {
    if (get().userLoaded && !get().isLoading) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        set({ isLoggedIn: false, user: null, userLoaded: true });
        return;
      }

      const response = await api.get("/users/me/");
      set({ user: response.data, isLoggedIn: true, userLoaded: true });
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

      const response = await api.get(`/plaid/link-token?user_id=${user.id}`);
      set({ linkToken: response.data.link_token });
    } catch (error) {
      console.error("Error fetching link token:", error);
      throw error;
    }
  },

  exchangePublicToken: async (publicToken: string, institutionName: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.post("/plaid/exchange-public-token", {
        public_token: publicToken,
        name: institutionName,
      });

      // Refresh accounts after successful connection
      await get().fetchAccounts();
    } catch (error) {
      console.error("Error exchanging public token:", error);
      throw error;
    }
  },

  fetchUserSettings: async () => {
    if (get().settingsLoaded && !get().isLoading) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/users/me/");
      set({
        warningPosition: response.data.spend_warning,
        savingsPercent: response.data.savings_percent,
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

      await api.put("/users/me/update-spend-warning", {
        spend_warning: position,
      });
      set({ warningPosition: position });
    } catch (error) {
      console.error("Error updating warning position:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSavingsPercent: async (percent: number) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.put("/users/me/update-savings-percent", {
        savings_percent: percent,
      });
      set({ savingsPercent: percent });
    } catch (error) {
      console.error("Error updating savings percent:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAccount: async (accountId: number) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.delete(`/accounts/${accountId}`);
      // Refresh accounts after successful deletion
      await get().fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
