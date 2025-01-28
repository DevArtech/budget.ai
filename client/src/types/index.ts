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
