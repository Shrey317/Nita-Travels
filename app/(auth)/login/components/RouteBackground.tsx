import styles from "../login.module.css";

export function RouteBackground() {
  return (
    <div className={styles.decoration} aria-hidden="true">
      <div className={styles.grid} />
      <svg className={styles.routes} viewBox="0 0 1200 120" fill="none" preserveAspectRatio="none">
        <g stroke="#3B82F6" strokeWidth="1" opacity="0.22">
          <path d="M0 95 H210 Q260 95 300 55 T390 15 H700 Q760 15 800 55 T900 95 H1200" />
          <path d="M120 120 Q170 70 250 70 H670 Q730 70 770 35 T870 5 H1080" strokeDasharray="4 7" />
        </g>
        <g fill="#60A5FA" opacity="0.5">
          <circle cx="210" cy="95" r="3" />
          <circle cx="700" cy="15" r="3" />
          <circle cx="900" cy="95" r="3" />
        </g>
      </svg>
    </div>
  );
}
