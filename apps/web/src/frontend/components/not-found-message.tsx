export default function NotFoundMessage({ message }: { message: string }) {
  return (
    <div className="space-y-2 rounded-md border border-dashed p-6 text-center text-sm">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
