import type { AxiosError } from "axios";
import axios from "axios";
import { toast } from "sonner";

export const showPrettyError = (error: Error) => {
  const isAxiosError = axios.isAxiosError(error);
  if (isAxiosError) {
    const axiosError = error as AxiosError<{
      errors: Record<string, string[]>;
      message: string;
    }>;
    if (axiosError.response?.data?.errors) {
      const errors = [];
      Object.entries(axiosError.response.data.errors).forEach(
        ([key, value]) => {
          errors.push(`${key}: ${value}`);
        },
      );
      toast.error(
        axiosError?.response?.data?.message ?? "Something went wrong",
        {
          description: errors.join(", "),
        },
      );
    } else if (axiosError.response?.data?.message) {
      toast.error(axiosError.response.data.message);
    } else {
      toast.error(axiosError.message);
    }
  } else {
    toast.error(error.message);
  }
};
