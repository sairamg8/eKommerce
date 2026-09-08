import type { Card } from "./types";
import styles from "./Card.module.css";
import type { ReactNode } from "react";

export default function Card({ children }: Card) {
  return <div className={styles.card}>{children}</div>;
}

Card.Item = ({ children }: { children: ReactNode }) => {
  return <div className={styles.card_item}>{children}</div>;
};
