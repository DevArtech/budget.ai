export interface Transaction {
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

export interface Expense {
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

export interface DayCheckboxProps {
  value: string;
  selected?: boolean;
  onChange: (value: string, isSelected: boolean) => void;
}

export interface AggregatedData {
  date: string;
  income: number;
  expenses: number;
}

export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  last_updated: string;
}

export interface TransactionDialogProps {
  onSubmit: (transaction: {
    title: string;
    amount: number;
    date: string;
    category: string;
    isIncome: boolean;
    account_id: number;
    recurrence?:
      | "daily"
      | "weekly"
      | "bi-weekly"
      | "monthly"
      | "quarterly"
      | "annually";
  }) => void;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ActionMessage {
  id: number;
  text: string;
  timestamp: number;
}