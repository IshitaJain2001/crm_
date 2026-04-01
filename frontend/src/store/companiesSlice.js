import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../config/api';

export const fetchCompanies = createAsyncThunk(
  'companies/fetchCompanies',
  async ({ page = 1, limit = 20, search = '' }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/api/companies`, {
        params: { page, limit, search },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/createCompany',
  async (companyData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_URL}/api/companies`, companyData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.company;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/updateCompany',
  async ({ id, data }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`${API_URL}/api/companies/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.company;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/deleteCompany',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      await axios.delete(`${API_URL}/api/companies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  companies: [],
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  total: 0
};

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchCompanies.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCompanies.fulfilled, (state, action) => {
      state.loading = false;
      state.companies = action.payload.companies;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
      state.total = action.payload.total;
    });
    builder.addCase(fetchCompanies.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error.message;
    });

    // Create
    builder.addCase(createCompany.fulfilled, (state, action) => {
      state.companies.unshift(action.payload);
    });

    // Update
    builder.addCase(updateCompany.fulfilled, (state, action) => {
      const index = state.companies.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.companies[index] = action.payload;
      }
    });

    // Delete
    builder.addCase(deleteCompany.fulfilled, (state, action) => {
      state.companies = state.companies.filter(c => c._id !== action.payload);
    });
  }
});

export default companiesSlice.reducer;
