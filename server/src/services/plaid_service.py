from server.src.databridge.plaid_databridge import PlaidDatabridge
from server.src.databridge.base_databridge import BaseDatabridge
from server.src.models import PlaidTransactionRequest, UserInDB


class PlaidService:
    def __init__(self):
        self.plaid = PlaidDatabridge()
        self.db = BaseDatabridge.get_instance()

    def get_transactions(
        self, transaction_request: PlaidTransactionRequest, current_user: UserInDB
    ):
        tokens = self.db.query(
            "SELECT name, key FROM tokens WHERE user_id = ?", (current_user.id,)
        ).to_dict(orient="records")
        transactions = {}
        for row in tokens:
            transactions[row["name"]] = [
                transaction.to_dict()
                for transaction in self.plaid.get_transactions(
                    row["key"], transaction_request
                )
            ]

        return transactions

    def get_balance(self, account_id: int, current_user: UserInDB):
        tokens = self.db.query(
            "SELECT name, key FROM tokens WHERE user_id = ? AND id = ?",
            (current_user.id, account_id),
        ).to_dict(orient="records")[0]
        return self.plaid.get_balance(tokens["key"])[0].to_dict()
