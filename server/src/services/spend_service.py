from datetime import date
import calendar
from datetime import datetime

from server.src.models import UserInDB
from server.src.databridge.base_databridge import BaseDatabridge


class SpendService:
    def __init__(self):
        self.db = BaseDatabridge.get_instance()

    def get_budget_allotment(self, user: UserInDB):
        query = """
            SELECT i.amount
            FROM income i
            JOIN accounts a ON i.account_id = a.id
            WHERE i.category = 'Work'
            AND a.user_id = ?
            ORDER BY i.date DESC
            LIMIT 1
        """
        paycheck = self.db.query(query, (user.id,))

        if paycheck.empty:
            return 0

        fixed_expenses = self.db.query(
            """
            SELECT DISTINCT e.amount, e.recurrence
            FROM expenses e
            JOIN accounts a ON e.account_id = a.id
            WHERE e.recurrence IS NOT NULL 
            AND a.user_id = ?
            GROUP BY e.title, e.amount, e.category
        """,
            (user.id,),
        )

        # Get active goals
        goals = self.db.query(
            """
            SELECT amount, date, progress
            FROM goals
            WHERE user_id = ?
            AND completed = 0
            """,
            (user.id,),
        )

        recurrence_to_days = {
            "daily": 1,
            "weekly": 7,
            "bi-weekly": 14,
            "monthly": 30,
            "quarterly": 91,
            "annually": 365,
        }

        prorated_expenses = fixed_expenses["amount"].apply(
            lambda amount: (amount * 14) / recurrence_to_days[fixed_expenses.loc[amount.index, "recurrence"]],
        )
        total_fixed = prorated_expenses.sum()

        # Calculate required goal contributions
        total_goal_contributions = 0
        if not goals.empty:
            today = datetime.now().date()
            for _, goal in goals.iterrows():
                remaining_amount = goal["amount"] - (goal["amount"] * goal["progress"])
                goal_date = datetime.strptime(goal["date"], "%Y-%m-%d").date()
                days_until_deadline = (goal_date - today).days
                if days_until_deadline > 0:
                    # Convert to bi-weekly contribution since we're working with bi-weekly paycheck
                    daily_contribution = remaining_amount / days_until_deadline
                    total_goal_contributions += daily_contribution * 14

        paycheck_amount = paycheck["amount"].iloc[0]
        savings_amount = paycheck_amount * (float(user.savings_percent) / 100)

        remaining_income = (
            paycheck_amount
            - total_fixed
            - savings_amount
            - max(0, total_goal_contributions)
        )
        return remaining_income / 2

    def get_spend_over_time(self, user: UserInDB, start_date: date, end_date: date):
        query = """
            SELECT SUM(e.amount) as total_spend
            FROM expenses e
            JOIN accounts a ON e.account_id = a.id
            WHERE e.date BETWEEN ? AND ?
            AND e.recurrence IS NULL
            AND a.user_id = ?
        """
        result = self.db.query(query, (start_date, end_date, user.id))
        return (
            result["total_spend"].iloc[0]
            if not result.empty and result["total_spend"].iloc[0]
            else 0
        )
