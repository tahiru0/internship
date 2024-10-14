import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [zIndex, setZIndex] = useState(1000);

  const getNextZIndex = () => {
    setZIndex(prevZIndex => prevZIndex + 1);
    return zIndex + 1;
  };

  return (
    <ModalContext.Provider value={{ zIndex, getNextZIndex }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);