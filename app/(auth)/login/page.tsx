import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-lg font-bold text-white">
            NT
          </div>
          <CardTitle>Nita Travels</CardTitle>
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
              <p role="alert" className="text-sm text-status-red">
                Incorrect username or password.
              </p>
            )}
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
