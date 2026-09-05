import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Customer login & sign up — buggy" },
      {
        name: "description",
        content: "Create your buggy account with name, email, phone and delivery address.",
      },
      { property: "og:title", content: "Customer login & sign up — buggy" },
      { property: "og:description", content: "Log in to order food by drone or bike." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
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
  });

  useEffect(() => {
    if (!user) return;
    navigate({
      to: role === "admin" ? "/admin" : role === "delivery" ? "/partner" : "/orders",
      replace: true,
    });
  }, [user, role, navigate]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back to buggy!");
  };

  const signUp = async () => {
    if (!form.full_name || !form.phone || !form.address) {
      toast.error("Name, phone number and address are required");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          role: "customer",
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
        },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created — you're signed in.");
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Google sign-in failed. Please try email instead.");
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Customer account</h1>
      <p className="mt-1 text-muted-foreground">
        Delivery partner?{" "}
        <Link to="/partner-login" className="text-primary underline">
          Partner login
        </Link>{" "}
        · Admin?{" "}
        <Link to="/admin-login" className="text-primary underline">
          Admin login
        </Link>
      </p>

      <Card className="mt-6 rounded-3xl border-border/70 p-6 shadow-card">
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Log in
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Sign up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-5 space-y-4">
            <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => set("password", v)}
            />
            <Button className="w-full" disabled={busy} onClick={signIn}>
              Log in
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-5 space-y-4">
            <Field label="Full name" value={form.full_name} onChange={(v) => set("full_name", v)} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
            <Field
              label="Contact number"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              placeholder="+91 98xxx xxxxx"
            />
            <Field
              label="Delivery address"
              value={form.address}
              onChange={(v) => set("address", v)}
              placeholder="Flat, street, landmark"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
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
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => set("password", v)}
            />
            <Button className="w-full" disabled={busy} onClick={signUp}>
              Create account
            </Button>
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full" onClick={google}>
          Continue with Google
        </Button>
      </Card>
    </main>
  );
}

function Field({
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
