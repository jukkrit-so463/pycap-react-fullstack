// UserContext.js
import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // ลบ citizenId state เพราะไม่ใช้แล้ว
  return (
    <UserContext.Provider value={{}}>
      {children}
    </UserContext.Provider>
  );
};
