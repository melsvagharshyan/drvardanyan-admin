import React, { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  useGetAvailabilityQuery,
  useGetAppointmentsQuery,
} from "../../api/api";
import { clsx } from "clsx";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { toast } from "react-toastify";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onTimeSlotSelect?: (timeSlot: string) => void;
  onRefetch?: () => void; // Add refetch callback
}

export const CalendarComponent: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  onTimeSlotSelect,
  onRefetch,
}) => {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [touchedSlot, setTouchedSlot] = useState<string | null>(null);

  // Получаем доступность для выбранной даты
  const { data: availability, isLoading } = useGetAvailabilityQuery({
    date: format(selectedDate, "yyyy-MM-dd"),
    tzOffset: new Date().getTimezoneOffset(),
  });

  // Получаем все записи для отображения деталей в тултипах
  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useGetAppointmentsQuery();

  const handleSlotInteraction = (slotTime: string, isBooked: boolean) => {
    if (isBooked) {
      if (touchedSlot === slotTime) {
        setTouchedSlot(null); // Hide tooltip on second tap
      } else {
        setTouchedSlot(slotTime); // Show tooltip on first tap
      }
    } else if (!isBooked) {
      // For available slots, create appointment with pre-filled date and time
      onTimeSlotSelect?.(slotTime);
    }
  };

  const getTimeSlots = () => {
    if (!availability) return [];

    const slots = [];
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = new Date(selectedDate);
        time.setHours(hour, minute, 0, 0);
        const isoTime = time.toISOString();

        const isBooked = availability.busySlots.some((slot) => {
          const slotTime = new Date(slot);
          return slotTime.getTime() === time.getTime();
        });

        const isAvailable = availability.availableSlots.some((slot) => {
          const slotTime = new Date(slot);
          return slotTime.getTime() === time.getTime();
        });

        // Находим запись для этого временного слота - улучшенная логика
        let appointment = null;
        if (isBooked) {
          appointment = appointments.find((apt) => {
            const aptStart = new Date(apt.start);
            const aptEnd = new Date(apt.end);
            const slotTime = new Date(isoTime);

            // Проверяем, попадает ли слот в диапазон записи
            return slotTime >= aptStart && slotTime < aptEnd;
          });

          // Если не нашли по времени, ищем по дате и примерному времени
          if (!appointment) {
            appointment = appointments.find((apt) => {
              const aptDate = new Date(apt.start);
              const slotDate = new Date(isoTime);

              // Проверяем, что это тот же день
              if (aptDate.toDateString() === slotDate.toDateString()) {
                const aptHour = aptDate.getHours();
                const aptMinute = aptDate.getMinutes();
                const slotHour = slotDate.getHours();
                const slotMinute = slotDate.getMinutes();

                // Проверяем, что время примерно совпадает (с учетом 15-минутных слотов)
                return (
                  Math.abs(
                    aptHour * 60 + aptMinute - (slotHour * 60 + slotMinute)
                  ) <= 15
                );
              }
              return false;
            });
          }
        }

        slots.push({
          time: isoTime,
          displayTime: format(time, "HH:mm"),
          isBooked,
          isAvailable,
          appointment,
        });
      }
    }

    return slots;
  };

  const timeSlots = getTimeSlots();

  const getServiceLabel = (service: string) => {
    const serviceLabels: Record<string, string> = {
      consultation: "Консультация",
      treatment: "Лечение",
      extraction: "Удаление",
      prosthetics: "Протезирование",
    };
    return serviceLabels[service] || service;
  };

  // Custom calendar tile content to show appointment indicators
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayAppointments = appointments.filter((apt) => {
        const aptDate = format(new Date(apt.start), "yyyy-MM-dd");
        return aptDate === dateStr;
      });

      if (dayAppointments.length > 0) {
        return (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        );
      }
    }
    return null;
  };

  // Custom calendar tile class names
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const isSelected =
        format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
      const isToday =
        format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

      return clsx(
        "relative",
        isSelected && "bg-cyan-100 text-cyan-700 font-semibold",
        isToday && !isSelected && "bg-blue-50 text-blue-700 font-medium"
      );
    }
    return "";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Inline styles to ensure calendar visibility */}
      <style>{`
        .react-calendar__tile {
          color: #111827 !important;
        }
        .react-calendar__tile abbr {
          color: inherit !important;
        }
        .react-calendar__tile:not(.react-calendar__tile--neighboringMonth) {
          color: #111827 !important;
        }
        .react-calendar__tile:not(.react-calendar__tile--neighboringMonth) abbr {
          color: #111827 !important;
        }
      `}</style>

      {/* Заголовок календаря */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-cyan-600" />
          Календарь записей
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Календарь */}
        <div>
          <Calendar
            onChange={(value: any) => {
              if (value instanceof Date) {
                onDateSelect(value);
              }
            }}
            value={selectedDate}
            locale="ru-RU"
            tileContent={tileContent}
            tileClassName={tileClassName}
            formatDay={(_locale: any, date: Date) => format(date, "d")}
            formatShortWeekday={(_locale: any, date: Date) =>
              format(date, "EEEEEE", { locale: ru })
            }
            formatMonth={(_locale: any, date: Date) =>
              format(date, "MMMM yyyy", { locale: ru })
            }
            showNavigation={true}
            showNeighboringMonth={false}
            minDetail="month"
            maxDetail="month"
          />

          {/* Легенда календаря */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Есть записи</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-100 rounded"></div>
              <span className="text-gray-600">Выбранная дата</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-50 rounded"></div>
              <span className="text-gray-600">Сегодня</span>
            </div>
          </div>
        </div>

        {/* Временные слоты для выбранной даты */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Временные слоты на{" "}
              {format(selectedDate, "dd MMMM yyyy", { locale: ru })}
            </h3>
            <button
              onClick={() => {
                // Trigger refetch manually
                if (onRefetch) {
                  onRefetch();
                  toast.success("Данные обновлены!", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                  });
                }
              }}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Обновить данные"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600"></div>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Загрузка доступности...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <div key={slot.time} className="relative">
                  <button
                    onClick={() =>
                      handleSlotInteraction(slot.time, slot.isBooked)
                    }
                    disabled={!slot.isAvailable}
                    onMouseEnter={() => {
                      console.log(
                        "Mouse enter:",
                        slot.time,
                        slot.isBooked,
                        slot.appointment
                      );
                      if (slot.isBooked) {
                        setHoveredSlot(slot.time);
                      }
                    }}
                    onMouseLeave={() => {
                      console.log("Mouse leave:", slot.time);
                      setHoveredSlot(null);
                    }}
                    className={clsx(
                      "p-2 text-xs rounded-md transition-all font-medium w-full relative",
                      slot.isBooked &&
                        "bg-red-100 text-red-700 cursor-pointer hover:bg-red-200",
                      slot.isBooked &&
                        hoveredSlot === slot.time &&
                        "bg-red-300 ring-2 ring-red-500",
                      slot.isAvailable &&
                        "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer",
                      !slot.isAvailable &&
                        !slot.isBooked &&
                        "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                    title={
                      slot.isAvailable
                        ? `Нажмите для создания записи на ${slot.displayTime}`
                        : slot.isBooked
                        ? "Занято - наведите для деталей"
                        : "Недоступно"
                    }
                  >
                    {slot.displayTime}
                    {/* Индикатор записи для занятых слотов */}
                    {slot.isBooked && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </button>

                  {/* Тултип с деталями клиента для занятых слотов */}
                  {(hoveredSlot === slot.time || touchedSlot === slot.time) &&
                    slot.isBooked && (
                      <div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 min-w-[200px] pointer-events-none"
                        style={{
                          zIndex: 9999,
                          filter:
                            "drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))",
                        }}
                      >
                        {slot.appointment ? (
                          <>
                            <div className="text-center mb-2 font-semibold border-b border-gray-700 pb-1">
                              {slot.displayTime} -{" "}
                              {format(new Date(slot.appointment.end), "HH:mm")}
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Пациент:</span>
                                <span className="font-medium">
                                  {slot.appointment.name}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Телефон:</span>
                                <span className="font-medium">
                                  {slot.appointment.phoneNumber}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Услуга:</span>
                                <span className="font-medium">
                                  {getServiceLabel(slot.appointment.service)}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-center mb-2 font-semibold border-b border-gray-700 pb-1">
                              {slot.displayTime} - Занято
                            </div>
                            <div className="text-center text-gray-400">
                              {appointmentsLoading
                                ? "Загрузка деталей..."
                                : "Детали записи не найдены"}
                            </div>
                            <div className="text-center text-gray-400 text-xs mt-1">
                              Попробуйте обновить страницу
                            </div>
                          </>
                        )}
                        {/* Стрелка тултипа */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}

                  {/* Простой тестовый тултип для отладки */}
                  {hoveredSlot === slot.time && slot.isBooked && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded z-50 whitespace-nowrap">
                      Тест:{" "}
                      {slot.appointment ? slot.appointment.name : "Нет данных"}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-blue-600"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Легенда временных слотов */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span className="text-gray-600">Доступно</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded"></div>
              <span className="text-gray-600">
                Занято (наведите/нажмите для деталей)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-gray-600">Недоступно</span>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
        {appointmentsError && (
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <p className="text-xs font-medium text-red-800">
              Ошибка: {JSON.stringify(appointmentsError)}
            </p>
          </div>
        )}

        {/* Debug: Show appointments for current date */}
        <div className="mt-3">
          <p className="text-gray-800 font-semibold mb-2">
            Записи на {format(selectedDate, "dd.MM.yyyy")}:
          </p>
          {appointments
            .filter(
              (apt) =>
                format(new Date(apt.start), "yyyy-MM-dd") ===
                format(selectedDate, "yyyy-MM-dd")
            )
            .map((apt, index) => (
              <div
                key={apt._id}
                className="ml-2 mt-2 p-3 bg-cyan-50 rounded-lg border border-cyan-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <span className="text-sm font-medium text-cyan-800">
                    Запись #{index + 1}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Время:</span>{" "}
                    {format(new Date(apt.start), "HH:mm")} -{" "}
                    {format(new Date(apt.end), "HH:mm")}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Пациент:</span> {apt.name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Услуга:</span>{" "}
                    {getServiceLabel(apt.service)}
                  </p>
                </div>
              </div>
            ))}
          {appointments.filter(
            (apt) =>
              format(new Date(apt.start), "yyyy-MM-dd") ===
              format(selectedDate, "yyyy-MM-dd")
          ).length === 0 && (
            <div className="ml-2 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                На эту дату записей нет
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
