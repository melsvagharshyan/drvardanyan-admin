import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  X,
  Calendar,
  User,
  Phone,
  Stethoscope,
  Save,
  Loader,
} from "lucide-react";
import {
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  type Appointment,
  type ServiceKey,
} from "../../api/api";
import ReactDOM from "react-dom";

interface AppointmentFormProps {
  appointment?: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: Date;
  selectedTime?: string;
  onRefetch?: () => void;
}

interface FormData {
  name: string;
  phoneNumber: string;
  service: ServiceKey;
  start: string;
  tzOffset: number;
}

const serviceOptions: { value: ServiceKey; label: string; duration: number }[] =
  [
    { value: "consultation", label: "Консультация", duration: 15 },
    { value: "treatment", label: "Лечение", duration: 45 },
    { value: "extraction", label: "Удаление", duration: 45 },
    { value: "prosthetics", label: "Протезирование", duration: 45 },
  ];

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
  selectedTime,
  onRefetch,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createAppointment] = useCreateAppointmentMutation();
  const [updateAppointment] = useUpdateAppointmentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      phoneNumber: "",
      service: "consultation",
      start: "",
      tzOffset: new Date().getTimezoneOffset(),
    },
  });

  useEffect(() => {
    if (appointment) {
      reset({
        name: appointment.name,
        phoneNumber: appointment.phoneNumber,
        service: appointment.service,
        start: appointment.start,
        tzOffset: new Date().getTimezoneOffset(),
      });
    } else if (selectedDate && selectedTime) {
      // Auto-fill the date and time from calendar selection
      const startDate = new Date(selectedTime);
      const formattedDateTime = format(startDate, "yyyy-MM-dd'T'HH:mm");
      setValue("start", formattedDateTime);
    }
  }, [appointment, selectedDate, selectedTime, reset, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (appointment) {
        await updateAppointment({ id: appointment._id, body: data }).unwrap();
        alert("Запись успешно обновлена");
      } else {
        await createAppointment(data).unwrap();
        alert("Запись успешно создана");
      }
      onSuccess();
      // Trigger refetch to update calendar data
      if (onRefetch) {
        onRefetch();
      }
      onClose();
      reset();
    } catch (error) {
      console.error("Ошибка при сохранении записи:", error);
      alert("Произошла ошибка при сохранении записи");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{
            animation: "fadeIn 0.3s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-cyan-950 to-cyan-500 text-transparent bg-clip-text">
                {appointment ? "Редактировать запись" : "Новая запись"}
              </h2>
              {selectedDate && selectedTime && !appointment && (
                <p className="text-sm text-cyan-600 mt-1 font-medium">
                  📅{" "}
                  {format(new Date(selectedTime), "dd MMMM yyyy, HH:mm", {
                    locale: ru,
                  })}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Имя пациента */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-600" />
                Имя пациента *
              </label>
              <input
                type="text"
                {...register("name", {
                  required: "Имя обязательно для заполнения",
                })}
                className={`w-full rounded-2xl px-4 py-3 border border-gray-300 shadow-inner focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all duration-300 placeholder:italic placeholder:text-gray-400 ${
                  errors.name ? "border-red-500 bg-red-50" : "bg-white"
                }`}
                placeholder="Введите имя пациента"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Номер телефона */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Phone className="w-5 h-5 text-cyan-600" />
                Номер телефона *
              </label>
              <input
                type="tel"
                {...register("phoneNumber", {
                  required: "Номер телефона обязателен для заполнения",
                  pattern: {
                    value: /^[\+]?[0-9\s\-\(\)]+$/,
                    message: "Введите корректный номер телефона",
                  },
                })}
                className={`w-full rounded-2xl px-4 py-3 border border-gray-300 shadow-inner focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all duration-300 placeholder:italic placeholder:text-gray-400 ${
                  errors.phoneNumber ? "border-red-500 bg-red-50" : "bg-white"
                }`}
                placeholder="+7 (999) 123-45-67"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Услуга */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-cyan-600" />
                Услуга *
              </label>
              <select
                {...register("service", { required: "Выберите услугу" })}
                className="w-full rounded-2xl px-4 py-3 border border-gray-300 shadow-inner focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all duration-300"
              >
                {serviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.duration} мин)
                  </option>
                ))}
              </select>
              {errors.service && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.service.message}
                </p>
              )}
            </div>

            {/* Дата и время */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-600" />
                Дата и время начала *
              </label>
              <input
                type="datetime-local"
                {...register("start", {
                  required: "Дата и время обязательны для заполнения",
                })}
                disabled={!!(selectedDate && selectedTime && !appointment)}
                className={`w-full rounded-2xl px-4 py-3 border border-gray-300 shadow-inner focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all duration-300 ${
                  errors.start ? "border-red-500 bg-red-50" : "bg-white"
                } ${
                  selectedDate && selectedTime && !appointment
                    ? "bg-cyan-50 border-cyan-300 cursor-not-allowed"
                    : ""
                }`}
              />
              {errors.start && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.start.message}
                </p>
              )}
              {selectedDate && selectedTime && !appointment && (
                <div className="mt-2 p-2 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    Дата и время автоматически заполнены из календаря
                  </p>
                </div>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-all duration-300 cursor-pointer font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-200 to-cyan-500 text-white rounded-full hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer font-semibold shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {appointment ? "Обновить" : "Создать"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
};
