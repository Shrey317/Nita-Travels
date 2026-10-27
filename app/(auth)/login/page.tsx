import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { LoginHero } from "./components/LoginHero";
import { LoginForm } from "./components/LoginForm";
import { Metadata } from "next";
import { RouteBackground } from "./components/RouteBackground";
import { BrandLogo } from "./components/BrandLogo";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Login | Nita Travels Fleet Management",
  description: "Secure access to Nita Travels Fleet Management System",
};

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;

  async function authenticate(formData: FormData): Promise<void> {
    "use server";
    try {
      await signIn("credentials", {
        username: formData.get("username"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=1");
      }
      throw error;
    }
  }

  return (
    <main className={styles.page}>
      <RouteBackground />
      <div className={styles.layout}>
        <BrandLogo className={styles.brand} />
        <LoginHero />
        <LoginForm action={authenticate} error={searchParams?.error} />
      </div>
    </main>
  );
}
