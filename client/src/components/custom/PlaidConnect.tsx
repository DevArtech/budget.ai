import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Plaid: any;
  }
}

export function PlaidConnect() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidHandler, setPlaidHandler] = useState<any>(null);

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const token = localStorage.getItem("token");

        const userResponse = await fetch(`http://localhost:8000/users/me/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const user = await userResponse.json();
        const userId = user.id;

        const response = await fetch(`http://localhost:8000/plaid/link-token?user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch link token");
        }

        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (error) {
        console.error("Error fetching link token:", error);
      }
    };

    fetchLinkToken();
  }, [navigate]);

  useEffect(() => {
    if (linkToken) {
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (_: string, metadata: any) => {
          console.log("Success:", metadata);
          const public_token = metadata.institution.public_token || metadata.public_token;
          const name = metadata.institution.name;
          try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/plaid/exchange-public-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ public_token, name }),
            });

            if (response.ok) {
              toast({
                title: "Account Connected",
                description: `Successfully connected ${name}`,
              });
              // Redirect to overview or show success message
              navigate("/?new-account=true");
            }
          } catch (error) {
            console.error("Error exchanging public token:", error);
          }
        },
        onExit: (err: Error | null, metadata: any) => {
          if (err != null) {
            console.error("Error during Link flow:", err, metadata);
          }
          // Handle exit
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log("Event:", eventName, metadata);
        },
      });

      setPlaidHandler(handler);
    }
  }, [linkToken, navigate, toast]);

  const handleConnect = () => {
    if (plaidHandler) {
      plaidHandler.open();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{width: "100vw"}}>
      <div className="p-8 text-center">
        <h1 className="text-black text-2xl font-bold mb-4">Connect Your Bank Account</h1>
        <p className="text-black mb-6">
          Securely connect your bank account to track your transactions and manage your budget.
        </p>
        <Button
          onClick={handleConnect}
          className="w-full"
          disabled={!plaidHandler}
        >
          Connect a Bank Account
        </Button>
      </div>
    </div>
  );
} 