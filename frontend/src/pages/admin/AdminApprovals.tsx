import AdminReceiverApprovals from "./AdminReceiverApprovals";
import AdminDonationApprovals from "./AdminDonationApprovals";
import AdminProgressApprovals from "./AdminProgressApprovals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import adminIllustration from "@/assets/admin-illustration.png";

export default function AdminApprovals() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-white/50 shadow-[var(--shadow-elevated)] backdrop-blur-md">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 bg-[length:200%_200%] animate-gradient"
        />
        <div aria-hidden className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              Admin Workflow
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Approvals</h1>
            <p className="text-muted-foreground">Review receiver requests, donation proofs, and field progress submissions</p>
          </div>

          <img
            src={adminIllustration}
            alt="Approvals"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-white/60 p-4 shadow-[var(--shadow-card)] backdrop-blur-md">
        <Tabs defaultValue="receiver" className="space-y-4">
          <TabsList className="bg-white/60 backdrop-blur">
            <TabsTrigger value="receiver">Receiver Requests</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="progress">Progress Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="receiver">
            <AdminReceiverApprovals />
          </TabsContent>
          <TabsContent value="donations">
            <AdminDonationApprovals />
          </TabsContent>
          <TabsContent value="progress">
            <AdminProgressApprovals />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
