import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Leaf, Drumstick, Star, Plane, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/restaurant/$id")({
  head: () => ({
    meta: [
      { title: "Menu — buggy" },
      { name: "description", content: "Browse the menu and add dishes to your buggy cart." },
      { property: "og:title", content: "Menu — buggy" },
      { property: "og:description", content: "Regional Indian dishes, delivered by drone or bike." },
    ],
  }),
  component: RestaurantPage,
});

function RestaurantPage() {
  const { id } = Route.useParams();
  const { add } = useCart();

  const { data, isLoading } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const [{ data: r, error: e1 }, { data: items, error: e2 }] = await Promise.all([
        supabase.from("restaurants").select("*").eq("id", id).maybeSingle(),
        supabase.from("menu_items").select("*").eq("restaurant_id", id).order("price"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { restaurant: r, items: items ?? [] };
    },
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
      </main>
    );
  }

  const r = data?.restaurant;
  if (!r) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Kitchen not found</h1>
        <Button asChild className="mt-4">
          <Link to="/">Back to restaurants</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl shadow-card">
        <img
          src={r.image_url}
          alt={r.name}
          width={768}
          height={768}
          className="h-56 w-full object-cover"
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold">{r.name}</h1>
        <Badge className="bg-success text-success-foreground">
          <Star className="mr-1 h-3 w-3" />
          {r.rating}
        </Badge>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" /> {r.eta_minutes} min
        </span>
        {r.drone_enabled && (
          <span className="flex items-center gap-1 text-sm text-primary">
            <Plane className="h-4 w-4" /> Drone delivery for premium
          </span>
        )}
      </div>
      <p className="mt-1 text-muted-foreground">
        {r.cuisine} · {r.city}, {r.state}
      </p>

      <h2 className="mt-8 font-display text-2xl font-bold">Menu</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {data?.items.map((item) => (
          <Card
            key={item.id}
            className="flex flex-row items-center gap-4 rounded-3xl border-border/70 p-4 shadow-card"
          >
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              width={768}
              height={768}
              className="h-24 w-24 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {item.is_veg ? (
                  <Leaf className="h-4 w-4 text-success" />
                ) : (
                  <Drumstick className="h-4 w-4 text-spice" />
                )}
                <h3 className="font-display truncate text-lg font-bold">{item.name}</h3>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-semibold">₹{Number(item.price).toFixed(0)}</span>
                <Button
                  size="sm"
                  onClick={() => {
                    add({
                      id: item.id,
                      name: item.name,
                      price: Number(item.price),
                      image_url: item.image_url,
                      restaurant_id: r.id,
                      restaurant_name: r.name,
                    });
                    toast.success(`${item.name} added to cart`);
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
