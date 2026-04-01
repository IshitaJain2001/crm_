import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://crm-1-5el5.onrender.com';

export const fetchDeals = createAsyncThunk(
  'deals/fetchDeals',
  async ({ page = 1, limit = 20, status = '', stage = '' }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/api/deals`, {
        params: { page, limit, status, stage },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createDeal = createAsyncThunk(
  'deals/createDeal',
  async (dealData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_URL}/api/deals`, dealData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.deal;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateDeal = createAsyncThunk(
  'deals/updateDeal',
  async ({ id, data }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`${API_URL}/api/deals/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.deal;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteDeal = createAsyncThunk(
  'deals/deleteDeal',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      await axios.delete(`${API_URL}/api/deals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  deals: [],
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  total: 0
};

const dealsSlice = createSlice({
  name: 'deals',
  initialState,
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchDeals.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDeals.fulfilled, (state, action) => {
      state.loading = false;
      state.deals = action.payload.deals;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
      state.total = action.payload.total;
    });
    builder.addCase(fetchDeals.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error.message;
    });

    // Create
    builder.addCase(createDeal.fulfilled, (state, action) => {
      state.deals.unshift(action.payload);
    });

    // Update
    builder.addCase(updateDeal.fulfilled, (state, action) => {
      const index = state.deals.findIndex(d => d._id === action.payload._id);
      if (index !== -1) {
        state.deals[index] = action.payload;
      }
    });

    // Delete
    builder.addCase(deleteDeal.fulfilled, (state, action) => {
      state.deals = state.deals.filter(d => d._id !== action.payload);
    });
  }
});

export default dealsSlice.reducer;
