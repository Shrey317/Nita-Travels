import type { ReactNode } from "react";
import styles from "../login.module.css";

export function FeatureItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <li className={styles.feature}>
      <div className={styles.featureIcon} aria-hidden="true">{icon}</div>
      <span>{label}</span>
    </li>
  );
}
