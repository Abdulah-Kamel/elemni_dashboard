"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PriceInput } from "./price-input"
import { CurriculumPicker } from "./curriculum-picker"
import type {
  SubjectOut,
  GradeOut,
  StreamOut,
} from "@/features/course-management/schema"
import type { CourseFormValues } from "@/features/course-management/schema"

const emptyForm: CourseFormValues = {
  title: "",
  description: "",
  price: "0.00",
  subjectId: null as unknown as number,
  gradeId: null as unknown as number,
  streamId: null as unknown as number,
  useChapters: false,
  isPublished: false,
}

export function CourseForm({
  initialValues,
  subjects,
  grades,
  streams,
  onChange,
  errors,
  disabled,
  mode,
}: {
  initialValues?: Partial<CourseFormValues>
  subjects: SubjectOut[]
  grades: GradeOut[]
  streams: StreamOut[]
  onChange: (values: CourseFormValues) => void
  errors?: Record<string, string>
  disabled?: boolean
  mode: "create" | "edit"
}) {
  const t = useTranslations("courses")
  const [values, setValues] = useState<CourseFormValues>({
    ...emptyForm,
    ...initialValues,
  })

  function update(partial: Partial<CourseFormValues>) {
    const next = { ...values, ...partial }
    setValues(next)
    onChange(next)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">{t("title_label")}</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            update({ title: e.target.value })
          }
          disabled={disabled}
        />
        {errors?.title && (
          <p className="text-xs text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description_label")}</Label>
        <Input
          id="description"
          value={values.description ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            update({ description: e.target.value || null })
          }
          disabled={disabled}
        />
        {errors?.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>

      <PriceInput
        value={values.price}
        onChange={(price) => update({ price })}
        error={errors?.price}
      />

      {mode === "create" ? (
        <CurriculumPicker
          subjects={subjects}
          grades={grades}
          streams={streams}
          subjectId={values.subjectId}
          gradeId={values.gradeId}
          streamId={values.streamId}
          onSubjectChange={(id) => update({ subjectId: id ?? undefined! })}
          onGradeChange={(id) => update({ gradeId: id ?? undefined! })}
          onStreamChange={(id) => update({ streamId: id ?? undefined! })}
          errors={{
            subjectId: errors?.subjectId,
            gradeId: errors?.gradeId,
            streamId: errors?.streamId,
          }}
          disabled={disabled}
        />
      ) : (
        <div className="space-y-2">
          <Label>{t("curriculum_placement")}</Label>
          <p className="text-sm text-muted-foreground">
            {values.subjectId
              ? (subjects.find((s) => s.id === values.subjectId)?.name ??
                String(values.subjectId))
              : "—"}
            {" / "}
            {values.gradeId
              ? (grades.find((g) => g.id === values.gradeId)?.name ??
                String(values.gradeId))
              : "—"}
            {" / "}
            {values.streamId
              ? (streams.find((s) => s.id === values.streamId)?.name ??
                String(values.streamId))
              : "—"}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("chapters_organized")}</Label>
        <RadioGroup
          value={values.useChapters ? "chapters" : "flat"}
          onValueChange={(v) => update({ useChapters: v === "chapters" })}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="flat" id="flat" />
            <Label htmlFor="flat">{t("flat_lessons")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="chapters" id="chapters" />
            <Label htmlFor="chapters">{t("chapters_organized")}</Label>
          </div>
        </RadioGroup>
      </div>

      {mode === "edit" && (
        <div className="space-y-2">
          <Label>{t("published_status")}</Label>
          <RadioGroup
            value={values.isPublished ? "published" : "draft"}
            onValueChange={(v) => update({ isPublished: v === "published" })}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="draft" id="draft" />
              <Label htmlFor="draft">{t("draft")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="published" id="published" />
              <Label htmlFor="published">{t("published")}</Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  )
}
