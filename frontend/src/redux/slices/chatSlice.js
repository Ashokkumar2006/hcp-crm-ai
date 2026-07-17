import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../api/axiosClient'

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, repId, interactionId }) => {
    const response = await apiClient.post('/agent/chat', {
      message,
      rep_id: repId,
      interaction_id: interactionId || null,
    })
    return response.data
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    activeInteractionId: null,
    lastFollowups: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    addUserMessage: (state, action) => {
      state.messages.push({ role: 'user', content: action.payload })
    },
    clearChat: (state) => {
      state.messages = []
      state.activeInteractionId = null
    },
    setActiveInteractionId: (state, action) => {
      state.activeInteractionId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.messages.push({ role: 'assistant', content: action.payload.response })
        if (action.payload.interaction_id) {
          state.activeInteractionId = action.payload.interaction_id
        }
        if (action.payload.tool_result?.followups) {
          state.lastFollowups = action.payload.tool_result.followups
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
        state.messages.push({
          role: 'assistant',
          content: "Sorry, I couldn't process that. Please try again.",
        })
      })
  },
})

export const { addUserMessage, clearChat, setActiveInteractionId } = chatSlice.actions
export default chatSlice.reducer