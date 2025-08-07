import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "src/types/domain";

type AuthState = {
  user: User | null;
  inited: boolean;
};

const initialState: AuthState = { user: null, inited: false };
const API = import.meta.env.VITE_API_BASE as string;

export const authMe = createAsyncThunk<User>(
  "auth/me",
  async () => {
    const r = await fetch(`${API}/auth/me`, { credentials: "include" });
    if (!r.ok) throw new Error("unauth");
    const { user } = await r.json();
    return user as User;
  }
);

export const loginByEmail = createAsyncThunk<User, string>(
  "auth/loginByEmail",
  async (email) => {
    const r = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    if (!r.ok) throw new Error("bad credentials");
    const { user } = await r.json();
    return user as User;
  }
);

export const logout = createAsyncThunk<void>(
  "auth/logout",
  async () => {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
  }
);

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(authMe.fulfilled, (s, a) => { s.user = a.payload; s.inited = true; });
    b.addCase(authMe.rejected,  (s)     => { s.user = null;      s.inited = true; });

    b.addCase(loginByEmail.fulfilled, (s, a) => { s.user = a.payload; });
    b.addCase(logout.fulfilled,       (s)     => { s.user = null;      });
  },
});

export default slice.reducer;