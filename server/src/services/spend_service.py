from datetime import date
import calendar
from datetime import datetime

from server.src.databridge.base_databridge import BaseDatabridge

class SpendService:
    def __init__(self):
        self.db = BaseDatabridge.get_instance()

    def get_budget_allotment(self):
        query = """
            SELECT amount
            FROM income
            WHERE category = 'Work'
            ORDER BY date DESC
            LIMIT 1
        """
        paycheck = self.db.query(query)

        if paycheck.empty:
            return 0

        fixed_expenses = self.db.query("SELECT DISTINCT amount FROM expenses WHERE recurrence IS NOT NULL GROUP BY title, amount, category")

        # Calculate prorated fixed expenses (14 days worth)
        now = datetime.now()
        current_year = now.year
        current_month = now.month

        total_days = calendar.monthrange(current_year, current_month)[1]
        prorated_expenses = fixed_expenses['amount'].apply(lambda x: (x * 14) / total_days)
        total_fixed = prorated_expenses.sum()

        paycheck_amount = paycheck['amount'].iloc[0]

        remaining_income = paycheck_amount - total_fixed - (paycheck_amount * 0.1)
        return remaining_income / 2
        
    
    def get_spend_over_time(self, start_date: date, end_date: date):
        query = """
            SELECT SUM(amount) as total_spend
            FROM expenses 
            WHERE date BETWEEN ? AND ?
            AND recurrence IS NULL
        """
        result = self.db.query(query, (start_date, end_date))
        return result['total_spend'].iloc[0] if not result.empty and result['total_spend'].iloc[0] else 0
