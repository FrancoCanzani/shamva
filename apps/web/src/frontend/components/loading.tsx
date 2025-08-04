import { Loader } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center">
      <Loader className="animate-spin duration-75" />
    </div>
  );
}
