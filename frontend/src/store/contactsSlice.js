import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../config/api';

export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async ({ page = 1, limit = 20, search = '' }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/api/contacts`, {
        params: { page, limit, search },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createContact = createAsyncThunk(
  'contacts/createContact',
  async (contactData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_URL}/api/contacts`, contactData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.contact;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateContact = createAsyncThunk(
  'contacts/updateContact',
  async ({ id, data }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`${API_URL}/api/contacts/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.contact;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteContact = createAsyncThunk(
  'contacts/deleteContact',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      await axios.delete(`${API_URL}/api/contacts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  contacts: [],
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  total: 0
};

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchContacts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchContacts.fulfilled, (state, action) => {
      state.loading = false;
      state.contacts = action.payload.contacts;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
      state.total = action.payload.total;
    });
    builder.addCase(fetchContacts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error.message;
    });

    // Create
    builder.addCase(createContact.fulfilled, (state, action) => {
      state.contacts.unshift(action.payload);
    });

    // Update
    builder.addCase(updateContact.fulfilled, (state, action) => {
      const index = state.contacts.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.contacts[index] = action.payload;
      }
    });

    // Delete
    builder.addCase(deleteContact.fulfilled, (state, action) => {
      state.contacts = state.contacts.filter(c => c._id !== action.payload);
    });
  }
});

export default contactsSlice.reducer;
