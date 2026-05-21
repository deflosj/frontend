import { Suspense } from "react";
import RegisterPageClient from "./register-page-client";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <RegisterPageClient />
    </Suspense>
  );
}
