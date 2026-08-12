import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./components/Dashboard";
import Attendance from "./components/Attendance";
import { Layout } from "./components/Layout";
import { useStore } from "./store/useStore";
import UserManagement from "./components/UserManagement";
import { SettingsComponent } from "./components/SettingsComponent";
import DataImport from './components/DataImport';
import SetupManagement from './components/SetupManagement';
import { AccessRestricted } from './components/AccessRestricted';
import { Login } from "./components/Login";
import Reports from './components/Reports';
import Students from './components/Students';
import AuthProvider from "./auth/AuthProvider";
import { initSemesterGuard, clearSemesterGuard } from './utils/semesterGuard';
import { RefreshCw } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const { currentSection, currentUser, isAuthenticated } = useStore();
  const [semesterChanged, setSemesterChanged] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initSemesterGuard(() => setSemesterChanged(true));
    } else {
      clearSemesterGuard();
    }
  }, [isAuthenticated]);

  const renderSection = () => {
    switch(currentSection) {
      case 'dashboard':
        return currentUser?.role === 'staff' ? <Attendance /> : <Dashboard />;
      case 'attendance':
        return <Attendance />;
      case 'reports':
        return <Reports />;
      case 'students':
        return <Students />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SettingsComponent />;
      case 'import':
        return <SetupManagement defaultTab="import" />;
      case 'setup':
        return currentUser?.role === 'supervisor' ? <AccessRestricted /> : <SetupManagement defaultTab="buildings" />;
      case 'semesters':
        return currentUser?.role === 'supervisor' ? <AccessRestricted /> : <SetupManagement defaultTab="semesters" />;
      default:
        return <Attendance />;
    }
  };
  if (!isAuthenticated) {
    return <Login />;
  }
  return (
    <QueryClientProvider client={queryClient}>
     <AuthProvider>
      <Layout>
        {renderSection()}
      </Layout>
      
      {/* Semester Change Modal */}
      {semesterChanged && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <RefreshCw size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Semester Changed</h2>
                <p className="text-sm text-gray-600 mt-1">
                  The administrator has switched to a new semester. Please reload the page to see updated data.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Reload Now
            </button>
          </div>
        </div>
      )}
     </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;