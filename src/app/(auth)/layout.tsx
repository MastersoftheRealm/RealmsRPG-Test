/**
 * Auth Layout
 * ============
 * Branded layout for authentication pages matching vanilla design
 */

import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/LoginBackground.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/60 to-primary-900/40" />
      </div>

      {/* Decorative D20 Elements */}
      <div className="absolute top-[8%] right-[6%] w-28 h-28 opacity-60 z-10 hidden lg:block">
        <Image src="/images/D20_1.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[40%] left-[3%] w-20 h-20 opacity-50 z-10 hidden lg:block">
        <Image src="/images/D20_2.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-[15%] left-[8%] w-36 h-36 opacity-50 z-10 hidden lg:block">
        <Image src="/images/D20_3.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-[20%] right-[25%] w-24 h-24 opacity-40 z-10 hidden xl:block">
        <Image src="/images/D20_4.png" alt="" fill className="object-contain" />
      </div>

      {/* Main content - side by side on desktop */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Brand Section */}
          <div className="flex-1 text-center lg:text-left">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/LogoFull.png"
                alt="Realms RPG"
                width={400}
                height={150}
                className="h-24 lg:h-32 w-auto"
                priority
              />
            </Link>
            <p className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Forge your own path.
            </p>
            <p className="text-lg text-gray-300">
              Create unique powers and bring your characters to life.
            </p>
          </div>

          {/* Form Section */}
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 p-4 text-center">
        <div className="flex justify-center gap-6 text-gray-300 text-sm">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <a href="mailto:RealmsRoleplayGame@gmail.com" className="hover:text-white transition-colors">
            Contact
          </a>
          <a href="https://discord.gg/Dbd5X9FQFJ" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Discord
          </a>
        </div>
      </footer>
    </div>
  );
}
