"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet";
import { View } from "react-big-calendar";
import { useAuth } from "../helpers/useAuth";
import { AppointmentCalendar } from "../components/AppointmentCalendar";
import { AppointmentModal } from "../components/AppointmentModal";
import { useAppointments } from "../helpers/useAppointments";
import { Appointment } from "../endpoints/appointments_GET.schema";
import { add, sub } from "date-fns";
import styles from "./calendar.module.css";
import { Skeleton } from "../components/Skeleton";

export type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
};

const CalendarPage = () => {
  const { authState } = useAuth();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    event?: CalendarEvent;
    slot?: { start: Date; end: Date };
  }>({ isOpen: false });

  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());

  const dateRange = useMemo(() => {
    let start, end;
    if (view === "month") {
      start = sub(date, { months: 1 });
      end = add(date, { months: 1 });
    } else if (view === "week") {
      start = sub(date, { weeks: 1 });
      end = add(date, { weeks: 1 });
    } else {
      start = sub(date, { days: 3 });
      end = add(date, { days: 3 });
    }
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [date, view]);

  const {
    data: appointmentsData,
    isFetching,
    error,
  } = useAppointments(dateRange);

  const events = useMemo<CalendarEvent[]>(() => {
    if (!appointmentsData?.appointments) return [];
    return appointmentsData.appointments.map((app) => ({
      id: app.id,
      title:
        authState.type === "authenticated" && authState.user.role === "patient"
          ? `Cita con Dr(a). ${app.dentist.displayName}`
          : `Cita con ${app.patient.displayName}`,
      start: new Date(app.appointmentDate),
      end: add(new Date(app.appointmentDate), {
        minutes: app.durationMinutes ?? 60,
      }),
      resource: app,
    }));
  }, [appointmentsData, authState]);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      if (
        authState.type === "authenticated" &&
        authState.user.role === "dentist"
      ) {
        setModalState({ isOpen: true, slot: { start, end } });
      }
      if (
        authState.type === "authenticated" &&
        authState.user.role === "patient"
      ) {
        setModalState({ isOpen: true, slot: { start, end } });
      }
    },
    [authState]
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setModalState({ isOpen: true, event });
  }, []);

  const closeModal = () => {
    setModalState({ isOpen: false });
  };

  if (authState.type === "loading") {
    return (
      <div className={styles.container}>
        <Skeleton style={{ height: "4rem", marginBottom: "var(--spacing-4)" }} />
        <Skeleton style={{ height: "calc(100vh - 12rem)" }} />
      </div>
    );
  }

  if (authState.type !== "authenticated") {
    // This should be handled by ProtectedRoute, but as a fallback
    return (
      <div className={styles.container}>
        <p>Debe iniciar sesión para ver el calendario.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Calendario de Citas | Agenda Odontológica</title>
        <meta
          name="description"
          content="Gestione sus citas odontológicas. Vea, programe y edite sus turnos de forma fácil y rápida."
        />
      </Helmet>
      <div className={styles.container}>
        <AppointmentCalendar
          events={events}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          isLoading={isFetching}
          view={view}
          onView={(newView: View) => setView(newView)}
          date={date}
          onNavigate={setDate}
          userRole={authState.user.role}
        />
        {modalState.isOpen && (
          <AppointmentModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            event={modalState.event}
            slot={modalState.slot}
            currentUser={authState.user}
          />
        )}
        {error && (
          <div className={styles.error}>
            Error al cargar las citas: {error.message}
          </div>
        )}
      </div>
    </>
  );
};

export default CalendarPage;