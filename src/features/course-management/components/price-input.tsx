"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { formatCoursePrice } from "@/features/course-management/schema";

export function PriceInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const t = useTranslations("courses");

  return (
    <div className="space-y-2">
      <Label htmlFor="price">{t("price_label")}</Label>
      <Input
        id="price"
        type="text"
        inputMode="decimal"
        aria-invalid={Boolean(error)}
        placeholder="0.00"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const next = e.target.value; if (/^\d*(\.\d{0,2})?$/.test(next)) onChange(next) }}
        onBlur={() => onChange(formatCoursePrice(value))}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
