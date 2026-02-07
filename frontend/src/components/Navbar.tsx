"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-lg bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
              OmniOracle
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/markets" className="text-sm text-gray-400 hover:text-white transition-colors">
                Markets
              </Link>
              <Link href="/create" className="text-sm text-gray-400 hover:text-white transition-colors">
                Create
              </Link>
              <Link href="/portfolio" className="text-sm text-gray-400 hover:text-white transition-colors">
                Portfolio
              </Link>
              <Link href="/explorer" className="text-sm text-gray-400 hover:text-white transition-colors">
                Explorer
              </Link>
            </div>
          </div>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
