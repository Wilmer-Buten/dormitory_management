import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./components/Dashboard";
import { Layout } from "./components/Layout";
import { useStore } from "./store/useStore";
import UserManagement from "./components/UserManagement";
import { SettingsComponent } from "./components/SettingsComponent";
import DataImport from "./components/DataImport";
import { Login } from "./components/Login";
import AuthProvider from "./auth/AuthProvider";

const queryClient = new QueryClient();

function App() {
  const { currentSection, isAuthenticated } = useStore();

  const renderSection = () => {
    switch(currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SettingsComponent />;
      case 'import':
        return <DataImport />;
      default:
        return <Dashboard />;
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
     </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;