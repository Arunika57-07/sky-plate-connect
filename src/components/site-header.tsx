import { Link, useNavigate } from "@tanstack/react-router";
import { Bike, ShoppingBag, LogOut, ShieldCheck, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";

export function SiteHeader() {
  const { user, role, profile, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const home =
    role === "admin" ? "/admin" : role === "delivery" ? "/partner" : ("/orders" as const);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="gradient-hot flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground">
            <Bike className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight">buggy</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Restaurants</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="relative">
            <Link to="/cart">
              <ShoppingBag className="h-4 w-4" />
              Cart
              {count > 0 && (
                <Badge className="ml-1 bg-spice text-spice-foreground">{count}</Badge>
              )}
            </Link>
          </Button>

          {user ? (
            <>
              <Button asChild variant="secondary" size="sm">
                <Link to={home}>
                  {role === "admin" ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <User2 className="h-4 w-4" />
                  )}
                  {role === "admin"
                    ? "Admin"
                    : role === "delivery"
                      ? "Deliveries"
                      : (profile?.full_name?.split(" ")[0] || "My orders")}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/", replace: true });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Log in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
