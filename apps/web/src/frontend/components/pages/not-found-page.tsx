import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";

export default function NotFoundPage() {
  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center p-6 text-center">
      <h1 className="text-foreground text-4xl font-bold">404</h1>
      <p className="text-muted-foreground mt-4">
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
