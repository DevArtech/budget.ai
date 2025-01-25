import { FC, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

interface NavBarProps {
  title: string;
  backgroundColor?: string;
}

const NavBar: FC<NavBarProps> = ({ title, backgroundColor }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // If no token and not on login page, redirect to login
    if (!token && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
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
                <Link to="/connect-bank">
                  <NavigationMenuLink>Connect Bank</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </>
          )}
          <NavigationMenuItem className={styles.login}>
            {isLoggedIn ? (
              <NavigationMenuLink onClick={handleLogout}>
                Logout
              </NavigationMenuLink>
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
