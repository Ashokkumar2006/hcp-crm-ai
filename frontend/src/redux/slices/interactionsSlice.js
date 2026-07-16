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
  async (payload) => {
    const response = await apiClient.post('/interactions/', payload)
    return response.data
  }
)

export const updateInteraction = createAsyncThunk(
  'interactions/update',
  async ({ id, payload }) => {
    const response = await apiClient.put(`/interactions/${id}`, payload)
    return response.data
  }
)

const emptyDraft = {
  hcp_id: null,
  hcp: null, // full HCP object, for display only
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  interaction_type: 'Meeting',
  attendees: [],
  topics_discussed: '',
  sentiment: 'neutral',
  outcomes: '',
  follow_up_actions: [],
  materials: [], // full objects, for display
  samples: [], // full objects, for display
  material_ids: [],
  sample_ids: [],
}

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState: {
    items: [],
    currentDraft: { ...emptyDraft },
    currentInteractionId: null, // set when editing an existing record
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
        date: interaction.date,
        time: interaction.time?.slice(0, 5) || interaction.time,
        interaction_type: interaction.interaction_type,
        attendees: interaction.attendees || [],
        topics_discussed: interaction.topics_discussed || '',
        sentiment: interaction.sentiment,
        outcomes: interaction.outcomes || '',
        follow_up_actions: (interaction.follow_up_actions || []).filter(Boolean),
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
