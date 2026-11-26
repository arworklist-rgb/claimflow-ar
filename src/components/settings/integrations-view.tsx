"use client";

import { Plug } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const INTEGRATIONS = [
  { name: "Clearinghouse (EDI 837 / 835 / 277)", desc: "Automated claim submission, electronic remittance (ERA), and claim status checks.", status: "Requires BAA & SFTP/API Keys" },
  { name: "EHR / Practice Management Sync", desc: "Import patient demographics, encounters, and charge batches directly from PM systems.", status: "Pending Vendor Credentials" },
  { name: "Cloudinary Authenticated Storage", desc: "Encrypted raw document and import spreadsheet storage with signed URL delivery.", status: "Configured in Phase 0" },
  { name: "Email Provider (SES / Postmark)", desc: "Transactional emails for user invitations, password resets, and overdue follow-ups.", status: "Pending SMTP / API Key" },
];

export function IntegrationsView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect clearinghouses, EHR/PM systems, and notification providers. External healthcare connectors require vendor credentials and BAAs."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((item) => (
          <Card key={item.name}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plug className="size-4" /> {item.name}
                </CardTitle>
                <Badge variant={item.status.includes("Configured") ? "default" : "secondary"}>
                  {item.status}
                </Badge>
              </div>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" disabled>
                Configure Credentials (Admin)
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
