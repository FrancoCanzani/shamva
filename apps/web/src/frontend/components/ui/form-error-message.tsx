export const ErrorMessage = ({ errors }: { errors?: string }) =>
  errors ? <p className="text-destructive text-sm">{errors}</p> : null;
