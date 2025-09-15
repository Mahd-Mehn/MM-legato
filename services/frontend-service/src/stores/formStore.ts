import { create } from 'zustand';

interface FormState {
  isDirty: Record<string, boolean>;
  isSubmitting: Record<string, boolean>;
  errors: Record<string, Record<string, string>>;
  savedData: Record<string, any>;
}

interface FormActions {
  setFormDirty: (formId: string, dirty: boolean) => void;
  setFormSubmitting: (formId: string, submitting: boolean) => void;
  setFormErrors: (formId: string, errors: Record<string, string>) => void;
  clearFormErrors: (formId: string) => void;
  saveFormData: (formId: string, data: any) => void;
  getSavedFormData: (formId: string) => any;
  clearFormData: (formId: string) => void;
  resetForm: (formId: string) => void;
}

type FormStore = FormState & FormActions;

export const useFormStore = create<FormStore>((set, get) => ({
  // State
  isDirty: {},
  isSubmitting: {},
  errors: {},
  savedData: {},

  // Actions
  setFormDirty: (formId, dirty) => set((state) => ({
    isDirty: { ...state.isDirty, [formId]: dirty },
  })),

  setFormSubmitting: (formId, submitting) => set((state) => ({
    isSubmitting: { ...state.isSubmitting, [formId]: submitting },
  })),

  setFormErrors: (formId, errors) => set((state) => ({
    errors: { ...state.errors, [formId]: errors },
  })),

  clearFormErrors: (formId) => set((state) => ({
    errors: { ...state.errors, [formId]: {} },
  })),

  saveFormData: (formId, data) => set((state) => ({
    savedData: { ...state.savedData, [formId]: data },
  })),

  getSavedFormData: (formId) => {
    const state = get();
    return state.savedData[formId] || null;
  },

  clearFormData: (formId) => set((state) => ({
    savedData: { ...state.savedData, [formId]: null },
  })),

  resetForm: (formId) => set((state) => ({
    isDirty: { ...state.isDirty, [formId]: false },
    isSubmitting: { ...state.isSubmitting, [formId]: false },
    errors: { ...state.errors, [formId]: {} },
    savedData: { ...state.savedData, [formId]: null },
  })),
}));

// Selectors
export const useFormState = (formId: string) => useFormStore((state) => ({
  isDirty: state.isDirty[formId] || false,
  isSubmitting: state.isSubmitting[formId] || false,
  errors: state.errors[formId] || {},
  savedData: state.savedData[formId],
  setDirty: (dirty: boolean) => state.setFormDirty(formId, dirty),
  setSubmitting: (submitting: boolean) => state.setFormSubmitting(formId, submitting),
  setErrors: (errors: Record<string, string>) => state.setFormErrors(formId, errors),
  clearErrors: () => state.clearFormErrors(formId),
  saveData: (data: any) => state.saveFormData(formId, data),
  getSavedData: () => state.getSavedFormData(formId),
  clearData: () => state.clearFormData(formId),
  reset: () => state.resetForm(formId),
}));