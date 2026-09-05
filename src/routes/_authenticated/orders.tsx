import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bike, Plane, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My orders — buggy" },
      { name: "description", content: "Track your buggy drone and bike deliveries." },
      { property: "og:title", content: "My orders — buggy" },
      { property: "og:description", content: "Live status for every buggy order." },
    ],
  }),
  component: MyOrders,
});

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  delivery_mode: string;
  status: string;
  address: string;
  created_at: string;
};

export function statusColor(status: string) {
  if (status === "delivered") return "bg-success text-success-foreground";
  if (status === "cancelled") return "bg-spice text-spice-foreground";
  return "bg-primary text-primary-foreground";
}

function MyOrders() {
  const { user, profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Order[];
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">
        Hi {profile?.full_name?.split(" ")[0] || "there"} 👋
      </h1>
      <p className="mt-1 text-muted-foreground">
        {profile?.phone} · {profile?.address}
        {profile?.city ? `, ${profile.city}` : ""}
        {profile?.state ? `, ${profile.state}` : ""}
      </p>
      {profile?.is_premium && (
        <Badge className="mt-3 bg-spice text-spice-foreground">
          <Crown className="mr-1 h-3 w-3" /> Premium · drone delivery
        </Badge>
      )}

      <h2 className="mt-8 font-display text-2xl font-bold">Orders</h2>
      <div className="mt-4 space-y-3">
        {isLoading && <Skeleton className="h-24 w-full rounded-3xl" />}
        {data?.length === 0 && (
          <Card className="rounded-3xl border-border/70 p-6 text-center shadow-card">
            <p className="text-muted-foreground">No orders yet.</p>
            <Button asChild className="mt-3">
              <Link to="/">Order something tasty</Link>
            </Button>
          </Card>
        )}
        {data?.map((o) => (
          <Card key={o.id} className="rounded-3xl border-border/70 p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {o.delivery_mode === "drone" ? (
                  <Plane className="h-4 w-4 text-primary" />
                ) : (
                  <Bike className="h-4 w-4 text-success" />
                )}
                <span className="font-display font-bold capitalize">{o.delivery_mode} delivery</span>
              </div>
              <Badge className={statusColor(o.status)}>{o.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
            </p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{o.address}</span>
              <span className="font-display text-lg font-bold">₹{Number(o.total).toFixed(0)}</span>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
