import React, { createContext, useState } from 'react';

export const MaintenanceContext = createContext();

export const MaintenanceProvider = ({ children }) => {
    const [maintenanceMode, setMaintenanceMode] = useState({ isActive: false, message: '' });

    return (
        <MaintenanceContext.Provider value={{ maintenanceMode, setMaintenanceMode }}>
            {children}
        </MaintenanceContext.Provider>
    );
};
