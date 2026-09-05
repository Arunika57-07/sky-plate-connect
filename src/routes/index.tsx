import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bike, Plane, Star, Timer, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "buggy — drone & bike food delivery across India" },
      {
        name: "description",
        content:
          "Order Tamil Nadu, Hyderabadi, Maharashtrian, Kerala, Punjabi, Bengali and Gujarati favourites. Drone delivery for premium members, bike delivery for everyone.",
      },
      { property: "og:title", content: "buggy — drone & bike food delivery across India" },
      {
        property: "og:description",
        content: "Regional Indian food delivered by drone or bike, in minutes.",
      },
    ],
  }),
  component: Home,
});

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  city: string;
  state: string;
  rating: number;
  eta_minutes: number;
  drone_enabled: boolean;
  image_url: string;
};

function Home() {
  const [state, setState] = useState<string>("All");

  const { data, isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data as Restaurant[];
    },
  });

  const states = ["All", ...Array.from(new Set((data ?? []).map((r) => r.state)))];
  const list = (data ?? []).filter((r) => state === "All" || r.state === state);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <Badge className="bg-success text-success-foreground">Now flying in 8 states</Badge>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">
              Hot food, <span className="text-gradient-hot">flown or ridden</span> to your door.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Premium members get 12-minute drone drops. Everyone else gets our lightning bike
              riders. Tap anywhere and watch the drone follow you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Start ordering</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/partner-login">Deliver with buggy</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-primary" /> Drone · premium
              </span>
              <span className="flex items-center gap-2">
                <Bike className="h-4 w-4 text-success" /> Bike · everyone
              </span>
            </div>
          </div>
          <div className="relative">
            <img
              src="/images/hero-drone.jpg"
              alt="Delivery drone carrying a food bag over an Indian street with a bike rider below"
              width={1536}
              height={1024}
              className="w-full rounded-3xl shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Kitchens near you</h2>
          <div className="flex flex-wrap gap-2">
            {states.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === state ? "default" : "outline"}
                onClick={() => setState(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-3xl" />
            ))}

          {list.map((r) => (
            <Link key={r.id} to="/restaurant/$id" params={{ id: r.id }}>
              <Card className="overflow-hidden rounded-3xl border-border/70 p-0 shadow-card transition-transform hover:-translate-y-1">
                <img
                  src={r.image_url}
                  alt={r.name}
                  loading="lazy"
                  width={768}
                  height={768}
                  className="h-44 w-full object-cover"
                />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-bold">{r.name}</h3>
                    <Badge className="bg-success text-success-foreground">
                      <Star className="mr-1 h-3 w-3" />
                      {r.rating}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.cuisine}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {r.city}, {r.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {r.eta_minutes} min
                    </span>
                    {r.drone_enabled && (
                      <span className="flex items-center gap-1 text-primary">
                        <Plane className="h-3 w-3" /> Drone ready
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border/70 bg-accent/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
          {[
            {
              title: "Customer",
              body: "Sign up with your name, email, phone and delivery address, then track every order.",
              to: "/auth" as const,
              cta: "Customer login",
            },
            {
              title: "Delivery partner",
              body: "Riders and drone pilots accept live orders and mark them delivered.",
              to: "/partner-login" as const,
              cta: "Partner login",
            },
            {
              title: "Admin",
              body: "Watch every order across states, switch delivery mode and manage premium members.",
              to: "/admin-login" as const,
              cta: "Admin login",
            },
          ].map((c) => (
            <Card key={c.title} className="rounded-3xl border-border/70 p-6 shadow-card">
              <h3 className="font-display text-xl font-bold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              <Button asChild className="mt-4" variant="secondary">
                <Link to={c.to}>{c.cta}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
