import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  error?: boolean;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField(
    { id, label, type = "text", name, defaultValue, required, autoComplete, placeholder, error, hint, inputMode },
    ref,
  ) {
    return (
      <div className="space-y-1.5">
        <Label
          htmlFor={id}
          className="block text-label-md text-label-md--line-height font-medium text-foreground"
        >
          {label}
        </Label>
        <Input
          ref={ref}
          id={id}
          type={type}
          name={name}
          defaultValue={defaultValue}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={error || undefined}
          className={cn(
            "h-10 w-full rounded-lg border bg-surface px-3 text-body-md text-body-md--line-height text-foreground placeholder:text-on-surface-muted transition-colors focus:outline-none focus:ring-3",
            error
              ? "border-error focus:border-error focus:ring-error/20"
              : "border-border focus:border-primary focus:ring-primary/20",
          )}
        />
        {hint && (
          <p className="text-label-sm text-label-sm--line-height text-on-surface-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
