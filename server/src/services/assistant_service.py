import json
import asyncio
import pandas as pd
from textwrap import dedent
from datetime import date, timedelta
from langchain_groq import ChatGroq
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema.messages import HumanMessage, AIMessage, SystemMessage
from langchain.tools import BaseTool
from langchain.agents import initialize_agent, Tool
from typing import AsyncGenerator, List, Dict, ClassVar
from datetime import datetime
from langchain.agents import AgentExecutor

from ..models import UserInDB
from ..databridge.base_databridge import BaseDatabridge
from ..services.spend_service import SpendService
from ..settings import settings


class TransactionsByDateRangeTool(BaseTool):
    """Tool for getting transactional data within a date range"""

    user_id: int
    name: str = "get_transactions_by_date_range"
    description: str = (
        f"Use this tool to get transactional data within a date range. Input should be a JSON string with start_date and end_date. Date format should be YYYY-MM-DD. Today's date is {datetime.now().strftime('%Y-%m-%d')}. Use this as reference when handling date-related queries."
    )

    db: ClassVar[BaseDatabridge] = BaseDatabridge.get_instance()

    def _run(self, date_range: str, *args, **kwargs) -> str:
        dates = json.loads(date_range)
        start_date = dates["start_date"]
        end_date = dates["end_date"]

        expenses = self.db.query(
            """
            SELECT e.title, e.amount, e.date, e.category, e.recurrence, 'expense' as type 
            FROM expenses e
            JOIN accounts a ON e.account_id = a.id
            WHERE e.date BETWEEN ? AND ?
            AND a.user_id = ?
        """,
            (start_date, end_date, self.user_id),
        )

        income = self.db.query(
            """
            SELECT i.title, i.amount, i.date, i.category, 'income' as type 
            FROM income i
            JOIN accounts a ON i.account_id = a.id
            WHERE i.date BETWEEN ? AND ?
            AND a.user_id = ?
        """,
            (start_date, end_date, self.user_id),
        )
        income["recurrence"] = None

        transactions = expenses.to_dict(orient="records") + income.to_dict(
            orient="records"
        )
        if not transactions:
            return "No transactions found for the date range."

        return transactions


db = BaseDatabridge.get_instance()


class TransactionsByCategoryTool(BaseTool):
    """Tool for getting transactional data by category"""

    user_id: int
    name: str = "get_transactions_by_category"
    description: str = (
        f'Use this tool to get transactional data by category. Input should be a JSON string with category. Category is the name of the category you want to retrieve. The possible categories are: {", ".join(pd.concat([db.query("SELECT DISTINCT e.category FROM expenses e JOIN accounts a ON e.account_id = a.id"), db.query("SELECT DISTINCT i.category FROM income i JOIN accounts a ON i.account_id = a.id")])["category"].unique())}'
    )

    db: ClassVar[BaseDatabridge] = BaseDatabridge.get_instance()

    def _run(self, category: str, *args, **kwargs) -> str:
        category = json.loads(category)
        category = category["category"]

        expenses = self.db.query(
            """
            SELECT e.*, 'expense' as type 
            FROM expenses e
            JOIN accounts a ON e.account_id = a.id
            WHERE e.category = ?
            AND a.user_id = ?
        """,
            (category, self.user_id),
        )

        income = self.db.query(
            """
            SELECT i.*, 'income' as type 
            FROM income i
            JOIN accounts a ON i.account_id = a.id
            WHERE i.category = ?
            AND a.user_id = ?
        """,
            (category, self.user_id),
        )

        transactions = expenses.to_dict(orient="records") + income.to_dict(
            orient="records"
        )
        if not transactions:
            return "No transactions found for the category."

        return transactions


