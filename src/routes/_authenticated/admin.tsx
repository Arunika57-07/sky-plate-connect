import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bike, Plane, ShieldCheck, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Operations console — buggy admin" },
      { name: "description", content: "buggy admin console for orders, revenue and kitchens." },
      { property: "og:title", content: "Operations console — buggy admin" },
      { property: "og:description", content: "Every order across every state, in one place." },
    ],
  }),
  component: AdminDash,
});

type Order = {
  id: string;
  items: { name: string; qty: number }[];
  total: number;
  delivery_mode: string;
  status: string;
  city: string;
  state: string;
  created_at: string;
};

function AdminDash() {
  const { role } = useAuth();
  const qc = useQueryClient();

  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as Order[];
    },
  });

  const restaurants = useQuery({
    queryKey: ["admin-restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").order("state");
      if (error) throw error;
      return data;
    },
  });

  if (role && role !== "admin") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in with a buggy staff account to open the console.
        </p>
      </main>
    );
  }

  const list = orders.data ?? [];
  const revenue = list.reduce((n, o) => n + Number(o.total), 0);
  const drones = list.filter((o) => o.delivery_mode === "drone").length;

  const cancel = async (id: string) => {
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Order cancelled");
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display flex items-center gap-2 text-3xl font-extrabold">
        <ShieldCheck className="h-7 w-7 text-primary" /> Operations console
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Orders" value={String(list.length)} />
        <Stat label="Revenue" value={`₹${revenue.toFixed(0)}`} icon={<IndianRupee className="h-4 w-4" />} />
        <Stat label="Drone drops" value={String(drones)} icon={<Plane className="h-4 w-4" />} />
        <Stat
          label="Bike drops"
          value={String(list.length - drones)}
          icon={<Bike className="h-4 w-4" />}
        />
      </div>

      <h2 className="mt-8 font-display text-2xl font-bold">All orders</h2>
      <Card className="mt-3 overflow-x-auto rounded-3xl border-border/70 p-0 shadow-card">
        {orders.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Items</TableHead>
                <TableHead>Where</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="max-w-[240px] truncate">
                    {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </TableCell>
                  <TableCell>
                    {o.city}
                    {o.state ? `, ${o.state}` : ""}
                  </TableCell>
                  <TableCell className="capitalize">{o.delivery_mode}</TableCell>
                  <TableCell>
                    <Badge className="bg-primary text-primary-foreground">
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">₹{Number(o.total).toFixed(0)}</TableCell>
                  <TableCell className="text-right">
                    {o.status !== "delivered" && o.status !== "cancelled" && (
                      <Button size="sm" variant="ghost" onClick={() => cancel(o.id)}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <h2 className="mt-8 font-display text-2xl font-bold">Kitchens</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(restaurants.data ?? []).map((r) => (
          <Card key={r.id} className="rounded-3xl border-border/70 p-4 shadow-card">
            <p className="font-display font-bold">{r.name}</p>
            <p className="text-xs text-muted-foreground">
              {r.city}, {r.state}
            </p>
            <p className="mt-1 text-xs">
              {r.drone_enabled ? "Drone enabled" : "Bike only"} · ⭐ {r.rating}
            </p>
          </Card>
        ))}
      </div>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card className="rounded-3xl border-border/70 p-5 shadow-card">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="font-display mt-1 text-3xl font-extrabold">{value}</p>
    </Card>
  );
}
