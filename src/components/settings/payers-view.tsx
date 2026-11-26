"use client";

import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PayerRow {
  id: string;
  code: string;
  name: string;
  ediId: string;
  timelyDays: number;
  appealDays: number;
  status: "Active" | "Inactive";
}

const INITIAL_PAYERS: PayerRow[] = [
  { id: "p-1", code: "UHC", name: "UnitedHealthcare", ediId: "87726", timelyDays: 90, appealDays: 60, status: "Active" },
  { id: "p-2", code: "BCBS", name: "Blue Cross Blue Shield", ediId: "00590", timelyDays: 180, appealDays: 90, status: "Active" },
  { id: "p-3", code: "AETNA", name: "Aetna", ediId: "60054", timelyDays: 90, appealDays: 60, status: "Active" },
  { id: "p-4", code: "CIGNA", name: "Cigna Healthcare", ediId: "62308", timelyDays: 90, appealDays: 60, status: "Active" },
  { id: "p-5", code: "MED", name: "Medicare Part B", ediId: "00882", timelyDays: 365, appealDays: 120, status: "Active" },
];

export function PayersView() {
  const [payers, setPayers] = useState<PayerRow[]>(INITIAL_PAYERS);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [ediId, setEdiId] = useState("");
  const [timelyDays, setTimelyDays] = useState("90");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setPayers((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        ediId: ediId.trim() || "—",
        timelyDays: Number(timelyDays) || 90,
        appealDays: 60,
        status: "Active",
      },
    ]);
    toast.success(`Added payer ${name}`);
    setName("");
    setCode("");
    setEdiId("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payers"
        description="Maintain the payer directory, EDI Payer IDs, timely filing limits, and appeal deadlines."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" /> Add Payer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-5 sm:items-end">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="payer-name">Payer Name</Label>
              <Input id="payer-name" required placeholder="Humana" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payer-code">Short Code</Label>
              <Input id="payer-code" required placeholder="HUM" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payer-edi">EDI Payer ID</Label>
              <Input id="payer-edi" placeholder="61101" value={ediId} onChange={(e) => setEdiId(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Input type="number" min={1} value={timelyDays} onChange={(e) => setTimelyDays(e.target.value)} aria-label="Timely filing days" />
              <Button type="submit"><Plus className="size-4" /> Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Payer Name</TableHead>
                <TableHead>EDI Payer ID</TableHead>
                <TableHead>Timely Filing</TableHead>
                <TableHead>Appeal Limit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono font-semibold">{p.code}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-sm">{p.ediId}</TableCell>
                  <TableCell>{p.timelyDays} days</TableCell>
                  <TableCell>{p.appealDays} days</TableCell>
                  <TableCell><Badge>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