class AccountsTool(BaseTool):
    """Tool for getting account data"""

    user_id: int
    name: str = "get_accounts"
    description: str = (
        "Use this tool to get account data. Input should be a JSON string."
    )

    db: ClassVar[BaseDatabridge] = BaseDatabridge.get_instance()

    def _run(self, *args, **kwargs) -> str:
        accounts = self.db.query(
            "SELECT * FROM accounts WHERE user_id = ?", (self.user_id,)
        )
        if accounts.empty:
            return "This user has no accounts."
        return accounts.to_dict("records")


class TransactionsPerAccountTool(BaseTool):
    """Tool for getting transactional data per account"""

    user_id: int
    name: str = "get_transactions_per_account"
    description: str = (
        "Use this tool to get transactional data per account. Input should be a JSON string with account_id. Account ID is the numerical ID of the account you want to retrieve. To get the account ID, use the get_accounts tool. After you get the account ID, use this tool to get the transactions for that account."
    )

    db: ClassVar[BaseDatabridge] = BaseDatabridge.get_instance()

    def _run(self, account_id: str, *args, **kwargs) -> str:
        account = json.loads(account_id)
        account_id = account["account_id"]

        # First verify the account belongs to the user
        account_check = self.db.query(
            "SELECT id FROM accounts WHERE id = ? AND user_id = ?",
            (account_id, self.user_id),
        )
        if account_check.empty:
            return "No accounts of this ID found for the user."

        expenses = self.db.query(
            "SELECT *, 'expense' as type FROM expenses WHERE account_id = ?",
            (account_id,),
        )
        income = self.db.query(
            "SELECT *, 'income' as type FROM income WHERE account_id = ?", (account_id,)
        )

        # Convert both results to records and combine them
        transactions = expenses.to_dict(orient="records") + income.to_dict(
            orient="records"
        )
        if not transactions:
            return "No transactions found for this account."

        return transactions


class SpendTool(BaseTool):
    """Tool for getting spend data"""

    user_id: int
    name: str = "get_spend_details"
    description: str = (
        "Use this tool to get budgeting/spending details for the week. These are based on aggregate statistics based on the user's income and fixed expenses. This tool can give you the maximum budget the user can spend for the week, and the amount they've spent over the last week."
    )

    spend_service: ClassVar[SpendService] = SpendService()

    def _run(self, *args, **kwargs) -> str:
        user = UserInDB(
            id=self.user_id,
            username="",
            email="",
            full_name="",
            disabled=False,
            hashed_password="",
        )
        return {
            "weekly_max_budget": self.spend_service.get_budget_allotment(user),
            "weekly_spend": self.spend_service.get_spend_over_time(
                user, date.today() - timedelta(days=6), date.today() + timedelta(days=1)
            ),
        }


