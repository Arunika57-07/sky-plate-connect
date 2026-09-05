import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bike, Plane, Trash2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — buggy" },
      {
        name: "description",
        content: "Review your buggy order and choose drone or bike delivery at checkout.",
      },
      { property: "og:title", content: "Your cart — buggy" },
      { property: "og:description", content: "Checkout with drone or bike delivery." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, add, remove, clear, subtotal } = useCart();
  const { user, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"bike" | "drone">("bike");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const premium = profile?.is_premium ?? false;
  const fee = mode === "drone" ? 79 : 29;
  const total = subtotal + (subtotal > 0 ? fee : 0);

  const placeOrder = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (mode === "drone" && !premium) {
      toast.error("Drone delivery is for premium members only");
      return;
    }
    const finalAddress = address || profile?.address || "";
    if (!finalAddress) {
      toast.error("Please add a delivery address");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("orders").insert({
      customer_id: user.id,
      restaurant_id: lines[0]?.restaurant_id ?? null,
      items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
      total,
      delivery_mode: mode,
      status: "placed",
      address: finalAddress,
      city: profile?.city ?? "",
      state: profile?.state ?? "",
      phone: profile?.phone ?? "",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    clear();
    toast.success(mode === "drone" ? "Drone dispatched!" : "Rider assigned!");
    navigate({ to: "/orders" });
  };

  const upgrade = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    const { error } = await supabase.from("profiles").update({ is_premium: true }).eq("id", user.id);
    if (error) toast.error(error.message);
    else {
      await refresh();
      toast.success("You're a premium member — drone delivery unlocked!");
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">Your cart</h1>

      {lines.length === 0 ? (
        <Card className="mt-6 rounded-3xl border-border/70 p-8 text-center shadow-card">
          <p className="text-muted-foreground">Nothing here yet.</p>
          <Button asChild className="mt-4">
            <Link to="/">Browse kitchens</Link>
          </Button>
        </Card>
      ) : (
        <>
          <Card className="mt-6 space-y-4 rounded-3xl border-border/70 p-5 shadow-card">
            {lines.map((l) => (
              <div key={l.id} className="flex items-center gap-3">
                <img
                  src={l.image_url}
                  alt={l.name}
                  loading="lazy"
                  width={768}
                  height={768}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate font-bold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.restaurant_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => remove(l.id)}>
                    −
                  </Button>
                  <span className="w-6 text-center">{l.qty}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      add({
                        id: l.id,
                        name: l.name,
                        price: l.price,
                        image_url: l.image_url,
                        restaurant_id: l.restaurant_id,
                        restaurant_name: l.restaurant_name,
                      })
                    }
                  >
                    +
                  </Button>
                </div>
                <span className="w-16 text-right font-semibold">₹{l.qty * l.price}</span>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="h-4 w-4" /> Empty cart
            </Button>
          </Card>

          <Card className="mt-5 space-y-4 rounded-3xl border-border/70 p-5 shadow-card">
            <h2 className="font-display text-xl font-bold">Delivery</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("bike")}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === "bike" ? "border-primary bg-accent" : "border-border"
                }`}
              >
                <Bike className="h-5 w-5 text-success" />
                <p className="font-display mt-2 font-bold">Bike delivery</p>
                <p className="text-xs text-muted-foreground">All users · ₹29 · 25-40 min</p>
              </button>
              <button
                type="button"
                onClick={() => setMode("drone")}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === "drone" ? "border-primary bg-accent" : "border-border"
                } ${premium ? "" : "opacity-70"}`}
              >
                <Plane className="h-5 w-5 text-primary" />
                <p className="font-display mt-2 flex items-center gap-2 font-bold">
                  Drone delivery
                  <Badge className="bg-spice text-spice-foreground">Premium</Badge>
                </p>
                <p className="text-xs text-muted-foreground">₹79 · 12 min air drop</p>
              </button>
            </div>

            {!premium && (
              <Button variant="secondary" onClick={upgrade}>
                <Crown className="h-4 w-4" /> Unlock premium drone delivery
              </Button>
            )}

            <div className="space-y-2">
              <Label>Delivery address</Label>
              <Input
                value={address || profile?.address || ""}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat, street, city"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">
                Items ₹{subtotal} + delivery ₹{fee}
              </span>
              <span className="font-display text-2xl font-extrabold">₹{total}</span>
            </div>
            <Button className="w-full" size="lg" disabled={busy} onClick={placeOrder}>
              {user ? "Place order" : "Log in to order"}
            </Button>
          </Card>
        </>
      )}
    </main>
  );
}
