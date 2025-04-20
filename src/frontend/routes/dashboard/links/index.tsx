import { Button } from "@/frontend/components/ui/button";
import { fetchLinks } from "@/frontend/lib/loaders/links";
import { Link as LinkType } from "@/frontend/lib/types";
import { copyToClipboard, formatLinkDate } from "@/frontend/lib/utils";
import { CopyIcon } from "@radix-ui/react-icons";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/links/")({
  loader: ({ abortController }) => fetchLinks({ abortController }),
  pendingComponent: LoadingLinksComponent,
  errorComponent: ErrorLoadingLinksComponent,
  component: LinksComponent,
});

function LoadingLinksComponent() {
  return <div>Loading your links...</div>;
}

function ErrorLoadingLinksComponent({ error }: { error: Error }) {
  return (
    <div className="p-4 text-red-600 border border-red-400 rounded bg-red-50">
      <h2>Error Loading Links</h2>
      <p>{error.message || "An unexpected error occurred."}</p>
    </div>
  );
}

function LinksComponent() {
  const links = Route.useLoaderData();

  return (
    <div className="p-4">
      <h1 className="text-xl font-medium mb-4">Links</h1>
      {links.length === 0 ? (
        <p className="text-muted-foreground">
          You haven't created any links yet.
        </p>
      ) : (
        <ul className="divide-y divide-orange-400">
          {links.map((link: LinkType) => (
            <li key={link.id}>
              <Link
                to="/dashboard/links/$slug"
                params={{ slug: link.slug }}
                className="flex justify-between items-center gap-4 rounded hover:bg-muted p-3 transition-colors duration-150 group"
              >
                <div>
                  <div className="flex items-center justify-start space-x-1.5">
                    <span className="font-medium block truncate text-sm">{`${import.meta.env.VITE_BASE_URL}/${link.slug}`}</span>
                    <Button
                      size={"sm"}
                      variant={"ghost"}
                      className="size-3"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await copyToClipboard(
                            `${import.meta.env.VITE_BASE_URL}/${link.slug}`,
                          );
                          toast.success(
                            `${import.meta.env.VITE_BASE_URL}/${link.slug} copied to clipboard`,
                          );
                        } catch {
                          toast.error("Copy to clipboard failed");
                        }
                      }}
                    >
                      <CopyIcon className="size-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-start space-x-1.5 text-xs">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium block truncate"
                    >
                      {link.url}
                    </a>

                    <time
                      dateTime={link.created_at}
                      className="hidden sm:inline"
                      title={format(parseISO(link.created_at), "PPPPp")}
                    >
                      {formatLinkDate(link.created_at)}
                    </time>
                  </div>
                </div>
                <div>
                  <span className="text-xs p-1 hover:bg-accent rounded ml-1">
                    {link.click_count} clicks
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
