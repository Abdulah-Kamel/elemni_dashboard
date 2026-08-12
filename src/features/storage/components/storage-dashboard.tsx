"use client";

import { useTranslations } from "next-intl";
import { StorageGauge } from "@/features/storage/components/storage-gauge";
import { BandwidthChart } from "@/features/storage/components/bandwidth-chart";
import { StorageTable } from "@/features/storage/components/storage-table";
import { UploadFAB } from "@/features/storage/components/upload-fab";

export function StorageDashboard() {
  const t = useTranslations("storage");
  return (
    <div className="flex flex-col gap-xl">
      <header>
        <h1 className="text-headline-md text-headline-md--line-height font-semibold text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-body-md text-body-md--line-height text-on-surface-muted">
          {t("subtitle")}
        </p>
      </header>
      <div className="grid grid-cols-1 gap-md lg:grid-cols-12">
        <div className="lg:col-span-4">
          <StorageGauge />
        </div>
        <div className="lg:col-span-8">
          <BandwidthChart />
        </div>
      </div>
      <StorageTable />
      <UploadFAB />
    </div>
  );
}
