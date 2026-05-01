import { Input } from "./Input";

export function FormField({ label, id, error, hint, inputProps = {}, children }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children || <Input id={id} aria-describedby={errorId} error={error} {...inputProps} />}
      {hint && !error ? <span className="muted" style={{ fontSize: "var(--text-sm)" }}>{hint}</span> : null}
      {error ? (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
