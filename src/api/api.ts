import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type ServiceKey =
  | "consultation"
  | "treatment"
  | "extraction"
  | "prosthetics";

export interface Appointment {
  _id: string;
  name: string;
  phoneNumber: string;
  service: ServiceKey;
  start: string;
  end: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityResponse {
  availableSlots: string[];
  busySlots: string[];
  workingSlots: string[];
}

export interface CreateAppointmentRequest {
  name: string;
  phoneNumber: string;
  service: ServiceKey;
  start: string;
  tzOffset?: number;
}

export interface UpdateAppointmentRequest {
  name?: string;
  phoneNumber?: string;
  service?: ServiceKey;
  start?: string;
  tzOffset?: number;
}

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
  }),
  tagTypes: ["Appointments"],
  endpoints: (builder) => ({
    // Получить все записи
    getAppointments: builder.query<Appointment[], void>({
      query: () => "appointments",
      providesTags: ["Appointments"],
    }),

    // Получить доступность для конкретной даты
    getAvailability: builder.query<
      AvailabilityResponse,
      { date: string; service?: ServiceKey; tzOffset?: number }
    >({
      query: ({ date, service, tzOffset }) => ({
        url: "appointments/availability",
        params: { date, service, tzOffset },
      }),
    }),

    // Создать новую запись
    createAppointment: builder.mutation<Appointment, CreateAppointmentRequest>({
      query: (body) => ({
        url: "appointments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointments"],
    }),

    // Обновить запись
    updateAppointment: builder.mutation<
      Appointment,
      { id: string; body: UpdateAppointmentRequest }
    >({
      query: ({ id, body }) => ({
        url: `appointments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Appointments"],
    }),

    // Удалить запись
    deleteAppointment: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `appointments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments"],
    }),
  }),
});

export const {
  useGetAppointmentsQuery,
  useGetAvailabilityQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
} = api;
