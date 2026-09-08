import type { ReactNode } from "react";
import styles from "./Header.module.css";
import type { HeaderItem, HeaderProps } from "./types";
import clsx from "clsx";

export default function Header(props: HeaderProps) {
  const { children } = props;

  return (
    <header aria-label="Header Info" className={clsx(styles["header-info"])}>
      <nav>
        <ul>{children}</ul>
      </nav>
    </header>
  );
}

function NavBarBrand({ children }: { children: ReactNode }) {
  return <li className={clsx(styles["navbar-brand"])}>{children}</li>;
}

function HeaderItem({ children, elementStyles }: HeaderItem) {
  return <li className={clsx(styles.navbarItem, elementStyles)}>{children}</li>;
}

Header.Brand = NavBarBrand;
Header.Item = HeaderItem;
