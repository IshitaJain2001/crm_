import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import contactsReducer from './contactsSlice';
import companiesReducer from './companiesSlice';
import dealsReducer from './dealsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    contacts: contactsReducer,
    companies: companiesReducer,
    deals: dealsReducer
  }
});

export default store;
