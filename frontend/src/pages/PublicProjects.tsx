import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "@/lib/api";
import { portalConfigs, type PortalKey } from "@/lib/portals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type Project = {
  _id: string;
  title: string;
  purpose: string;
  description: string;
  category: string;
  requiredAmount: number;
  collectedAmount?: number;
  progressPercent?: number;
  receiverDetails?: { city?: string };
  createdAt: string;
};

export default function PublicProjects() {
  const navigate = useNavigate();

  const role = sessionStorage.getItem("impactflow.role") as PortalKey | null;
  const homePath = role ? portalConfigs[role]?.homePath : undefined;

  const projectsQuery = useQuery({
    queryKey: ["public", "projects"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/public/projects");
      return res.projects;
    },
  });

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Approved Projects</h1>
          <p className="text-muted-foreground">Browse verified, admin-approved donation requests</p>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => {
            navigate(homePath ?? "/");
          }}
        >
          Back
        </Button>
      </div>

      {projectsQuery.isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : projectsQuery.isError ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-destructive">Failed to load projects.</p>
          </CardContent>
        </Card>
      ) : (projectsQuery.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">No approved projects yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(projectsQuery.data ?? []).map((p) => {
            const collected = p.collectedAmount ?? 0;
            const pct = p.requiredAmount > 0 ? (collected / p.requiredAmount) * 100 : 0;
            return (
              <Link key={p._id} to={`/projects/${p._id}`}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg leading-tight">{p.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{p.purpose}</CardDescription>
                      </div>
                      <Badge variant="success" className="shrink-0">Approved</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="secondary" className="h-5">{String(p.category).toUpperCase()}</Badge>
                      <span className="text-muted-foreground">{p.receiverDetails?.city ?? ""}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Raised</span>
                        <span className="font-medium">PKR {collected.toLocaleString()} / {p.requiredAmount.toLocaleString()}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
