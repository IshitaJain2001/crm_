import axios from "axios";
import store from "../store";
import { logout } from "../store/authSlice";

/**
 * Setup axios interceptor to handle auth errors globally
 * Automatically logs out user if account/company is deleted
 */
export const setupAxiosInterceptors = () => {
  // Response interceptor
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // Check if 401 error (unauthorized)
      if (error.response?.status === 401) {
        const errorCode = error.response?.data?.code;
        const errorMsg = error.response?.data?.error;

        // Account deleted
        if (errorCode === "ACCOUNT_DELETED") {
          console.warn("Account was deleted - logging out");
          store.dispatch(logout());
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Company deleted
        if (errorCode === "COMPANY_DELETED") {
          console.warn("Company was deleted - logging out");
          store.dispatch(logout());
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Generic 401 - check for deletion keywords
        if (
          errorMsg?.includes("deleted") ||
          errorMsg?.includes("workspace")
        ) {
          console.warn("Auth error detected - logging out");
          store.dispatch(logout());
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );
};
