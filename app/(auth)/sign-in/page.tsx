import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export const metadata = {
  title: "Sign in · Custod",
};

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
