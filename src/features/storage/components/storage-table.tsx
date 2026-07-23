"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen } from "lucide-react";

interface CourseStorageRow {
  id: number;
  name: string;
  videos: number;
  storageSize: string;
  bandwidth: string;
  status: "published" | "draft";
}

const MOCK_COURSES: CourseStorageRow[] = [
  { id: 1, name: "Algebra I", videos: 24, storageSize: "156.2 GB", bandwidth: "2.1 TB", status: "published" },
  { id: 2, name: "Geometry", videos: 18, storageSize: "98.5 GB", bandwidth: "1.4 TB", status: "published" },
  { id: 3, name: "Calculus", videos: 30, storageSize: "210.8 GB", bandwidth: "3.2 TB", status: "draft" },
  { id: 4, name: "Trigonometry", videos: 12, storageSize: "67.3 GB", bandwidth: "0.9 TB", status: "published" },
  { id: 5, name: "Statistics", videos: 20, storageSize: "110.1 GB", bandwidth: "1.8 TB", status: "draft" },
];

const STATUS_STYLES: Record<string, string> = {
  published: "bg-success-tint text-success",
  draft: "bg-surface-strong text-on-surface-muted",
};

export function StorageTable() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm) return MOCK_COURSES;
    const term = searchTerm.toLowerCase();
    return MOCK_COURSES.filter((c) => c.name.toLowerCase().includes(term));
  }, [searchTerm]);

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-xs">
      <div className="border-b border-border px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 ps-9 pe-3 text-sm text-foreground placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-muted text-xs font-bold text-on-surface-muted">
              <th className="px-4 py-3 text-start">Course</th>
              <th className="px-4 py-3 text-start">Videos</th>
              <th className="px-4 py-3 text-start">Storage</th>
              <th className="px-4 py-3 text-start">Bandwidth</th>
              <th className="px-4 py-3 text-start">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-on-surface-muted">
                  No courses found
                </td>
              </tr>
            ) : (
              filtered.map((course) => (
                <tr
                  key={course.id}
                  className="border-t border-border transition-colors hover:bg-surface-muted"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary-tint text-primary">
                        <BookOpen className="size-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {course.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-muted">
                    {course.videos}
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-muted">
                    {course.storageSize}
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-muted">
                    {course.bandwidth}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[course.status]}`}
                    >
                      {course.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
