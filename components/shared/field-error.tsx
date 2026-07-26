interface FieldErrorProps {
  id: string;
  message?: string;
}

/** Pairs with an input's `aria-describedby={id}` so screen readers announce the error
 *  alongside the field (SRS 20: "Error messages are associated with their input fields"). */
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-status-red">
      {message}
    </p>
  );
}
