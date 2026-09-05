import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/states";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/partner-login")({
  head: () => ({
    meta: [
      { title: "Delivery partner login — buggy" },
      {
        name: "description",
        content: "Riders and drone pilots log in to accept and complete buggy deliveries.",
      },
      { property: "og:title", content: "Delivery partner login — buggy" },
      { property: "og:description", content: "Accept live orders and deliver by bike or drone." },
    ],
  }),
  component: PartnerLogin,
});

function PartnerLogin() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    vehicle_number: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (user && role) {
      navigate({
        to: role === "admin" ? "/admin" : role === "delivery" ? "/partner" : "/orders",
        replace: true,
      });
    }
  }, [user, role, navigate]);

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Delivery partner</h1>
      <p className="mt-1 text-muted-foreground">
        Customer?{" "}
        <Link to="/auth" className="text-primary underline">
          Customer login
        </Link>
      </p>

      <Card className="mt-6 rounded-3xl border-border/70 p-6 shadow-card">
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Log in
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Join as partner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-5 space-y-4">
            <Row label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
            <Row
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => set("password", v)}
            />
            <Button
              className="w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const { error } = await supabase.auth.signInWithPassword({
                  email: form.email,
                  password: form.password,
                });
                setBusy(false);
                if (error) toast.error(error.message);
              }}
            >
              Log in
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-5 space-y-4">
            <Row label="Full name" value={form.full_name} onChange={(v) => set("full_name", v)} />
            <Row label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
            <Row label="Contact number" value={form.phone} onChange={(v) => set("phone", v)} />
            <Row label="Home address" value={form.address} onChange={(v) => set("address", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Row label="City" value={form.city} onChange={(v) => set("city", v)} />
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={form.state} onValueChange={(v) => set("state", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Row
              label="Vehicle / drone number"
              value={form.vehicle_number}
              onChange={(v) => set("vehicle_number", v)}
              placeholder="TN 09 BX 4521"
            />
            <Row
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => set("password", v)}
            />
            <Button
              className="w-full"
              disabled={busy}
              onClick={async () => {
                if (!form.full_name || !form.phone || !form.vehicle_number) {
                  toast.error("Name, contact number and vehicle number are required");
                  return;
                }
                setBusy(true);
                const { error } = await supabase.auth.signUp({
                  email: form.email,
                  password: form.password,
                  options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                      role: "delivery",
                      full_name: form.full_name,
                      phone: form.phone,
                      address: form.address,
                      city: form.city,
                      state: form.state,
                      vehicle_number: form.vehicle_number,
                    },
                  },
                });
                setBusy(false);
                if (error) toast.error(error.message);
                else toast.success("Partner account created.");
              }}
            >
              Create partner account
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}

function Row({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
