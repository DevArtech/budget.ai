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
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";

declare global {
  interface Window {
    Plaid: {
      create: (config: {
        token: string;
        onSuccess: (
          publicToken: string,
          metadata: { institution: { name: string } }
        ) => void;
        onExit: (err: Error | null) => void;
        onEvent: (eventName: string, metadata: unknown) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

interface NavBarProps {
  title: string;
  backgroundColor?: string;
}

const NavBar: FC<NavBarProps> = ({ title, backgroundColor }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [plaidHandler, setPlaidHandler] = useState<{ open: () => void } | null>(
    null
  );

  const {
    user,
    isLoggedIn,
    linkToken,
    userLoaded,
    fetchUser,
    logout,
    fetchLinkToken,
    exchangePublicToken,
  } = useStore();

  useEffect(() => {
    // If no token and not on login page, redirect to login
    if (!isLoggedIn && location.pathname !== "/login") {
      navigate("/login");
      return;
    }

    // Only fetch user data if not already loaded
    if (isLoggedIn && !userLoaded) {
      fetchUser();
    }
  }, [isLoggedIn, userLoaded, location.pathname]);

  // Fetch Plaid link token when user is available
  useEffect(() => {
    if (user) {
      fetchLinkToken();
    }
  }, [user]);

  // Initialize Plaid when link token is available
  useEffect(() => {
    if (linkToken) {
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken, metadata) => {
          await exchangePublicToken(publicToken, metadata.institution.name);
          toast({
            title: "Account Connected",
            description: `Successfully connected ${metadata.institution.name}`,
          });
          navigate("/?new-account=true");
        },
        onExit: (err) => {
          if (err != null) {
            console.error("Error during Link flow:", err);
          }
        },
        onEvent: (eventName, metadata) => {
          console.log("Event:", eventName, metadata);
        },
      });

      setPlaidHandler(handler);
    }
  }, [linkToken, navigate, toast]);

  const handleLogout = () => {
    logout();
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
                <PopoverContent className="w-48" style={{ paddingTop: "2rem" }}>
                  <div
                    className="py-1"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
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
