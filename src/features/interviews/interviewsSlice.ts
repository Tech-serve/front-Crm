import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

// Если тип у тебя уже описан в другом месте — можешь использовать его.
// Здесь — минимально нужные поля:
export type Interview = {
  _id: string;
  status: "failed" | "not_held" | "success" | string;
  // ... добавь свои поля по необходимости
};

type State = {
  items: Interview[];
  // loading/error — по желанию
};

const initialState: State = { items: [] };

// База API: берем из env, иначе localhost:8080
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

export const saveInterviewStatus = createAsyncThunk<
  { id: string; status: Interview["status"] },
  { id: string; status: Interview["status"] }
>("interviews/saveStatus", async ({ id, status }) => {
  const res = await fetch(`${API_BASE}/interviews/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include", // если нужны cookie — иначе можно убрать
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update status");
  }
  return { id, status };
});

const slice = createSlice({
  name: "interviews",
  initialState,
  reducers: {
    // Оптимистичный апдейт
    setInterviewStatus(state, action: PayloadAction<{ id: string; status: Interview["status"] }>) {
      const it = state.items.find(x => x._id === action.payload.id);
      if (it) it.status = action.payload.status;
    },
    // Если нужно загрузить список в state.items — сделай отдельную санку и редьюсер
    setInterviews(state, action: PayloadAction<Interview[]>) {
      state.items = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(saveInterviewStatus.fulfilled, () => {
        // всё уже изменили оптимистично
      })
      .addCase(saveInterviewStatus.rejected, () => {
        // откат делаем в компоненте через rollback
      });
  },
});

export const { setInterviewStatus, setInterviews } = slice.actions;
export default slice.reducer;