"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/use-auth";
import { uid, useDemoStore } from "@/lib/store/demo-store";
import { CLAIM_ACTIONS, type ClaimAction } from "@/lib/types";

export function AddClaimDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { userId } = useAuth();
  const practices = useDemoStore((s) => s.practices);
  const importNewClaims = useDemoStore((s) => s.importNewClaims);

  const [practiceId, setPracticeId] = useState(practices[0]?.id ?? "");
  const [claimId, setClaimId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [dos, setDos] = useState(new Date().toISOString().slice(0, 10));
  const [billedAmount, setBilledAmount] = useState("");
  const [responsible, setResponsible] = useState("Insurance");
  const [action, setAction] = useState<ClaimAction>("New");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const practice = practices.find((p) => p.id === practiceId) ?? practices[0];
    if (!practice || !claimId.trim() || !patientName.trim()) {
      toast.error("Practice, Claim No, and Patient Name are required.");
      return;
    }

    const amount = Number(billedAmount) || 0;
    const nowIso = new Date().toISOString();
    const newId = uid("clm");

    importNewClaims(
      [
        {
          id: newId,
          claimId: claimId.trim(),
          patientName: patientName.trim(),
          claimDate: dos,
          dos,
          billedDate: dos,
          responsible,
          provider: "Manual Entry",
          cpt: "99213",
          billedAmount: amount,
          balance: amount,
          denialCodes: [],
          practiceId: practice.id,
          practiceName: practice.name,
          action,
        },
      ],
      {
        id: uid("up"),
        fileName: "Manual Entry",
        type: "New",
        practiceName: practice.name,
        rows: 1,
        uploadedBy: userId,
        uploadedAt: nowIso,
        status: "Completed",
      },
      userId,
    );

    toast.success(`Added claim ${claimId.trim()}`);
    setClaimId("");
    setPatientName("");
    setBilledAmount("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Claim to Worklist</DialogTitle>
            <DialogDescription>Create a single claim directly or use dropdowns to classify it.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Practice</Label>
            <Select value={practiceId} onValueChange={setPracticeId}>
              <SelectTrigger><SelectValue placeholder="Select practice" /></SelectTrigger>
              <SelectContent>
                {practices.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="add-claim-no">Claim No *</Label>
              <Input id="add-claim-no" required placeholder="CLM-10099" value={claimId} onChange={(e) => setClaimId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-dos">Service Date</Label>
              <Input id="add-dos" type="date" value={dos} onChange={(e) => setDos(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-patient">Patient Name *</Label>
            <Input id="add-patient" required placeholder="Doe, Jane" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="add-billed">Billed ($)</Label>
              <Input id="add-billed" type="number" min="0" step="0.01" placeholder="250.00" value={billedAmount} onChange={(e) => setBilledAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Responsible</Label>
              <Select value={responsible} onValueChange={setResponsible}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Patient">Patient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={action} onValueChange={(v) => setAction(v as ClaimAction)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLAIM_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add Claim</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
