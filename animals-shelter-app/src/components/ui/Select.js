import React, { createContext, useContext, useState } from 'react';

const SelectContext = createContext({});

export const Select = ({ children, onValueChange, value }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <SelectContext.Provider value={{ isOpen, setIsOpen, value, onValueChange }}>
            {children}
        </SelectContext.Provider>
    );
};

export const SelectTrigger = ({ children, id }) => {
    const { isOpen, setIsOpen } = useContext(SelectContext);

    return (
        <button
            id={id}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`
        w-full px-3 py-2 text-left
        border rounded-md shadow-sm
        bg-white hover:bg-gray-50
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        ${isOpen ? 'ring-2 ring-green-500 border-green-500' : 'border-gray-300'}
      `}
        >
            {children}
        </button>
    );
};

export const SelectContent = ({ children }) => {
    const { isOpen, setIsOpen } = useContext(SelectContext);

    if (!isOpen) return null;

    return (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
            <div className="py-1">{children}</div>
        </div>
    );
};

export const SelectItem = ({ children, value }) => {
    const { onValueChange, value: selectedValue, setIsOpen } = useContext(SelectContext);

    return (
        <div
            onClick={() => {
                onValueChange(value);
                setIsOpen(false);
            }}
            className={`
        px-3 py-2 cursor-pointer
        hover:bg-gray-100
        ${selectedValue === value ? 'bg-green-50 text-green-700' : 'text-gray-900'}
      `}
        >
            {children}
        </div>
    );
};

export const SelectValue = ({ placeholder }) => {
    const { value } = useContext(SelectContext);

    return <span>{value === 'all' ? placeholder : value}</span>;
};
export default {Select, SelectContent, SelectItem, SelectTrigger, SelectValue };