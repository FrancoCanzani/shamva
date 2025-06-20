export default function MonitorFormSectionSelector() {
  return (
    <div className="w-48 flex-shrink-0 hidden lg:block">
      <div className="sticky top-4">
        <div className="border border-dashed  p-4">
          <h3 className="font-medium text-sm mb-3 text-muted-foreground">
            Sections
          </h3>
          <nav className="space-y-2">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("basic-config")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="block w-full text-left text-sm hover:font-medium transition-all duration-200 py-1"
            >
              Basic Configuration
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("request-config")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="block w-full text-left text-sm hover:font-medium transition-all duration-200 py-1"
            >
              Request Configuration
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("monitoring-regions")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="block w-full text-left text-sm hover:font-medium transition-all duration-200 py-1"
            >
              Monitoring Regions
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("advanced-options")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="block w-full text-left text-sm hover:font-medium transition-all duration-200 py-1"
            >
              Advanced Options
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("notifications")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="block w-full text-left text-sm hover:font-medium transition-all duration-200 py-1"
            >
              Notifications
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
