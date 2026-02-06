import React from 'react';
import { z } from 'zod';
import { useForm, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from './Form';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from './Calendar';
import { useRegisterPatient } from '../helpers/useRegisterPatient';
import { useUpdatePatientProfile } from '../helpers/useUpdatePatientProfile';
import { useSuccessToast } from '../helpers/useSuccessToast';
import { useLoadingStates } from '../helpers/useLoadingStates';
import { schema as registerSchema } from '../endpoints/patients/register_POST.schema';
import { schema as updateSchema, InputType as UpdateInputType } from '../endpoints/patients/profile_POST.schema';
import { PatientProfile } from '../endpoints/patients/profile_GET.schema';
import styles from './PatientForm.module.css';

// Client-side schema for registration, adding privacy policy validation
const registrationFormSchema = registerSchema.extend({
  privacyPolicy: z.boolean().refine(v => v, {
    message: 'Debe aceptar la política de privacidad.'
  }),
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;

interface PatientFormProps {
  mode: 'register' | 'edit';
  patient?: PatientProfile;
  onSuccess?: () => void;
  className?: string;
}

const RegisterForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const form = useForm({
    schema: registrationFormSchema,
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
      address: '',
      phone: '',
      birthDate: undefined,
      allergies: '',
      medicalHistory: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      privacyPolicy: false,
    },
  });

  const registerMutation = useRegisterPatient();
  const { showSuccessToast } = useSuccessToast();
  const { isLoading } = useLoadingStates([registerMutation]);

  const onSubmit = (values: RegistrationFormValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        form.setValues(form.defaultValues as RegistrationFormValues);
        showSuccessToast('patientRegistration');
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.grid}>
          <FormItem name="displayName">
            <FormLabel>Nombre Completo</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Juan Pérez"
                value={form.values.displayName}
                onChange={(e) => form.setValues((prev) => ({ ...prev, displayName: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="email">
            <FormLabel>Correo Electrónico</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="ejemplo@correo.com"
                value={form.values.email}
                onChange={(e) => form.setValues((prev) => ({ ...prev, email: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="password">
            <FormLabel>Contraseña</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.values.password}
                onChange={(e) => form.setValues((prev) => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="birthDate">
            <FormLabel>Fecha de Nacimiento</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={styles.datePickerButton}
                    disabled={isLoading}
                  >
                    {form.values.birthDate ? form.values.birthDate.toLocaleDateString('es-AR') : <span>Seleccionar fecha</span>}
                    <CalendarIcon size={16} />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent removeBackgroundAndPadding>
                <Calendar
                  mode="single"
                  selected={form.values.birthDate}
                  onSelect={(date) => form.setValues((prev) => ({ ...prev, birthDate: date as Date }))}
                  disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>

          <FormItem name="phone">
            <FormLabel>Teléfono</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: 11 2345 6789"
                value={form.values.phone}
                onChange={(e) => form.setValues((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="address">
            <FormLabel>Dirección</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Av. Corrientes 1234, CABA"
                value={form.values.address}
                onChange={(e) => form.setValues((prev) => ({ ...prev, address: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <h3 className={styles.sectionTitle}>Información Médica</h3>
        <div className={styles.grid}>
            <FormItem name="allergies" className={styles.fullWidth}>
                <FormLabel>Alergias</FormLabel>
                <FormControl>
                <Textarea
                    placeholder="Ej: Penicilina, aspirina..."
                    value={form.values.allergies ?? ''}
                    onChange={(e) => form.setValues((prev) => ({ ...prev, allergies: e.target.value }))}
                    disabled={isLoading}
                />
                </FormControl>
                <FormDescription>Si no tiene, deje este campo vacío.</FormDescription>
                <FormMessage />
            </FormItem>

            <FormItem name="medicalHistory" className={styles.fullWidth}>
                <FormLabel>Historial Médico Relevante</FormLabel>
                <FormControl>
                <Textarea
                    placeholder="Ej: Diabetes, hipertensión, cirugías previas..."
                    value={form.values.medicalHistory ?? ''}
                    onChange={(e) => form.setValues((prev) => ({ ...prev, medicalHistory: e.target.value }))}
                    disabled={isLoading}
                />
                </FormControl>
                <FormDescription>Si no tiene, deje este campo vacío.</FormDescription>
                <FormMessage />
            </FormItem>
        </div>

        <h3 className={styles.sectionTitle}>Contacto de Emergencia</h3>
        <div className={styles.grid}>
          <FormItem name="emergencyContactName">
            <FormLabel>Nombre del Contacto</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: María González"
                value={form.values.emergencyContactName}
                onChange={(e) => form.setValues((prev) => ({ ...prev, emergencyContactName: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="emergencyContactPhone">
            <FormLabel>Teléfono del Contacto</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: 11 9876 5432"
                value={form.values.emergencyContactPhone}
                onChange={(e) => form.setValues((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem name="privacyPolicy" className={styles.checkboxItem}>
          <FormControl>
            <Checkbox
              id="privacyPolicy"
              checked={form.values.privacyPolicy}
              onChange={(e) => form.setValues((prev) => ({ ...prev, privacyPolicy: e.target.checked }))}
              disabled={isLoading}
            />
          </FormControl>
          <div className={styles.checkboxLabelContainer}>
            <FormLabel htmlFor="privacyPolicy">Acepto la política de privacidad y los términos de servicio.</FormLabel>
            <FormMessage />
          </div>
        </FormItem>

        <Button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading && <Loader2 className={styles.spinner} />}
          Registrarse
        </Button>
      </form>
    </Form>
  );
};

const EditForm: React.FC<{ patient: PatientProfile; onSuccess?: () => void }> = ({ patient, onSuccess }) => {
  const form = useForm({
    schema: updateSchema,
    defaultValues: {
      patientId: patient.id,
      address: patient.address ?? '',
      phone: patient.phone ?? '',
      birthDate: patient.birthDate ? new Date(patient.birthDate) : undefined,
      allergies: patient.allergies ?? '',
      medicalHistory: patient.medicalHistory ?? '',
      emergencyContactName: patient.emergencyContactName ?? '',
      emergencyContactPhone: patient.emergencyContactPhone ?? '',
    },
  });

  const updateMutation = useUpdatePatientProfile();
  const { showSuccessToast } = useSuccessToast();
  const { isLoading } = useLoadingStates([updateMutation]);

  const onSubmit = (values: UpdateFormValues) => {
    const changedValues: Partial<UpdateInputType> & { patientId: number } = { patientId: patient.id };
    let hasChanges = false;

    (Object.keys(values) as Array<keyof UpdateFormValues>).forEach(key => {
        if (key === 'patientId') return;
        
        const formValue = values[key];
        const patientValue = patient[key as keyof PatientProfile];

        // Handle date comparison
        if (key === 'birthDate' && formValue instanceof Date && patientValue) {
            if (formValue.getTime() !== new Date(patientValue).getTime()) {
                (changedValues as any)[key] = formValue;
                hasChanges = true;
            }
        } else if (formValue !== (patientValue ?? '')) {
            (changedValues as any)[key] = formValue;
            hasChanges = true;
        }
    });

    if (hasChanges) {
        updateMutation.mutate(changedValues as UpdateInputType, {
            onSuccess: () => {
                showSuccessToast('profileUpdate');
                onSuccess?.();
            },
        });
    } else {
        onSuccess?.(); // No changes, just close the form
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.grid}>
          <FormItem name="birthDate">
            <FormLabel>Fecha de Nacimiento</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={styles.datePickerButton}
                    disabled={isLoading}
                  >
                    {form.values.birthDate ? form.values.birthDate.toLocaleDateString('es-AR') : <span>Seleccionar fecha</span>}
                    <CalendarIcon size={16} />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent removeBackgroundAndPadding>
                <Calendar
                  mode="single"
                  selected={form.values.birthDate}
                  onSelect={(date) => form.setValues((prev) => ({ ...prev, birthDate: date as Date }))}
                  disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>

          <FormItem name="phone">
            <FormLabel>Teléfono</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: 11 2345 6789"
                value={form.values.phone}
                onChange={(e) => form.setValues((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="address" className={styles.fullWidth}>
            <FormLabel>Dirección</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Av. Corrientes 1234, CABA"
                value={form.values.address}
                onChange={(e) => form.setValues((prev) => ({ ...prev, address: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <h3 className={styles.sectionTitle}>Información Médica</h3>
        <div className={styles.grid}>
            <FormItem name="allergies" className={styles.fullWidth}>
                <FormLabel>Alergias</FormLabel>
                <FormControl>
                <Textarea
                    placeholder="Ej: Penicilina, aspirina..."
                    value={form.values.allergies ?? ''}
                    onChange={(e) => form.setValues((prev) => ({ ...prev, allergies: e.target.value }))}
                    disabled={isLoading}
                />
                </FormControl>
                <FormDescription>Si no tiene, deje este campo vacío.</FormDescription>
                <FormMessage />
            </FormItem>

            <FormItem name="medicalHistory" className={styles.fullWidth}>
                <FormLabel>Historial Médico Relevante</FormLabel>
                <FormControl>
                <Textarea
                    placeholder="Ej: Diabetes, hipertensión, cirugías previas..."
                    value={form.values.medicalHistory ?? ''}
                    onChange={(e) => form.setValues((prev) => ({ ...prev, medicalHistory: e.target.value }))}
                    disabled={isLoading}
                />
                </FormControl>
                <FormDescription>Si no tiene, deje este campo vacío.</FormDescription>
                <FormMessage />
            </FormItem>
        </div>

        <h3 className={styles.sectionTitle}>Contacto de Emergencia</h3>
        <div className={styles.grid}>
          <FormItem name="emergencyContactName">
            <FormLabel>Nombre del Contacto</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: María González"
                value={form.values.emergencyContactName}
                onChange={(e) => form.setValues((prev) => ({ ...prev, emergencyContactName: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="emergencyContactPhone">
            <FormLabel>Teléfono del Contacto</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: 11 9876 5432"
                value={form.values.emergencyContactPhone}
                onChange={(e) => form.setValues((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <div className={styles.buttonContainer}>
            <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>
                Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className={styles.spinner} />}
                Guardar Cambios
            </Button>
        </div>
      </form>
    </Form>
  );
};

export const PatientForm: React.FC<PatientFormProps> = ({ mode, patient, onSuccess, className }) => {
  if (mode === 'register') {
    return <RegisterForm onSuccess={onSuccess} />;
  }

  if (mode === 'edit' && patient) {
    return <EditForm patient={patient} onSuccess={onSuccess} />;
  }

  return null;
};