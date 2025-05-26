import { SignUpForm } from "@/components/auth/SignUpForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | DevNet',
  description: 'Create your DevNet account.',
};

export default function SignUpPage() {
  return <SignUpForm />;
}
