import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export async function EmptyState({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "courses" });

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">{t("empty")}</p>
        <Button>
          <Plus className="me-2 size-4" />
          {t("empty_action")}
        </Button>
      </CardContent>
    </Card>
  );
}
