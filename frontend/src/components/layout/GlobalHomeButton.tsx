import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function GlobalHomeButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToPortals = () => {
    if (location.pathname === "/") {
      document.getElementById("portals")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate("/", { state: { scrollTo: "portals" } });
  };

  return (
    <div className="fixed right-4 top-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60"
            onClick={goToPortals}
            aria-label="Go to landing page"
          >
            <Home className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Home</TooltipContent>
      </Tooltip>
    </div>
  );
}
