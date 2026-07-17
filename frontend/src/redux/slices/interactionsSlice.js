import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../api/axiosClient'

export const fetchInteractions = createAsyncThunk(
  'interactions/fetchAll',
  async (repId) => {
    const response = await apiClient.get('/interactions/', { params: { rep_id: repId } })
    return response.data
  }
)

export const fetchInteractionById = createAsyncThunk(
  'interactions/fetchOne',
  async (id) => {
    const response = await apiClient.get(`/interactions/${id}`)
    return response.data
  }
)

export const createInteraction = createAsyncThunk(
  'interactions/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/interactions/', payload)
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: err.message })
    }
  }
)

export const updateInteraction = createAsyncThunk(
  'interactions/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/interactions/${id}`, payload)
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: err.message })
    }
  }
)

const emptyDraft = {
  hcp_id: null,
  hcp: null,
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  interaction_type: 'Meeting',
  attendees: [],
  topics_discussed: '',
  sentiment: 'neutral',
  outcomes: '',
  follow_up_actions: [],
  materials: [],
  samples: [],
  material_ids: [],
  sample_ids: [],
}

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState: {
    items: [],
    currentDraft: { ...emptyDraft },
    currentInteractionId: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    updateDraftField: (state, action) => {
      const { field, value } = action.payload
      state.currentDraft[field] = value
    },
    resetDraft: (state) => {
      state.currentDraft = { ...emptyDraft }
      state.currentInteractionId = null
    },
    setDraftFromInteraction: (state, action) => {
      const interaction = action.payload
      state.currentInteractionId = interaction.id
      state.currentDraft = {
        ...state.currentDraft,
        hcp_id: interaction.hcp_id,
        hcp: interaction.hcp || null,
        date: interaction.date,
        time: interaction.time?.slice(0, 5) || interaction.time,
        interaction_type: interaction.interaction_type,
        attendees: interaction.attendees || [],
        topics_discussed: interaction.topics_discussed || '',
        sentiment: interaction.sentiment,
        outcomes: interaction.outcomes || '',
        follow_up_actions: (interaction.follow_up_actions || []).filter(Boolean),
        materials: interaction.materials || [],
        samples: interaction.samples || [],
        material_ids: (interaction.materials || []).map((m) => m.id),
        sample_ids: (interaction.samples || []).map((s) => s.id),
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(fetchInteractionById.fulfilled, (state, action) => {
        interactionsSlice.caseReducers.setDraftFromInteraction(state, action)
      })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateInteraction.fulfilled, (state, action) => {
        const index = state.items.findIndex((i) => i.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
  },
})

export const { updateDraftField, resetDraft, setDraftFromInteraction } = interactionsSlice.actions
export default interactionsSlice.reducer