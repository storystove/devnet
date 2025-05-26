import { SignInForm } from "@/components/auth/SignInForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | DevNet',
  description: 'Sign in to your DevNet account.',
};

export default function SignInPage() {
  return <SignInForm />;
}
