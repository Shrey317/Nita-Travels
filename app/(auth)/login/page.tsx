import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { LoginHero } from "./components/LoginHero";
import { LoginForm } from "./components/LoginForm";
import { Metadata } from "next";

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
    <div className="flex min-h-screen w-full bg-[#050B18]">
      {/* Desktop Left Side */}
      <LoginHero />
      
      {/* Right Side (Full width on mobile, 38-40% on desktop) */}
      <div className="flex w-full lg:w-[38%] items-center justify-center p-6 sm:p-12">
        <LoginForm action={authenticate} error={searchParams?.error} />
      </div>
    </div>
  );
}
