export default function NotFoundMessage({ message }: { message: string }) {
  return (
    <div className="border border-dashed p-6 text-center text-sm space-y-2">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
