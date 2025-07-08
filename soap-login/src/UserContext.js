// UserContext.js
import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [citizenId, setCitizenId] = useState(null);

  return (
    <UserContext.Provider value={{ citizenId, setCitizenId }}>
      {children}
    </UserContext.Provider>
  );
};
