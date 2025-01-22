import os
import sqlite3
import pandas as pd
from typing import Any, Tuple, List, Optional


class BaseDatabridge:
    _instance = None

    @classmethod
    def get_instance(cls, db_path: str = "budget_ai.db"):
        """
        Get singleton instance of BaseDatabridge.

        Args:
            db_path (str): Path to the SQLite database file.

        Returns:
            BaseDatabridge: Singleton instance of BaseDatabridge
        """
        if cls._instance is None:
            cls._instance = cls(db_path)
        return cls._instance

    def __init__(self, db_path: str):
        """
        Initialize the BaseDatabridge class with the path to the SQLite database.

        Args:
            db_path (str): Path to the SQLite database file.
        """
        if BaseDatabridge._instance is not None:
            raise Exception("This class is a singleton. Use get_instance() instead.")

        self.db_path = db_path

        # Check if database exists, if not create it with demo tables
        if not os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()

            # Create users table
            cursor.execute(
                """
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    hashed_password TEXT NOT NULL,
                    disabled INTEGER NOT NULL DEFAULT 0
                );
            """
            )

            # Create expenses table
            cursor.execute(
                """
                CREATE TABLE expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL, amount REAL NOT NULL,
                    date TEXT NOT NULL,
                    category TEXT NOT NULL,
                    recurrence TEXT,
                    account_id INTEGER
                );
            """
            )

            # Create income table
            cursor.execute(
                """
                CREATE TABLE income (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    amount REAL NOT NULL,
                    date TEXT NOT NULL,
                    category TEXT NOT NULL,
                    account_id INTEGER
                );
            """
            )

            cursor.execute(
                """
                CREATE TABLE accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    balance REAL NOT NULL DEFAULT 0.0,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    user_id INTEGER NOT NULL
                );
            """
            )

            conn.commit()
            conn.close()

    def query(
        self, procedure: str, parameters: Optional[Tuple[Any, ...]] = None
    ) -> pd.DataFrame:
        """
        Execute a SELECT query against the database and return the result as a pandas DataFrame.

        Args:
            procedure (str): The SQL query to execute.
            parameters (Optional[Tuple[Any, ...]]): Optional parameters for the query.

        Returns:
            pd.DataFrame: The result of the query as a pandas DataFrame.
        """
        try:
            with sqlite3.connect(self.db_path) as connection:
                if parameters:
                    df = pd.read_sql_query(procedure, connection, params=parameters)
                else:
                    df = pd.read_sql_query(procedure, connection)
                return df
        except sqlite3.Error as e:
            print(f"Error during query execution: {e}")
            return pd.DataFrame()

    def execute(
        self, procedure: str, parameters: Optional[Tuple[Any, ...]] = None
    ) -> None:
        """
        Execute a non-SELECT SQL procedure (e.g., INSERT, UPDATE, DELETE) and commit the changes.

        Args:
            procedure (str): The SQL command to execute.
            parameters (Optional[Tuple[Any, ...]]): Optional parameters for the command.
        """
        try:
            with sqlite3.connect(self.db_path) as connection:
                cursor = connection.cursor()
                if parameters:
                    cursor.execute(procedure, parameters)
                else:
                    cursor.execute(procedure)
                connection.commit()
        except sqlite3.Error as e:
            print(f"Error during execution: {e}")
