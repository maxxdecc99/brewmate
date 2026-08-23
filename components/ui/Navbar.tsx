import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";
import MobileMenu from "./MobileMenu";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="bg-cream border-b-2 border-ink">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-heading text-xl font-extrabold uppercase tracking-tight text-ink hover:text-terracotta transition-colors shrink-0"
        >
          BrewMate
        </Link>

        <MobileMenu loggedIn={!!user} />

        <div className="hidden md:flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          {user ? (
            <>
              <Link
                href="/generate"
                className="font-heading font-bold uppercase tracking-wide text-ink/70 hover:text-ink hover:bg-ink/5 px-3 py-2 transition-colors text-sm"
              >
                Generate
              </Link>
              <Link
                href="/log"
                className="font-heading font-bold uppercase tracking-wide text-ink/70 hover:text-ink hover:bg-ink/5 px-3 py-2 transition-colors text-sm"
              >
                Brew Log
              </Link>
              <Link
                href="/settings"
                className="font-heading font-bold uppercase tracking-wide text-ink/70 hover:text-ink hover:bg-ink/5 px-3 py-2 transition-colors text-sm"
              >
                Settings
              </Link>
              <Link
                href="/pricing"
                className="font-heading font-bold uppercase tracking-wide text-ink/70 hover:text-ink hover:bg-ink/5 px-3 py-2 transition-colors text-sm"
              >
                Pricing
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="font-heading font-bold uppercase tracking-wide text-ink/70 hover:text-ink hover:bg-ink/5 px-3 py-2 transition-colors text-sm"
              >
                Pricing
              </Link>
              <Link
                href="/auth/login"
                className="font-heading font-bold uppercase tracking-wide text-ink/70 hover:text-ink hover:bg-ink/5 px-3 py-2 transition-colors text-sm"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="font-heading font-bold uppercase tracking-wide bg-terracotta text-white px-4 py-2 text-sm hover:bg-[#dd2b0f] transition-colors"
              >
                Sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
