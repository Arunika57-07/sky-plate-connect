import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bike, Plane, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/partner")({
  head: () => ({
    meta: [
      { title: "Delivery queue — buggy partner" },
      { name: "description", content: "Live buggy delivery queue for riders and drone pilots." },
      { property: "og:title", content: "Delivery queue — buggy partner" },
      { property: "og:description", content: "Pick up, deliver and close orders." },
    ],
  }),
  component: PartnerDash,
});

type Order = {
  id: string;
  items: { name: string; qty: number }[];
  total: number;
  delivery_mode: string;
  status: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  courier_id: string | null;
};

const NEXT: Record<string, string> = {
  placed: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "delivered",
};

function PartnerDash() {
  const { user, profile, role } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["partner-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .neq("status", "delivered")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Order[];
    },
  });

  const advance = async (o: Order) => {
    const next = NEXT[o.status];
    if (!next) return;
    const { error } = await supabase
      .from("orders")
      .update({ status: next, courier_id: user?.id ?? null })
      .eq("id", o.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Order marked ${next.replace(/_/g, " ")}`);
      void qc.invalidateQueries({ queryKey: ["partner-orders"] });
    }
  };

  if (role && role !== "delivery" && role !== "admin") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Partners only</h1>
        <p className="mt-2 text-muted-foreground">
          This area is for buggy delivery partners and staff.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">Delivery queue</h1>
      <p className="mt-1 text-muted-foreground">
        {profile?.full_name} · {profile?.vehicle_number ?? "no vehicle on file"}
      </p>

      <div className="mt-6 space-y-3">
        {isLoading && <Skeleton className="h-28 w-full rounded-3xl" />}
        {data?.length === 0 && (
          <Card className="rounded-3xl border-border/70 p-6 text-center shadow-card">
            <p className="text-muted-foreground">No live orders right now.</p>
          </Card>
        )}
        {data?.map((o) => (
          <Card key={o.id} className="rounded-3xl border-border/70 p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-display font-bold">
                {o.delivery_mode === "drone" ? (
                  <Plane className="h-4 w-4 text-primary" />
                ) : (
                  <Bike className="h-4 w-4 text-success" />
                )}
                {o.delivery_mode} · ₹{Number(o.total).toFixed(0)}
              </span>
              <Badge className="bg-primary text-primary-foreground">
                {o.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-spice" /> {o.address}
              {o.city ? `, ${o.city}` : ""}
              {o.state ? `, ${o.state}` : ""}
            </p>
            {o.phone && (
              <p className="mt-1 flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-success" /> {o.phone}
              </p>
            )}
            <Button className="mt-3" size="sm" onClick={() => advance(o)}>
              Mark {(NEXT[o.status] ?? "delivered").replace(/_/g, " ")}
            </Button>
          </Card>
        ))}
      </div>
    </main>
  );
}
