import { GraduationCap } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

type AuthShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export async function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  const t = await getTranslations("common")
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-2/4">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-xl bg-primary-tint text-primary"
          >
            <GraduationCap className="size-6" />
          </div>
          <div>
            <h1 className="text-title-lg text-title-lg--line-height font-semibold text-foreground">
              {t("brand")}
            </h1>
            <p className="text-label-sm text-label-sm--line-height text-on-surface-muted">
              {t("brand_subtitle")}
            </p>
          </div>
        </div>

        <Card className="p-6">
          <CardHeader className="mb-5 space-y-1">
            <h2 className="text-title-md text-title-md--line-height font-semibold text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="text-body-md text-body-md--line-height text-on-surface-muted">
                {subtitle}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>

        {footer && <div className="mt-4 text-center">{footer}</div>}
      </div>
    </div>
  )
}
