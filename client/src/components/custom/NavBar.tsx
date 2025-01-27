import { FC, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Plaid: any;
  }
}

interface NavBarProps {
  title: string;
  backgroundColor?: string;
}

interface User {
  username: string;
  full_name: string | null;
  id: number;
}

const NavBar: FC<NavBarProps> = ({ title, backgroundColor }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidHandler, setPlaidHandler] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // If no token and not on login page, redirect to login
    if (!token && location.pathname !== "/login") {
      navigate("/login");
    }

    // Fetch user data if logged in
    if (token) {
      axios.get("http://localhost:8000/users/me/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        setUser(response.data);
      })
      .catch(() => {
        // If error fetching user data, assume token is invalid and logout
        handleLogout();
      });
    }
  }, [location.pathname]);

  // Fetch Plaid link token when user is available
  useEffect(() => {
    const fetchLinkToken = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8000/plaid/link-token?user_id=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
  }, [user]);

  // Initialize Plaid when link token is available
  useEffect(() => {
    if (linkToken) {
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (_: string, metadata: any) => {
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
              navigate("/?new-account=true");
            }
          } catch (error) {
            console.error("Error exchanging public token:", error);
          }
        },
        onExit: (err: Error | null) => {
          if (err != null) {
            console.error("Error during Link flow:", err);
          }
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log("Event:", eventName, metadata);
        },
      });

      setPlaidHandler(handler);
    }
  }, [linkToken, navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
    navigate("/login");
  };

  const handleConnectBank = () => {
    if (plaidHandler) {
      plaidHandler.open();
    }
  };

  return (
    <nav className={styles.nav} style={{ backgroundColor }}>
      <Link to="/">
        <h2>{title}</h2>
      </Link>
      <NavigationMenu className={styles.navMenu}>
        <NavigationMenuList>
          {isLoggedIn && (
            <>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink>Overview</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/accounts">
                  <NavigationMenuLink>Accounts</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/transactions">
                  <NavigationMenuLink>Transactions</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/goals">
                  <NavigationMenuLink>Goals</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </>
          )}
          <NavigationMenuItem className={styles.login}>
            {isLoggedIn ? (
              <Popover>
                <PopoverTrigger className={styles.user}>
                  <NavigationMenuLink>
                    {user?.full_name || user?.username}
                  </NavigationMenuLink>
                </PopoverTrigger>
                <PopoverContent className="w-48" style={{paddingTop: "2rem"}}>
                  <div className="py-1" style={{display: "flex", flexDirection: "column", gap: "0.25rem"}}>
                    <button
                      onClick={handleConnectBank}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      disabled={!plaidHandler}
                    >
                      Connect Bank
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Logout
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Link to="/login">
                <NavigationMenuLink>Login</NavigationMenuLink>
              </Link>
            )}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
};

export default NavBar;
