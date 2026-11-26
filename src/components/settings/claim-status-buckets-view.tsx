"use client";

import { useState } from "react";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLAIM_ACTIONS } from "@/lib/types";

const DEFAULT_BUCKETS = [
  { id: "b-1", label: "0-30 Days", min: 0, max: 30 },
  { id: "b-2", label: "31-60 Days", min: 31, max: 60 },
  { id: "b-3", label: "61-90 Days", min: 61, max: 90 },
  { id: "b-4", label: "91-120 Days", min: 91, max: 120 },
  { id: "b-5", label: "120+ Days", min: 121, max: null },
];

export function ClaimStatusBucketsView() {
  const [statuses, setStatuses] = useState<string[]>([...CLAIM_ACTIONS]);
  const [newStatus, setNewStatus] = useState("");

  function handleAddStatus(e: React.FormEvent) {
    e.preventDefault();
    const val = newStatus.trim();
    if (!val) return;
    setStatuses((prev) => [...prev, val]);
    setNewStatus("");
    toast.success(`Added claim status "${val}"`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claim Status & Buckets"
        description="Configure workflow claim statuses, closing rules, and AR aging bucket thresholds."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="size-4" /> Aging Buckets
            </CardTitle>
            <CardDescription>Thresholds used across Worklist, Dashboard, and Reporting.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket Label</TableHead>
                  <TableHead>Min Days</TableHead>
                  <TableHead>Max Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEFAULT_BUCKETS.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.label}</TableCell>
                    <TableCell>{b.min}</TableCell>
                    <TableCell>{b.max ?? "No limit"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Claim Actions / Statuses</CardTitle>
            <CardDescription>Available actions in the Worklist and lifecycle transition rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddStatus} className="flex gap-2">
              <Input
                placeholder="New status label..."
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              />
              <Button type="submit"><Plus className="size-4" /> Add</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <Badge key={s} variant={s === "Paid and closed" ? "default" : "secondary"}>
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
