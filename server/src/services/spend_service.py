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

        recurrence_to_days = {
            "daily": 1,
            "weekly": 7,
            "bi-weekly": 14,
            "monthly": 30,
            "quarterly": 91,
            "annually": 365,
        }

        prorated_expenses = fixed_expenses.apply(
            lambda row: (row["amount"] * 14) / recurrence_to_days[row["recurrence"]],
            axis=1,
        )
        total_fixed = prorated_expenses.sum()

        paycheck_amount = paycheck["amount"].iloc[0]

        remaining_income = (
            paycheck_amount
            - total_fixed
            - (paycheck_amount * (float(user.savings_percent) / 100))
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
