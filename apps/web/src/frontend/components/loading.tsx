import { Loader } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader className="animate-spin" />
    </div>
  );
}
