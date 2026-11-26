"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

interface PaymentRow {
  id: string;
  patient_name: string;
  service_date: string;
  payment_date: string;
  amount: number;
  match_status: string;
  transaction_by?: string;
}

export default function ReconciliationPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  useEffect(() => {
    fetch("/api/v1/payments")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok && Array.isArray(j.data)) setPayments(j.data);
      })
      .catch(() => {});
  }, []);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Payment Reconciliation"
        description="Review matched, partial, duplicate, and unmatched payment remittances against worklist claims."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-4" /> Payment Queue
          </CardTitle>
          <CardDescription>Backed by PostgreSQL `payments` and `payment_claim_matches`.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Match Status</TableHead>
                <TableHead>Transaction By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-8 text-center text-sm">
                    No payment records found yet. Upload a Paid Claims file on /upload-claims to populate reconciliation.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.patient_name}</TableCell>
                    <TableCell>{p.service_date}</TableCell>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                    <TableCell><Badge variant="outline">{p.match_status}</Badge></TableCell>
                    <TableCell>{p.transaction_by ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
