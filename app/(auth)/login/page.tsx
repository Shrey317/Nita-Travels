import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";

async function authenticate(formData: FormData): Promise<void> {
  "use server";
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    // NextAuth's own successful-sign-in redirect is implemented by throwing a special Next.js
    // redirect error — only a genuine AuthError means the credentials were actually rejected.
    // Anything else must be re-thrown so that internal redirect can complete normally.
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw error;
  }
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#0a1929] to-navy" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-teal/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-teal-light/15 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy-light/40 blur-[80px]" />
      </div>

      {/* Login card with glassmorphism */}
      <Card className="relative z-10 w-full max-w-sm animate-scale-in border-border/30 bg-card/95 shadow-card-elevated backdrop-blur-xl">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal-dark shadow-glow">
            <Truck className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-xl">Nita Travels</CardTitle>
          <CardDescription>Fleet Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={authenticate} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {searchParams?.error && (
              <p role="alert" className="animate-slide-up text-sm text-status-red">
                Incorrect username or password.
              </p>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal shadow-md hover:shadow-glow">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
