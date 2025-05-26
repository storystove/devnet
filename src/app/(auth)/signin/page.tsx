import { SignInForm } from "@/components/auth/SignInForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | CollabForge',
  description: 'Sign in to your CollabForge account.',
};

export default function SignInPage() {
  return <SignInForm />;
}
