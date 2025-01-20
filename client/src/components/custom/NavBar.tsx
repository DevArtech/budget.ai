import { FC } from "react";
import { Link } from "react-router-dom";
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
  return (
    <nav className={styles.nav} style={{ backgroundColor }}>
      <Link to="/">
        <h2>{title}</h2>
      </Link>
      <NavigationMenu className={styles.navMenu}>
        <NavigationMenuList>
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
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
};

export default NavBar;
