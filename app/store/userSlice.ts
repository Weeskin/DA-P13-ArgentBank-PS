import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface UserData {
  firstName: string;
  lastName: string;
  userName: string;
}

interface UserState {
  userData: UserData;
}

const initialState: UserState = {
  userData: {
    firstName: "",
    lastName: "",
    userName: "",
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserData(state, action: PayloadAction<UserData>) {
      state.userData = action.payload;
    },
    setUserName(state, action: PayloadAction<string>) {
      state.userData.userName = action.payload;
    },
    clearUserData(state) {
      state.userData = initialState.userData;
    },
  },
});

export const { setUserData, setUserName, clearUserData } = userSlice.actions;
export default userSlice.reducer;
