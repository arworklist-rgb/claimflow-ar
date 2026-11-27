"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLAIM_ACTIONS, type Claim, type ClaimAction } from "@/lib/types";

const today = () => new Date().toLocaleDateString("en-CA");

interface ActionPopupDialogProps {
  claim: Claim | null;
  initialAction: ClaimAction | null;
  onClose: () => void;
  onSave: (claim: Claim, action: ClaimAction, actionDate: string, comment: string) => void;
}

export function ActionPopupDialog({ claim, initialAction, onClose, onSave }: ActionPopupDialogProps) {
  const [action, setAction] = useState<ClaimAction>(initialAction ?? "New");
  const [actionDate, setActionDate] = useState(today());
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (claim) {
      setAction(initialAction ?? claim.action);
      setActionDate(today());
      setComment("");
    }
  }, [claim, initialAction]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!claim) return;
    onSave(claim, action, actionDate, comment.trim());
    onClose();
  }

  return (
    <Dialog open={!!claim} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Update Claim Action</DialogTitle>
            <DialogDescription>
              {claim ? `${claim.patientName} · Claim #${claim.claimId}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="action-popup-date">Action Date</Label>
              <Input
                id="action-popup-date"
                type="date"
                required
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="action-popup-comment">Comment / Follow-up Note</Label>
            <Textarea
              id="action-popup-comment"
              rows={3}
              placeholder="Describe what was done or the next follow-up step..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Action</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
