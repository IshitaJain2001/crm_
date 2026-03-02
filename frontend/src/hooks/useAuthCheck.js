import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logout } from "../store/authSlice";

/**
 * Custom hook to check if user/company was deleted
 * Handles logout and redirect if account/company is deleted
 */
export const useAuthCheck = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAuthError = (error) => {
    const errorCode = error.response?.data?.code;
    const errorMsg = error.response?.data?.error;

    // Handle account deletion
    if (errorCode === "ACCOUNT_DELETED") {
      console.warn("Account was deleted");
      toast.error(errorMsg);
      handleLogout();
      return true;
    }

    // Handle company deletion
    if (errorCode === "COMPANY_DELETED") {
      console.warn("Company was deleted");
      toast.error(errorMsg);
      handleLogout();
      return true;
    }

    // Handle general auth errors
    if (error.response?.status === 401) {
      if (
        errorMsg?.includes("token") ||
        errorMsg?.includes("deleted") ||
        errorMsg?.includes("workspace")
      ) {
        handleLogout();
        return true;
      }
    }

    return false;
  };

  const handleLogout = () => {
    // Clear Redux state
    dispatch(logout());

    // Redirect to login
    navigate("/login", { replace: true });
  };

  return { handleAuthError, handleLogout };
};
