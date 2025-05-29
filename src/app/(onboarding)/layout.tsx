
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "@/components/ui/toaster";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logoUrl = "https://drive.google.com/uc?id=1XDpa3j14CoVRO6e9Gtv9enwq5FV7h_i1";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8 flex items-center space-x-2">
        <Image 
          src={logoUrl} 
          alt="DevNet Logo" 
          width={32} 
          height={32} 
          className="rounded-sm"
          data-ai-hint="application logo"
        />
        <span className="text-2xl font-bold">DevNet</span>
      </Link>
      <div className="w-full max-w-lg">
        {children}
      </div>
      <Toaster />
    </div>
  );
}
