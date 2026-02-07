import React, { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { useCreateAppointment } from "../helpers/useCreateAppointment";
import { useUpdateAppointment } from "../helpers/useUpdateAppointment";
import { useCancelAppointment } from "../helpers/useCancelAppointment";
import { useConfirmAppointment } from "../helpers/useConfirmAppointment";
import { usePatients } from "../helpers/usePatients";
import { useQuery } from "@tanstack/react-query";
import { getDentists } from "../endpoints/dentists_GET.schema";
import { User } from "../helpers/User";
import { CalendarEvent } from "../pages/calendar";
import { format, parseISO } from "date-fns";
import { Spinner } from "./Spinner";
import { toast } from "sonner";
import { AppointmentStatus, appointmentStatusValues } from "../helpers/appointmentTypes";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  slot?: { start: Date; end: Date };
  currentUser: User;
}

const appointmentSchema = z.object({
  appointmentDate: z.string().datetime(),
  durationMinutes: z.coerce.number().int().positive("La duración debe ser un número positivo."),
  reason: z.string().min(1, "El motivo es requerido."),
  notes: z.string().optional(),
  dentistId: z.coerce.number().int(),
  patientId: z.coerce.number().int(),
  status: z.enum(appointmentStatusValues).optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  event,
  slot,
  currentUser,
}) => {
  const isNew = !event;
  const { data: patientsData, isFetching: isLoadingPatients } = usePatients();
  const { data: dentistsData, isFetching: isLoadingDentists } = useQuery({
    queryKey: ["dentists"],
    queryFn: getDentists,
  });

  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const cancelAppointment = useCancelAppointment();
  const confirmAppointment = useConfirmAppointment();

  const form = useForm({
    schema: appointmentSchema,
    defaultValues: {
      appointmentDate: (slot?.start ?? event?.start)?.toISOString(),
      durationMinutes: event?.resource.durationMinutes ?? 60,
      reason: event?.resource.reason ?? "",
      notes: event?.resource.notes ?? "",
      dentistId: event?.resource.dentist.id,
      patientId: currentUser.role === "patient" ? currentUser.id : event?.resource.patient.id,
      status: (event?.resource.status as AppointmentStatus) ?? "programada",
    },
  });

  useEffect(() => {
    const defaultValues: AppointmentFormData = {
      appointmentDate: (slot?.start ?? event?.start)?.toISOString() ?? "",
      durationMinutes: event?.resource.durationMinutes ?? 60,
      reason: event?.resource.reason ?? "",
      notes: event?.resource.notes ?? "",
      dentistId: event?.resource.dentist?.id ?? 0,
      patientId:
        currentUser.role === "patient" ? currentUser.id : (event?.resource.patient?.id ?? 0),
      status: (event?.resource.status as AppointmentStatus) ?? "programada",
    };
    form.setValues(defaultValues);
  }, [event, slot, currentUser, form.setValues]);

  const onSubmit = (data: AppointmentFormData) => {
    if (isNew) {
      createAppointment.mutate(
        {
          ...data,
          patientId: currentUser.role === "patient" ? currentUser.id : data.patientId,
        },
        { onSuccess: onClose },
      );
    } else if (event) {
      updateAppointment.mutate({ id: event.id, ...data }, { onSuccess: onClose });
    }
  };

  const handleCancel = () => {
    if (event) {
      cancelAppointment.mutate({ id: event.id }, { onSuccess: onClose });
    }
  };

  const handleConfirm = () => {
    if (event) {
      confirmAppointment.mutate({ id: event.id }, { onSuccess: onClose });
    }
  };

  const isProcessing =
    createAppointment.isPending ||
    updateAppointment.isPending ||
    cancelAppointment.isPending ||
    confirmAppointment.isPending;

  const canEdit =
    isNew ||
    (event &&
      (currentUser.role === "dentist" ||
        (currentUser.role === "patient" && currentUser.id === event.resource.patient.id)));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? "Programar Nueva Cita" : "Detalles de la Cita"}</DialogTitle>
          <DialogDescription>
            {isNew
              ? "Complete los detalles para crear una nueva cita."
              : `Cita para el ${format(
                  parseISO(form.values.appointmentDate!),
                  "dd/MM/yyyy 'a las' HH:mm",
                )}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormItem name="appointmentDate">
                <FormLabel>Fecha y Hora</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={
                      form.values.appointmentDate
                        ? format(new Date(form.values.appointmentDate), "yyyy-MM-dd'T'HH:mm")
                        : ""
                    }
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        appointmentDate: new Date(e.target.value).toISOString(),
                      }))
                    }
                    disabled={!canEdit || isProcessing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="durationMinutes">
                <FormLabel>Duración (minutos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={form.values.durationMinutes}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        durationMinutes: parseInt(e.target.value) || 0,
                      }))
                    }
                    disabled={!canEdit || isProcessing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            {currentUser.role === "dentist" && (
              <FormItem name="patientId">
                <FormLabel>Paciente</FormLabel>
                <Select
                  onValueChange={(value) =>
                    form.setValues((prev) => ({ ...prev, patientId: parseInt(value) || 0 }))
                  }
                  value={form.values.patientId?.toString()}
                  disabled={!isNew || isLoadingPatients || isProcessing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patientsData?.patients.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}

            {currentUser.role === "patient" && (
              <FormItem name="dentistId">
                <FormLabel>Odontólogo</FormLabel>
                <Select
                  onValueChange={(value) =>
                    form.setValues((prev) => ({ ...prev, dentistId: parseInt(value) || 0 }))
                  }
                  value={form.values.dentistId?.toString()}
                  disabled={!isNew || isLoadingDentists || isProcessing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un odontólogo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dentistsData?.dentists.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}

            <FormItem name="reason">
              <FormLabel>Motivo</FormLabel>
              <FormControl>
                <Input
                  value={form.values.reason}
                  onChange={(e) =>
                    form.setValues((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  disabled={!canEdit || isProcessing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="notes">
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  value={form.values.notes}
                  onChange={(e) =>
                    form.setValues((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  disabled={!canEdit || isProcessing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            {!isNew && currentUser.role === "dentist" && (
              <FormItem name="status">
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={(value) =>
                    form.setValues((prev) => ({ ...prev, status: value as AppointmentStatus }))
                  }
                  value={form.values.status}
                  disabled={isProcessing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="programada">Programada</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="ausente">No se presentó</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}

            <DialogFooter>
              {!isNew && canEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Spinner size="sm" /> : "Cancelar Cita"}
                </Button>
              )}
              {!isNew && currentUser.role === "dentist" && form.values.status === "programada" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Spinner size="sm" /> : "Confirmar Cita"}
                </Button>
              )}
              {canEdit && (
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? <Spinner size="sm" /> : isNew ? "Crear Cita" : "Guardar Cambios"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
