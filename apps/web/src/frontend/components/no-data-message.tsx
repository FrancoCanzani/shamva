import { Button } from "@/frontend/components/ui/button";
import { Link, useParams } from "@tanstack/react-router";

interface NoDataMessageProps {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    to: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export default function NoDataMessage({
  title,
  description,
  primaryAction,
  secondaryAction,
}: NoDataMessageProps) {
  const { workspaceSlug } = useParams({ strict: false });

  return (
    <div className="mx-auto flex h-full max-w-sm items-center justify-center">
      <div className="space-y-4">
        <h2 className="font-medium">{title}</h2>
        <p className="text-muted-foreground text-sm text-balance">
          {description}
        </p>
        <div className="space-x-2">
          {secondaryAction && (
            <Button asChild size="xs">
              <a
                href={secondaryAction.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {secondaryAction.label}
              </a>
            </Button>
          )}
          <Button asChild size="xs" variant={"outline"}>
            <Link to={primaryAction.to} params={{ workspaceSlug }}>
              {primaryAction.label}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
