"use client";

import { useState } from "react";
import { Landmark, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CompanyProfileView() {
  const [name, setName] = useState("ClaimFlow Medical Billing Group");
  const [taxId, setTaxId] = useState("84-1920411");
  const [npi, setNpi] = useState("1928374650");
  const [address, setAddress] = useState("400 Medical Center Pkwy, Suite 300, Austin, TX 78701");
  const [retentionDays, setRetentionDays] = useState("2555");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Organization profile updated");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Profile"
        description="Manage your organization's legal billing details and HIPAA document retention policy."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="size-4" /> Organization Details
          </CardTitle>
          <CardDescription>Scoped to your organization tenant in PostgreSQL.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-tax">Tax ID (EIN)</Label>
              <Input id="org-tax" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-npi">Group NPI</Label>
              <Input id="org-npi" value={npi} onChange={(e) => setNpi(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="org-addr">Billing Address</Label>
              <Input id="org-addr" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-ret">Document Retention (Days)</Label>
              <Input id="org-ret" type="number" min={30} value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit"><Save className="size-4" /> Save Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
