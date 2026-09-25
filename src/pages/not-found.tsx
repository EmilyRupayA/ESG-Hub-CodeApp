import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-esg-navy dark:text-foreground">404</p>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Button asChild className="bg-esg-teal hover:bg-esg-teal/90">
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  );
}