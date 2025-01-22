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
            SELECT DISTINCT e.amount 
            FROM expenses e
            JOIN accounts a ON e.account_id = a.id
            WHERE e.recurrence IS NOT NULL 
            AND a.user_id = ?
            GROUP BY e.title, e.amount, e.category
        """,
            (user.id,),
        )

        # Calculate prorated fixed expenses (14 days worth)
        now = datetime.now()
        current_year = now.year
        current_month = now.month

        total_days = calendar.monthrange(current_year, current_month)[1]
        prorated_expenses = fixed_expenses["amount"].apply(
            lambda x: (x * 14) / total_days
        )
        total_fixed = prorated_expenses.sum()

        paycheck_amount = paycheck["amount"].iloc[0]

        remaining_income = paycheck_amount - total_fixed - (paycheck_amount * 0.1)
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
