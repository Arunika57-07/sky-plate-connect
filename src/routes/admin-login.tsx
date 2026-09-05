import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin login — buggy" },
      {
        name: "description",
        content: "buggy operations team login for orders, kitchens and delivery partners.",
      },
      { property: "og:title", content: "Admin login — buggy" },
      { property: "og:description", content: "Operations control room for buggy deliveries." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
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
      <h1 className="font-display flex items-center gap-2 text-3xl font-extrabold">
        <ShieldCheck className="h-7 w-7 text-primary" /> Admin console
      </h1>
      <p className="mt-1 text-muted-foreground">
        Not staff?{" "}
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
              Register staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-5 space-y-4">
            <Row label="Work email" type="email" value={form.email} onChange={(v) => set("email", v)} />
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
              Enter console
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-5 space-y-4">
            <p className="rounded-2xl bg-accent p-3 text-sm text-accent-foreground">
              Admin rights are granted only to work emails ending in{" "}
              <strong>@buggy.admin</strong> — for example ops@buggy.admin.
            </p>
            <Row label="Full name" value={form.full_name} onChange={(v) => set("full_name", v)} />
            <Row
              label="Work email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="ops@buggy.admin"
            />
            <Row label="Contact number" value={form.phone} onChange={(v) => set("phone", v)} />
            <Row label="Office address" value={form.address} onChange={(v) => set("address", v)} />
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
                if (!form.email.endsWith("@buggy.admin")) {
                  toast.error("Admin registration needs a @buggy.admin email");
                  return;
                }
                setBusy(true);
                const { error } = await supabase.auth.signUp({
                  email: form.email,
                  password: form.password,
                  options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                      role: "admin",
                      full_name: form.full_name,
                      phone: form.phone,
                      address: form.address,
                    },
                  },
                });
                setBusy(false);
                if (error) toast.error(error.message);
                else toast.success("Admin account created.");
              }}
            >
              Create admin account
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
