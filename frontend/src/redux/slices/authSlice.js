import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    repId: null,
    name: null,
    token: null,
    isAuthenticated: false,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { repId, name, token } = action.payload
      state.repId = repId
      state.name = name
      state.token = token
      state.isAuthenticated = true
      window.__AUTH_TOKEN__ = token // used by axiosClient interceptor
    },
    logout: (state) => {
      state.repId = null
      state.name = null
      state.token = null
      state.isAuthenticated = false
      window.__AUTH_TOKEN__ = null
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
