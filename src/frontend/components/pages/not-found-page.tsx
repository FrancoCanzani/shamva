import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="mt-4 text-muted-foreground">
        Oops! The page you’re looking for doesn’t exist.
      </p>
      <div className="mt-6">
        <Button asChild variant="outline" size={"sm"} className="gap-2">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
