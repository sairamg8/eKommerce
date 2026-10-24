import {
  isFulfilled,
  isRejectedWithValue,
  type Middleware,
} from "@reduxjs/toolkit";
import { trigger_toast } from "./ToastContext";

const rtk_error_middleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const payload = action.payload as {
      status: number | string;
      data: {
        message: string;
      };
    };
    trigger_toast(payload.data?.message, "error");
  }

  if (isFulfilled(action)) {
    const payload = action.payload as {
      message: string;
    };

    trigger_toast(payload?.message);
  }

  return next(action);
};

export default rtk_error_middleware;
