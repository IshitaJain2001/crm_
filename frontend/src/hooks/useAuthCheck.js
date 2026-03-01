import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../store/authSlice';

/**
 * Custom hook to check auth state on app load
 * Syncs localStorage with Redux
 */
export const useAuthCheck = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector(state => state.auth);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      // Token exists, verify with Redux
      dispatch(checkAuth());
    } else {
      // No token, ensure Redux is cleared
      dispatch(checkAuth());
    }
  }, [dispatch]);

  return { isAuthenticated, loading };
};
