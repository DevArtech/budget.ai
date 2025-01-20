import json
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

from ..databridge.base_databridge import BaseDatabridge
from ..services.spend_service import SpendService
from ..settings import settings

class TransactionsByDateRangeTool(BaseTool):
    """Tool for getting transactional data within a date range"""

    name: str = "get_transactions_by_date_range"
    description: str = f"Use this tool to get transactional data within a date range. Input should be a JSON string with start_date and end_date. Date format should be YYYY-MM-DD. Today's date is {datetime.now().strftime('%Y-%m-%d')}. Use this as reference when handling date-related queries."

    db: ClassVar[BaseDatabridge] = BaseDatabridge.get_instance()

    def _run(self, date_range: str, *args, **kwargs) -> str:
        dates = json.loads(date_range)
        start_date = dates['start_date']
        end_date = dates['end_date']
        
        expenses = self.db.query(f"SELECT title, amount, date, category, recurrence, 'expense' as type FROM expenses WHERE date BETWEEN '{start_date}' AND '{end_date}'")
        income = self.db.query(f"SELECT title, amount, date, category, 'income' as type FROM income WHERE date BETWEEN '{start_date}' AND '{end_date}'")
        income['recurrence'] = None
        
        return expenses.to_dict(orient='records') + income.to_dict(orient='records')
    
db = BaseDatabridge.get_instance()
class TransactionsByCategoryTool(BaseTool):
    """Tool for getting transactional data by category"""
    name: str = "get_transactions_by_category"
    description: str = f'Use this tool to get transactional data by category. Input should be a JSON string with category. Category is the name of the category you want to retrieve. The possible categories are: {", ".join(pd.concat([db.query("SELECT DISTINCT category FROM expenses"), db.query("SELECT DISTINCT category FROM income")])["category"].unique())}'
    
    def _run(self, category: str, *args, **kwargs) -> str:
        category = json.loads(category)
        category = category['category']

        expenses = db.query(f"SELECT * FROM expenses WHERE category = '{category}'")
        income = db.query(f"SELECT * FROM income WHERE category = '{category}'")

        return expenses.to_dict(orient='records') + income.to_dict(orient='records')
    
class AccountsTool(BaseTool):
    """Tool for getting account data"""

    name: str = "get_accounts"
    description: str = "Use this tool to get account data. Input should be a JSON string."

    db: ClassVar[BaseDatabridge] = BaseDatabridge.get_instance()

    def _run(self, *args, **kwargs) -> str:
        accounts = self.db.query("SELECT * FROM accounts")
        return accounts.to_dict('records')
    
class TransactionsPerAccountTool(BaseTool):
    """Tool for getting transactional data per account"""

    name: str = "get_transactions_per_account"
    description: str = "Use this tool to get transactional data per account. Input should be a JSON string with account_id. Account ID is the numerical ID of the account you want to retrieve. To get the account ID, use the get_accounts tool. After you get the account ID, use this tool to get the transactions for that account."

    db: ClassVar[BaseDatabridge] = BaseDatabridge.get_instance()

    def _run(self, account_id: str, *args, **kwargs) -> str:
        account = json.loads(account_id)
        account_id = account['account_id']

        expenses = self.db.query("SELECT *, 'expense' as type FROM expenses WHERE account_id = ?", (account_id,))
        income = self.db.query("SELECT *, 'income' as type FROM income WHERE account_id = ?", (account_id,))
        
        # Convert both results to records and combine them
        transactions = expenses.to_dict(orient='records') + income.to_dict(orient='records')
        return transactions
    
class SpendTool(BaseTool):
    """Tool for getting spend data"""

    name: str = "get_spend_details"
    description: str = "Use this tool to get budgeting/spending details for the week. These are based on aggregate statistics based on the user's income and fixed expenses. This tool can give you the maximum budget the user can spend for the week, and the amount they've spent over the last week."

    spend_service: ClassVar[SpendService] = SpendService()

    def _run(self, *args, **kwargs) -> str:
        return {"weekly_max_budget": self.spend_service.get_budget_allotment(), "weekly_spend": self.spend_service.get_spend_over_time(date.today() - timedelta(days=6), date.today() + timedelta(days=1))}

class AssistantService:
    def __init__(self):
        self.llm = ChatGroq(
            groq_api_key=settings.groq_api_key,
            model_name="llama-3.3-70b-versatile",
            streaming=True,
            temperature=0,
        )
        
        # Initialize tools
        transactions_by_date_range_tool = TransactionsByDateRangeTool()
        transactions_by_category_tool = TransactionsByCategoryTool()
        accounts_tool = AccountsTool()
        transactions_per_account_tool = TransactionsPerAccountTool()
        spend_tool = SpendTool()

        self.tools = [
            Tool(
                name=transactions_by_date_range_tool.name,
                description=transactions_by_date_range_tool.description,
                func=transactions_by_date_range_tool._run
            ),
            Tool(
                name=transactions_by_category_tool.name,
                description=transactions_by_category_tool.description,
                func=transactions_by_category_tool._run
            ),
            Tool(
                name=accounts_tool.name,
                description=accounts_tool.description,
                func=accounts_tool._run
            ),
            Tool(
                name=transactions_per_account_tool.name,
                description=transactions_per_account_tool.description,
                func=transactions_per_account_tool._run
            ),
            Tool(
                name=spend_tool.name,
                description=spend_tool.description,
                func=spend_tool._run
            )
        ]
        
        # Initialize memory with system message containing current date
        memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            return_messages=True,
            k=2  # Remember last 2 interactions
        )
        system_message = SystemMessage(content=dedent(f"""You are a financial assistant helping the user with their budgeting and finances. You have access to tools to retrieve transaction and account data.
                                       In general, unless otherwise specified or the use-case determines otherwise, you should check data from within the last month.
                                       
                                       ALWAYS make an attempt to use the tools to get the data you need. If you cannot use the tools, then inform the user that you cannot answer the question.
                                       """)
        )
        memory.chat_memory.add_message(system_message)
        
        # Initialize the agent
        self.agent = initialize_agent(
            self.tools,
            self.llm,
            agent="conversational-react-description",
            verbose=True,
            memory=memory
        )

    async def chat(self, message: str) -> AsyncGenerator[str, None]:
        """
        Process a chat message and stream the response using the agent
        """
        try:
            response = await self.agent.arun(message)
            
            # Since we want to stream the response, we'll yield it in chunks
            chunk_size = 4  # Number of characters per chunk
            for i in range(0, len(response), chunk_size):
                yield response[i:i + chunk_size]
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

    def get_chat_history(self) -> List[Dict[str, str]]:
        """
        Get the conversation history
        """
        history = []
        for message in self.agent.memory.chat_memory.messages:
            if isinstance(message, HumanMessage):
                history.append({"role": "user", "content": message.content})
            elif isinstance(message, AIMessage):
                history.append({"role": "assistant", "content": message.content})
        return history

    def clear_history(self) -> None:
        """
        Clear the conversation history
        """
        self.agent.memory.clear()
