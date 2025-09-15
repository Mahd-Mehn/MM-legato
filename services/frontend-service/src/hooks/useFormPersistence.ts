import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface FormPersistenceOptions {
  key: string;
  exclude?: string[];
  include?: string[];
  debounceMs?: number;
}

export function useFormPersistence<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  options: FormPersistenceOptions
) {
  const { key, exclude = [], include, debounceMs = 500 } = options;

  // Load saved form data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(`form-${key}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Filter fields based on include/exclude options
        const fieldsToRestore = Object.keys(parsedData).filter(field => {
          if (include && include.length > 0) {
            return include.includes(field);
          }
          return !exclude.includes(field);
        });

        // Restore form values
        fieldsToRestore.forEach(field => {
          if (parsedData[field] !== undefined) {
            form.setValue(field as any, parsedData[field]);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
  }, [key, form, include, exclude]);

  // Save form data on changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const subscription = form.watch((data) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        try {
          // Filter data based on include/exclude options
          const dataToSave = Object.keys(data).reduce((acc, field) => {
            if (include && include.length > 0) {
              if (include.includes(field)) {
                acc[field] = data[field];
              }
            } else if (!exclude.includes(field)) {
              acc[field] = data[field];
            }
            return acc;
          }, {} as Record<string, any>);

          localStorage.setItem(`form-${key}`, JSON.stringify(dataToSave));
        } catch (error) {
          console.warn('Failed to save form data:', error);
        }
      }, debounceMs);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [form, key, include, exclude, debounceMs]);

  // Clear saved form data
  const clearSavedData = () => {
    try {
      localStorage.removeItem(`form-${key}`);
    } catch (error) {
      console.warn('Failed to clear saved form data:', error);
    }
  };

  return { clearSavedData };
}