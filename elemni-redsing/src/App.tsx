import { useState } from 'react';
import { TabType, Student, Course, PlayerSettings, NotificationItem } from './types';
import {
  initialStudents,
  initialVideoItems,
  initialCourses,
  initialPlayerSettings,
  initialNotifications
} from './data/mockData';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CreateCourseModal } from './components/CreateCourseModal';
import { GrantAccessModal } from './components/GrantAccessModal';

import { OverviewView } from './components/views/OverviewView';
import { CoursesView } from './components/views/CoursesView';
import { StudentsView } from './components/views/StudentsView';
import { StorageView } from './components/views/StorageView';
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [videos] = useState(initialVideoItems);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [settings, setSettings] = useState<PlayerSettings>(initialPlayerSettings);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [grantModalStudent, setGrantModalStudent] = useState<Student | null>(null);

  const handleCreateCourse = (newCourse: Course) => {
    setCourses((prev) => [newCourse, ...prev]);
    // Optionally create a notification
    setNotifications((prev) => [
      {
        id: `n_${Date.now()}`,
        title: `تم إضافة دَورة جديدة: "${newCourse.title}"`,
        time: 'الآن',
        read: false,
        type: 'system'
      },
      ...prev
    ]);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
  };

  const handleToggleBlockStudent = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const newStatus = s.status === 'محظور' ? 'نشط' : 'محظور';
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
  };

  const handleGrantAccessConfirm = (
    studentId: string,
    accessType: Student['accessType']
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return { ...s, accessType, status: 'نشط' };
        }
        return s;
      })
    );
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] antialiased flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main App Content Container */}
      <main className="md:mr-[280px] min-h-screen flex flex-col pb-24 md:pb-8">
        {/* Header Bar */}
        <Header
          onCreateCourseClick={() => setIsCreateCourseOpen(true)}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
        />

        {/* View Canvas */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {currentTab === 'overview' && (
            <OverviewView
              students={students}
              videos={videos}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentTab === 'courses' && (
            <CoursesView
              courses={courses}
              onCreateCourseClick={() => setIsCreateCourseOpen(true)}
              onUpdateCourse={handleUpdateCourse}
            />
          )}

          {currentTab === 'students' && (
            <StudentsView
              students={students}
              onToggleBlockStudent={handleToggleBlockStudent}
              onOpenGrantModal={(st) => setGrantModalStudent(st)}
            />
          )}

          {currentTab === 'storage' && <StorageView courses={courses} />}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <MobileBottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Modals */}
      <CreateCourseModal
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
        onCreate={handleCreateCourse}
      />

      <GrantAccessModal
        student={grantModalStudent}
        isOpen={!!grantModalStudent}
        onClose={() => setGrantModalStudent(null)}
        onConfirm={handleGrantAccessConfirm}
      />
    </div>
  );
}
