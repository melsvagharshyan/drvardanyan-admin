import React, { useState, useEffect } from "react";
import { CalendarComponent } from "../Calendar/Calendar";
import { AppointmentsList } from "../AppointmentsList/AppointmentsList";
import { AppointmentForm } from "../AppointmentForm/AppointmentForm";
import type { Appointment } from "../../api/api";
import { CalendarDays, List, Settings } from "lucide-react";
import {
  useGetAppointmentsQuery,
  useGetAvailabilityQuery,
} from "../../api/api"; // Import both hooks
import { format } from "date-fns";

type TabType = "calendar" | "list" | "analytics";

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<
    string | undefined
  >();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<
    Appointment | undefined
  >();

  // Get appointments data for refetching
  const { refetch: refetchAppointments } = useGetAppointmentsQuery();
  const { refetch: refetchAvailability } = useGetAvailabilityQuery({
    date: format(selectedDate, "yyyy-MM-dd"),
    tzOffset: new Date().getTimezoneOffset(),
  });

  // Refetch availability when selectedDate changes
  useEffect(() => {
    refetchAvailability();
  }, [selectedDate, refetchAvailability]);

  // Refetch all data when component mounts
  useEffect(() => {
    refetchAppointments();
    refetchAvailability();
  }, [refetchAppointments, refetchAvailability]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setIsFormOpen(true);
  };

  const handleCreateAppointment = () => {
    setEditingAppointment(undefined);
    setSelectedTimeSlot(undefined);
    setIsFormOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    // Форма будет закрыта автоматически
    setEditingAppointment(undefined);
    setSelectedTimeSlot(undefined);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAppointment(undefined);
    setSelectedTimeSlot(undefined);
  };

  // Function to refetch all data after appointment changes
  const handleRefetch = () => {
    refetchAppointments();
    refetchAvailability();
  };

  const tabs = [
    {
      id: "calendar" as TabType,
      label: "Календарь",
      icon: CalendarDays,
      description: "Просмотр доступности и управление записями по дням",
    },
    {
      id: "list" as TabType,
      label: "Список записей",
      icon: List,
      description: "Все записи с фильтрацией и поиском",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 py-2 sm:py-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Панель администратора
              </h1>
              <span className="mt-2 sm:mt-0 sm:ml-3 px-3 py-1 text-sm bg-cyan-100 text-black rounded-full">
                Dr. Vardanyan
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Навигация по вкладкам */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer
                    ${
                      activeTab === tab.id
                        ? "border-cyan-500 text-cyan-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Описание активной вкладки */}
        <div className="mb-6">
          <p className="text-gray-600">
            {tabs.find((tab) => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Контент вкладок */}
        {activeTab === "calendar" && (
          <div className="space-y-6">
            <CalendarComponent
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onTimeSlotSelect={handleTimeSlotSelect}
              onRefetch={handleRefetch}
            />
          </div>
        )}

        {activeTab === "list" && (
          <AppointmentsList
            onEditAppointment={handleEditAppointment}
            onCreateAppointment={handleCreateAppointment}
            onRefetch={handleRefetch}
          />
        )}
      </main>

      {/* Модальное окно формы записи */}
      <AppointmentForm
        appointment={editingAppointment}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        selectedDate={selectedDate}
        selectedTime={selectedTimeSlot}
        onRefetch={handleRefetch}
      />
    </div>
  );
};
