"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
  SelectGroup,
} from "@/components/ui/select";
import type { SubjectOut, GradeOut, StreamOut } from "@/features/course-management/schema";

export function CurriculumPicker({
  subjects,
  grades,
  streams,
  subjectId,
  gradeId,
  streamId,
  onSubjectChange,
  onGradeChange,
  onStreamChange,
  errors,
  disabled,
}: {
  subjects: SubjectOut[];
  grades: GradeOut[];
  streams: StreamOut[];
  subjectId: number | null;
  gradeId: number | null;
  streamId: number | null;
  onSubjectChange: (id: number | null) => void;
  onGradeChange: (id: number | null) => void;
  onStreamChange: (id: number | null) => void;
  errors?: { subjectId?: string; gradeId?: string; streamId?: string };
  disabled?: boolean;
}) {
  const t = useTranslations("courses");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("subject_label")}</Label>
        <Select
          value={String(subjectId ?? "")}
          onValueChange={(v) => onSubjectChange(v ? Number(v) : null)}
          items={subjects.map((s) => ({ value: String(s.id), label: s.name }))}
        >
          <SelectTrigger disabled={disabled || subjects.length === 0} className="w-full">
            <SelectValue placeholder={subjects.length === 0 ? t("loading_curriculum") : t("subject_label")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors?.subjectId && <p className="text-xs text-destructive">{errors.subjectId}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t("grade_label")}</Label>
        <Select
          value={String(gradeId ?? "")}
          onValueChange={(v) => onGradeChange(v ? Number(v) : null)}
          items={grades.map((g) => ({ value: String(g.id), label: g.name }))}
        >
          <SelectTrigger disabled={disabled || grades.length === 0} className="w-full">
            <SelectValue placeholder={grades.length === 0 ? t("loading_curriculum") : t("grade_label")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {grades.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors?.gradeId && <p className="text-xs text-destructive">{errors.gradeId}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t("stream_label")}</Label>
        <Select
          value={String(streamId ?? "")}
          onValueChange={(v) => onStreamChange(v ? Number(v) : null)}
          items={streams.map((s) => ({ value: String(s.id), label: s.name }))}
        >
          <SelectTrigger disabled={disabled || streams.length === 0} className="w-full">
            <SelectValue placeholder={streams.length === 0 ? t("loading_curriculum") : t("stream_label")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {streams.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors?.streamId && <p className="text-xs text-destructive">{errors.streamId}</p>}
      </div>
    </div>
  );
}
