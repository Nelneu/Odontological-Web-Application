import React from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
  View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "./AppointmentCalendar.module.css";
import { CalendarEvent } from "../pages/calendar";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Spinner } from "./Spinner";
import { User } from "../helpers/User";
import { ChevronLeft, ChevronRight } from "lucide-react";

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // Lunes
  getDay,
  locales,
});

const messages = {
  allDay: "Todo el día",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "No hay citas en este rango.",
  showMore: (total: number) => `+ Ver más (${total})`,
};

const getStatusVariant = (
  status: string | null
): "success" | "default" | "warning" | "destructive" | "secondary" => {
  switch (status) {
    case "confirmed":
      return "success";
    case "completed":
      return "secondary";
    case "cancelled":
      return "destructive";
    case "no_show":
      return "warning";
    case "scheduled":
    default:
      return "default";
  }
};

const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  const status = event.resource.status ?? "scheduled";
  return (
    <div className={styles.event}>
      <div className={styles.eventTitle}>{event.title}</div>
      <div className={styles.eventDetails}>
        <Badge variant={getStatusVariant(status)}>{status}</Badge>
      </div>
    </div>
  );
};

const CustomToolbar = ({
  label,
  onNavigate,
  onView,
  view,
  isLoading,
}: any) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <Button
          variant="outline"
          size="icon-md"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="outline"
          size="icon-md"
          onClick={() => onNavigate("NEXT")}
        >
          <ChevronRight size={16} />
        </Button>
        <Button variant="outline" onClick={() => onNavigate("TODAY")}>
          Hoy
        </Button>
        {isLoading && <Spinner size="sm" />}
      </div>
      <div className={styles.toolbarLabel}>{label}</div>
      <div className={styles.toolbarGroup}>
        <Button
          variant={view === "month" ? "primary" : "outline"}
          onClick={() => onView("month")}
        >
          Mes
        </Button>
        <Button
          variant={view === "week" ? "primary" : "outline"}
          onClick={() => onView("week")}
        >
          Semana
        </Button>
        <Button
          variant={view === "day" ? "primary" : "outline"}
          onClick={() => onView("day")}
        >
          Día
        </Button>
      </div>
    </div>
  );
};

interface AppointmentCalendarProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (slot: { start: Date; end: Date }) => void;
  isLoading: boolean;
  view: View;
  onView: (view: View) => void;
  date: Date;
  onNavigate: (date: Date) => void;
  userRole: User["role"];
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  events,
  onSelectEvent,
  onSelectSlot,
  isLoading,
  view,
  onView,
  date,
  onNavigate,
  userRole,
}) => {
  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status ?? "scheduled";
    const backgroundColor = `var(--${getStatusVariant(status)})`;
    const style = {
      backgroundColor: `color-mix(in srgb, ${backgroundColor} 20%, transparent)`,
      borderRadius: "var(--radius-sm)",
      color: `var(--${getStatusVariant(status)})`,
      border: `1px solid var(--${getStatusVariant(status)})`,
      display: "block",
      opacity: 0.9,
    };
    return {
      style: style,
    };
  };

  return (
    <div className={styles.calendarWrapper}>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100vh - 12rem)" }}
        messages={messages}
        selectable={userRole !== "admin"} // Allow slot selection for patients and dentists
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        view={view}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        onView={onView}
        date={date}
        onNavigate={onNavigate}
        components={{
          event: CustomEvent,
          toolbar: (props) => <CustomToolbar {...props} isLoading={isLoading} />,
        }}
        eventPropGetter={eventStyleGetter}
        min={new Date(0, 0, 0, 8, 0, 0)} // 8:00 AM
        max={new Date(0, 0, 0, 20, 0, 0)} // 8:00 PM
        step={30}
        timeslots={2}
      />
    </div>
  );
};