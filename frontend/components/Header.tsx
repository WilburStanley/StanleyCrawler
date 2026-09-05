"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const Header = () => {
  const pathname = usePathname();
  const isRootPage = pathname === "/";

  return (
    <header className="border-b border-border px-8">
      <div className="max-w-4xl mx-auto space-y-8 py-4">
        {isRootPage ? (
          <span className="text-sm font-medium">StanleyCrawler <span className="text-sm text-muted font-medium">- Built by Wilbur Stanley</span></span>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted hover:text-text"
          >
            <ChevronLeft size={16} />
            Back to dashboard
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;