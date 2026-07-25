"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, FileText, Brain, Upload } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const [profile, setProfile] = useState({
    full_name: "",
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_logo_url: "",
    upi_vpa: "",
    default_currency: "INR",
    default_tax_rate: 18,
  });

  const [settings, setSettings] = useState({
    openai_model: "gpt-4o-mini",
    invoice_prefix: "INV",
    next_invoice_number: 1,
    server_yearly_cost: 13000,
  });

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.user.id)
        .single();

      const { data: settingsData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user.user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name ?? "",
          company_name: profileData.company_name ?? "",
          company_address: profileData.company_address ?? "",
          company_phone: profileData.company_phone ?? "",
          company_email: profileData.company_email ?? "",
          company_logo_url: profileData.company_logo_url ?? "",
          upi_vpa: profileData.upi_vpa ?? "",
          default_currency: profileData.default_currency ?? "INR",
          default_tax_rate: profileData.default_tax_rate ?? 18,
        });
      }

      if (settingsData) {
        setSettings({
          openai_model: settingsData.openai_model ?? "gpt-4o-mini",
          invoice_prefix: settingsData.invoice_prefix ?? "INV",
          next_invoice_number: settingsData.next_invoice_number ?? 1,
          server_yearly_cost: settingsData.server_yearly_cost ?? 13000,
        });
      }

      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, settings }),
    });

    if (res.ok) {
      toast.success("Settings saved!");
    } else {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { url } = await res.json();
      setProfile({ ...profile, company_logo_url: url });
      toast.success("Logo uploaded!");
    } else {
      toast.error("Failed to upload logo");
    }
  }

  if (loading) {
    return <div className="h-96 rounded-lg bg-muted animate-pulse" />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings</p>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>This information appears on your invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Company Email</Label>
              <Input
                type="email"
                value={profile.company_email}
                onChange={(e) => setProfile({ ...profile, company_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Company Phone</Label>
              <Input
                value={profile.company_phone}
                onChange={(e) => setProfile({ ...profile, company_phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Company Address</Label>
            <Input
              value={profile.company_address}
              onChange={(e) => setProfile({ ...profile, company_address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              {profile.company_logo_url && (
                  <img
                    src={profile.company_logo_url ?? ""}
                    alt="Logo"
                  className="h-12 object-contain"
                />
              )}
              <Label className="cursor-pointer">
                <span className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  {profile.company_logo_url ? "Change Logo" : "Upload Logo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>UPI VPA (for payment QR)</Label>
            <Input
              value={profile.upi_vpa}
              onChange={(e) => setProfile({ ...profile, upi_vpa: e.target.value })}
              placeholder="yourname@upi"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select
                value={profile.default_currency}
                onValueChange={(v) => { if (v) setProfile({ ...profile, default_currency: v }); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Tax Rate (%)</Label>
              <Input
                type="number"
                value={profile.default_tax_rate}
                onChange={(e) =>
                  setProfile({ ...profile, default_tax_rate: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input
                value={settings.invoice_prefix}
                onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Settings
          </CardTitle>
          <CardDescription>Configure the OpenAI model used for invoice generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>OpenAI Model</Label>
              <Select
                value={settings.openai_model}
                onValueChange={(v) => { if (v) setSettings({ ...settings, openai_model: v }); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (Best quality)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & cheap)</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Server Yearly Cost (₹)</Label>
              <Input
                type="number"
                value={settings.server_yearly_cost}
                onChange={(e) =>
                  setSettings({ ...settings, server_yearly_cost: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="p-3 rounded-md bg-muted text-sm">
                <p className="font-medium">API Key</p>
                <p className="text-muted-foreground">
                  OpenAI API key is configured via environment variables (OPENAI_API_KEY) and cannot be changed here.
                </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Separator />

      <div className="text-center text-sm text-muted-foreground pb-8">
        <p>InvoDemo v1.0.0 — AI-Powered Invoice Generator</p>
      </div>
    </div>
  );
}
