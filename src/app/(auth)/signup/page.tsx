import { SignUpForm } from "@/components/auth/SignUpForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | CollabForge',
  description: 'Create your CollabForge account.',
};

export default function SignUpPage() {
  return <SignUpForm />;
}
