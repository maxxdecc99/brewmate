import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="border-b-2 border-stone-900 bg-[#FAF7F2]">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-stone-900 hover:text-amber-600 transition-colors shrink-0"
        >
          BrewMate
        </Link>

        <div className="flex items-center gap-2 sm:gap-6 flex-wrap justify-end">
          {user ? (
            <>
              <Link
                href="/generate"
                className="font-bold text-stone-700 hover:text-stone-900 border-b-2 border-transparent hover:border-amber-500 transition-all pb-0.5 text-sm sm:text-base"
              >
                Generate
              </Link>
              <Link
                href="/log"
                className="font-bold text-stone-700 hover:text-stone-900 border-b-2 border-transparent hover:border-amber-500 transition-all pb-0.5 text-sm sm:text-base"
              >
                Brew Log
              </Link>
              <Link
                href="/settings"
                className="font-bold text-stone-700 hover:text-stone-900 border-b-2 border-transparent hover:border-amber-500 transition-all pb-0.5 text-sm sm:text-base"
              >
                Settings
              </Link>
              <Link
                href="/pricing"
                className="font-bold text-stone-700 hover:text-stone-900 border-b-2 border-transparent hover:border-amber-500 transition-all pb-0.5 text-sm sm:text-base"
              >
                Pricing
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="font-bold text-stone-700 hover:text-stone-900 text-sm transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/auth/login"
                className="font-bold text-stone-700 hover:text-stone-900 text-sm transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="font-bold bg-stone-900 text-[#FAF7F2] px-4 py-2 text-sm border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 transition-colors"
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
