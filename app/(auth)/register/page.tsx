import { RegistrationForm } from './registration-form';

export default function RegisterPage() {
  return <main className="mx-auto min-h-screen max-w-lg px-4 py-12">
    <h1 className="text-2xl font-bold">Request manager access</h1>
    <p className="mt-3 text-muted">Create your own account. The administrator reviews registration requests before granting access.</p>
    <RegistrationForm />
    <a href="/login" className="mt-6 inline-block text-primary underline">Back to sign in</a>
  </main>;
}
