import React from 'react';
import Routes from './Routes';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import DatabaseErrorBoundary from './components/ui/DatabaseErrorBoundary';
import { useDatabaseValidation } from './hooks/useDatabaseValidation';

// App wrapper component to handle database validation
const AppWithValidation = () => {
  const { isValidating, isValid, error, retryConnection, refreshPage } = useDatabaseValidation();

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (!isValid && error) {
    return (
      <DatabaseErrorBoundary
        error={error}
        onRetry={retryConnection}
        onRefresh={refreshPage}
      />
    );
  }

  return <Routes />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppWithValidation />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;