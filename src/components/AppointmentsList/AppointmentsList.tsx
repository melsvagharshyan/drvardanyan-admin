import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Calendar,
  Clock,
  Phone,
  Stethoscope,
} from "lucide-react";
import {
  useGetAppointmentsQuery,
  useDeleteAppointmentMutation,
  type Appointment,
  type ServiceKey,
} from "../../api/api";
import { clsx } from "clsx";
import Select from "react-select";

interface AppointmentsListProps {
  onEditAppointment: (appointment: Appointment) => void;
  onCreateAppointment: () => void;
  onRefetch?: () => void; // Add refetch callback
}

const serviceLabels: Record<ServiceKey, string> = {
  consultation: "Консультация",
  treatment: "Лечение",
  extraction: "Удаление",
  prosthetics: "Протезирование",
};

const serviceColors: Record<ServiceKey, string> = {
  consultation: "bg-blue-100 text-blue-800",
  treatment: "bg-green-100 text-green-800",
  extraction: "bg-red-100 text-red-800",
  prosthetics: "bg-purple-100 text-purple-800",
};

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  onEditAppointment,
  onCreateAppointment,
  onRefetch,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "today" | "upcoming" | "past"
  >("all");
  const [serviceFilter, setServiceFilter] = useState<ServiceKey | "all">("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    "all" | "week" | "month"
  >("all");

  const { data: appointments = [], isLoading } = useGetAppointmentsQuery();
  const [deleteAppointment, { isLoading: isDeleting }] =
    useDeleteAppointmentMutation();

  // Keep your react-select styles unchanged
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: "white",
      borderColor: state.isFocused ? "#06b6d4" : "#9ca3af",
      borderWidth: "2px",
      borderRadius: "12px",
      minHeight: "48px",
      boxShadow: state.isFocused
        ? "0 0 0 3px rgba(6, 182, 212, 0.2)"
        : "0 2px 4px rgba(0, 0, 0, 0.1)",
      "&:hover": {
        borderColor: "#06b6d4",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#06b6d4"
        : state.isFocused
        ? "#e0f2fe"
        : "white",
      color: state.isSelected ? "white" : "#1f2937",
      cursor: "pointer",
      padding: "12px 16px",
      fontSize: "14px",
      fontWeight: state.isSelected ? "600" : "500",
      borderBottom: "1px solid #f3f4f6",
      "&:last-child": { borderBottom: "none" },
    }),
    menu: (provided: any) => ({
      ...provided,
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      boxShadow:
        "0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04)",
      overflow: "hidden",
      marginTop: "4px",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "#1f2937",
      fontWeight: "600",
      fontSize: "14px",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#6b7280",
      fontWeight: "500",
      fontSize: "14px",
    }),
    input: (provided: any) => ({
      ...provided,
      color: "#1f2937",
      fontSize: "14px",
    }),
    indicatorSeparator: (provided: any) => ({ ...provided, display: "none" }),
    dropdownIndicator: (provided: any, state: any) => ({
      ...provided,
      color: state.isFocused ? "#06b6d4" : "#6b7280",
      padding: "8px",
      transition: "all 0.2s ease",
      transform: state.selectProps.menuIsOpen
        ? "rotate(180deg)"
        : "rotate(0deg)",
    }),
    clearIndicator: (provided: any) => ({
      ...provided,
      color: "#ef4444",
      padding: "8px",
      "&:hover": { color: "#dc2626" },
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "#e0f2fe",
      borderRadius: "8px",
      padding: "2px 8px",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: "#06b6d4",
      fontWeight: "600",
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: "#06b6d4",
      "&:hover": { backgroundColor: "#06b6d4", color: "white" },
    }),
  };

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    if (searchTerm) {
      filtered = filtered.filter(
        (appointment) =>
          appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.phoneNumber.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.start);
        const appointmentDay = new Date(
          appointmentDate.getFullYear(),
          appointmentDate.getMonth(),
          appointmentDate.getDate()
        );

        switch (statusFilter) {
          case "today":
            return appointmentDay.getTime() === today.getTime();
          case "upcoming":
            return appointmentDate > now;
          case "past":
            return appointmentDate < now;
          default:
            return true;
        }
      });
    }

    if (serviceFilter !== "all") {
      filtered = filtered.filter(
        (appointment) => appointment.service === serviceFilter
      );
    }

    if (dateRangeFilter !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (dateRangeFilter) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(
        (appointment) => new Date(appointment.start) >= startDate
      );
    }

    return [...filtered].sort(
      (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
    );
  }, [appointments, searchTerm, statusFilter, serviceFilter, dateRangeFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить эту запись?")) {
      try {
        await deleteAppointment(id).unwrap();
        alert("Запись успешно удалена");
        onRefetch?.();
      } catch (error) {
        console.error("Ошибка при удалении записи:", error);
        alert("Произошла ошибка при удалении записи");
      }
    }
  };

  const getStatusBadge = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDate = new Date(appointment.start);

    if (appointmentDate < now) {
      return (
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
          Завершено
        </span>
      );
    } else if (
      appointmentDate.getTime() - now.getTime() <
      24 * 60 * 60 * 1000
    ) {
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
          Сегодня
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
          Предстоящее
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Загрузка записей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Список записей</h2>
        <button
          onClick={onCreateAppointment}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-400 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Новая запись
        </button>
      </div>

      {/* Фильтры */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative text-black">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени или телефону..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-black focus:border-transparent"
          />
        </div>

        <Select
          options={[
            { value: "all", label: "Все статусы" },
            { value: "today", label: "Сегодня" },
            { value: "upcoming", label: "Предстоящие" },
            { value: "past", label: "Завершенные" },
          ]}
          value={{
            value: statusFilter,
            label:
              statusFilter === "all"
                ? "Все статусы"
                : statusFilter === "today"
                ? "Сегодня"
                : statusFilter === "upcoming"
                ? "Предстоящие"
                : "Завершенные",
          }}
          onChange={(option) => setStatusFilter(option?.value as any)}
          className="w-full"
          classNamePrefix="react-select"
          styles={selectStyles}
          isClearable={false}
          isSearchable={false}
          menuPlacement="auto"
          noOptionsMessage={() => "Нет доступных опций"}
        />

        <Select
          options={[
            { value: "all", label: "Все услуги" },
            { value: "consultation", label: "Консультация" },
            { value: "treatment", label: "Лечение" },
            { value: "extraction", label: "Удаление" },
            { value: "prosthetics", label: "Протезирование" },
          ]}
          value={{
            value: serviceFilter,
            label:
              serviceFilter === "all"
                ? "Все услуги"
                : serviceLabels[serviceFilter as ServiceKey],
          }}
          onChange={(option) => setServiceFilter(option?.value as any)}
          className="w-full"
          classNamePrefix="react-select"
          styles={selectStyles}
          isClearable={false}
          isSearchable={false}
          menuPlacement="auto"
          noOptionsMessage={() => "Нет доступных опций"}
        />

        <Select
          options={[
            { value: "all", label: "Все время" },
            { value: "week", label: "Последняя неделя" },
            { value: "month", label: "Последний месяц" },
          ]}
          value={{
            value: dateRangeFilter,
            label:
              dateRangeFilter === "all"
                ? "Все время"
                : dateRangeFilter === "week"
                ? "Последняя неделя"
                : "Последний месяц",
          }}
          onChange={(option) => setDateRangeFilter(option?.value as any)}
          className="w-full"
          classNamePrefix="react-select"
          styles={selectStyles}
          isClearable={false}
          isSearchable={false}
          menuPlacement="auto"
          noOptionsMessage={() => "Нет доступных опций"}
        />
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600">Всего записей</p>
              <p className="text-2xl font-bold text-blue-800">
                {appointments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Предстоящие</p>
              <p className="text-2xl font-bold text-green-800">
                {
                  appointments.filter((a) => new Date(a.start) > new Date())
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600">Сегодня</p>
              <p className="text-2xl font-bold text-yellow-800">
                {
                  appointments.filter((a) => {
                    const today = new Date();
                    const appointmentDate = new Date(a.start);
                    return (
                      today.toDateString() === appointmentDate.toDateString()
                    );
                  }).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Завершенные</p>
              <p className="text-2xl font-bold text-gray-800">
                {
                  appointments.filter((a) => new Date(a.start) < new Date())
                    .length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Список записей - scrollable */}
      <div className="overflow-x-auto max-h-[500px] md:max-h-[600px] overflow-y-auto">
        <table className="min-w-full border-collapse">
          <thead className="hidden md:table-header-group">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Пациент
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Услуга
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Дата и время
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Статус
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {filteredAppointments.map((appointment) => (
              <tr
                key={appointment._id}
                className="block md:table-row border-b border-gray-100 mb-4 md:mb-0 p-3 md:p-0 rounded-lg md:rounded-none bg-white md:bg-transparent shadow md:shadow-none"
              >
                <td className="block md:table-cell py-2 md:py-3 px-3 md:px-4">
                  <p className="font-medium text-gray-900">
                    {appointment.name}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {appointment.phoneNumber}
                  </p>
                </td>
                <td className="block md:table-cell py-2 md:py-3 px-3 md:px-4">
                  <span
                    className={clsx(
                      "px-2 py-1 text-xs rounded-full",
                      serviceColors[appointment.service]
                    )}
                  >
                    {serviceLabels[appointment.service]}
                  </span>
                </td>
                <td className="block md:table-cell py-2 md:py-3 px-3 md:px-4">
                  <p className="font-medium text-gray-900">
                    {format(new Date(appointment.start), "dd MMMM yyyy", {
                      locale: ru,
                    })}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(appointment.start), "HH:mm")}
                  </p>
                </td>
                <td className="block md:table-cell py-2 md:py-3 px-3 md:px-4">
                  {getStatusBadge(appointment)}
                </td>
                <td className="block md:table-cell py-2 md:py-3 px-3 md:px-4 flex gap-2">
                  <button
                    onClick={() => onEditAppointment(appointment)}
                    className="p-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(appointment._id)}
                    className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
