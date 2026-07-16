import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import interactionsReducer from './slices/interactionsSlice'
import chatReducer from './slices/chatSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    interactions: interactionsReducer,
    chat: chatReducer,
  },
})
