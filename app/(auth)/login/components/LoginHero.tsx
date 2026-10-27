import { FeatureItem } from "./FeatureItem";
import { ChartNoAxesColumnIncreasing, ShieldCheck, MapPin } from "lucide-react";
import styles from "../login.module.css";

export function LoginHero() {
  return (
    <section className={styles.hero} aria-labelledby="login-headline">
      <div className={styles.introduction}>
        <h1 id="login-headline" className={styles.headline}>
          <span>Smarter Fleet Operations</span>
          <span className={styles.highlight}>for a Brighter Tomorrow</span>
        </h1>
        <p className={styles.description}>
          Track. Manage. Optimise. Keep your fleet moving with real-time insights and complete control.
        </p>
        <ul className={styles.features} aria-label="Fleet management features">
          <FeatureItem icon={<ChartNoAxesColumnIncreasing />} label="Real-Time Tracking" />
          <FeatureItem icon={<ShieldCheck />} label="Safer & More Efficient" />
          <FeatureItem icon={<MapPin />} label="Complete Visibility" />
        </ul>
      </div>
    </section>
  );
}
