import { useState, useEffect } from 'react';
import { databaseValidationService } from '../services/databaseValidationService';

export const useDatabaseValidation = (autoValidate = true) => {
  const [validation, setValidation] = useState({
    isValidating: true,
    isValid: false,
    error: null,
    type: null,
    details: null,
    lastChecked: null
  });

  const validateDatabase = async () => {
    setValidation(prev => ({ ...prev, isValidating: true, error: null }));
    
    try {
      const result = await databaseValidationService?.validateDatabaseSchema();
      
      setValidation({
        isValidating: false,
        isValid: result?.success,
        error: result?.success ? null : result?.error,
        type: result?.success ? null : result?.type,
        details: result?.details,
        lastChecked: new Date()?.toISOString()
      });

      return result;
    } catch (error) {
      setValidation({
        isValidating: false,
        isValid: false,
        error: 'Failed to validate database connection',
        type: 'VALIDATION_ERROR',
        details: error?.message,
        lastChecked: new Date()?.toISOString()
      });

      return { success: false, error: error?.message };
    }
  };

  const retryConnection = async () => {
    return await validateDatabase();
  };

  const refreshPage = () => {
    window?.location?.reload();
  };

  useEffect(() => {
    if (autoValidate) {
      validateDatabase();
    }
  }, [autoValidate]);

  return {
    ...validation,
    validateDatabase,
    retryConnection,
    refreshPage
  };
};