class AssistantService:
    def __init__(self):
        self.llm = ChatGroq(
            groq_api_key=settings.groq_api_key,
            model_name="llama-3.3-70b-versatile",
            streaming=True,
            temperature=0,
        )

        # Initialize the agent
        self.agents: Dict[int, AgentExecutor] = {}
        self.actions = {
            "get_transactions_by_date_range": "Retrieving transaction data from {start_date} to {end_date}...",
            "get_transactions_by_category": "Retrieving transaction data for {category}...",
            "get_accounts": "Retrieving account data...",
            "get_transactions_per_account": "Retrieving transaction data for {account_name}...",
            "get_spend_details": "Retrieving spend data...",
        }

        # Map tools to their preprocessing functions
        self.preprocessors = {
            "get_transactions_per_account": self._preprocess_account_data,
            # Add more preprocessors here as needed
        }

    def _preprocess_account_data(self, input_data: dict) -> dict:
        """Preprocesses account data by adding account name."""
        if "account_id" in input_data:
            account = BaseDatabridge.get_instance().query(
                "SELECT name FROM accounts WHERE id = ?", (input_data["account_id"],)
            )
            if not account.empty:
                input_data["account_name"] = account.iloc[0]["name"]
            else:
                input_data["account_name"] = f"account {input_data['account_id']}"
        return input_data

    async def chat(self, user: UserInDB, message: str) -> AsyncGenerator[str, None]:
        """
        Process a chat message and stream the response using the agent
        """
        if user.id not in self.agents:
            transactions_by_date_range_tool = TransactionsByDateRangeTool(
                user_id=user.id
            )
            transactions_by_category_tool = TransactionsByCategoryTool(user_id=user.id)
            accounts_tool = AccountsTool(user_id=user.id)
            transactions_per_account_tool = TransactionsPerAccountTool(user_id=user.id)
            spend_tool = SpendTool(user_id=user.id)

            tools = [
                Tool(
                    name=transactions_by_date_range_tool.name,
                    description=transactions_by_date_range_tool.description,
                    func=transactions_by_date_range_tool._run,
                ),
                Tool(
                    name=transactions_by_category_tool.name,
                    description=transactions_by_category_tool.description,
                    func=transactions_by_category_tool._run,
                ),
                Tool(
                    name=accounts_tool.name,
                    description=accounts_tool.description,
                    func=accounts_tool._run,
                ),
                Tool(
                    name=transactions_per_account_tool.name,
                    description=transactions_per_account_tool.description,
                    func=transactions_per_account_tool._run,
                ),
                Tool(
                    name=spend_tool.name,
                    description=spend_tool.description,
                    func=spend_tool._run,
                ),
            ]

            memory = ConversationBufferWindowMemory(
                memory_key="chat_history",
                return_messages=True,
                k=2,  # Remember last 2 interactions
            )
            system_message = SystemMessage(
                content=dedent(
                    f"""
                                        You are a financial assistant helping the user with their budgeting and finances. You have access to tools to retrieve transaction and account data.
                                        In general, unless otherwise specified or the use-case determines otherwise, you should check data from within the last month.
                                        
                                        ALWAYS make an attempt to use the tools to get the data you need. If you cannot use the tools, then inform the user that you cannot answer the question.
                                        NEVER respond with an ID of data. If you have an ID, find the name the ID corresponds to.
                                        ENSURE that tool inputs are formatted as JSON strings with the keys being the names of the parameters for the tools you are using.
                                        """
                )
            )
            memory.chat_memory.add_message(system_message)

            self.agents[user.id] = initialize_agent(
                tools,
                self.llm,
                agent="conversational-react-description",
                verbose=True,
                memory=memory,
            )
        try:
            async for chunk in self.agents[user.id].astream(message):
                if chunk.get("actions"):
                    action = chunk.get("actions")[0]
                    input_data = json.loads(action.tool_input)

                    # Apply any preprocessing for this tool
                    if action.tool in self.preprocessors:
                        input_data = self.preprocessors[action.tool](input_data)

                    yield f"<|{self.actions[action.tool].format(**input_data)}|>"
                elif chunk.get("output"):
                    output = chunk.get("output")
                    for word in output.split():
                        yield (word + " ").replace("|>", "").replace("<|", "")
                        await asyncio.sleep(0.02)

        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg:
                # Extract wait time from error message
                import re

                wait_time = "a little bit"
                if match := re.search(r"please try again in (.*?)\.", error_msg):
                    wait_time = match.group(1)
                yield f"Rate limit has been reached, please try again in {wait_time}s."
            else:
                raise e

    def get_chat_history(self, user: UserInDB) -> List[Dict[str, str]]:
        """
        Get the conversation history
        """
        history = []
        if user.id in self.agents:
            for message in self.agents[user.id].memory.chat_memory.messages:
                if isinstance(message, HumanMessage):
                    history.append({"role": "user", "content": message.content})
                elif isinstance(message, AIMessage):
                    history.append({"role": "assistant", "content": message.content})
        return history

    def clear_history(self, user: UserInDB) -> None:
        """
        Clear the conversation history
        """
        if user.id in self.agents:
            self.agents[user.id].memory.clear()
