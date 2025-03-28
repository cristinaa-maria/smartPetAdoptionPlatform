import React from 'react';

const Textarea = ({ className, ...props }) => {
    return (
        <textarea
            className={`
        w-full px-3 py-2 
        border border-gray-300 rounded-md
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
        placeholder-gray-400
        resize-vertical
        min-h-[80px]
        text-sm
        transition duration-200
        disabled:bg-gray-50 disabled:cursor-not-allowed
        ${className}
      `}
            {...props}
        />
    );
};

export default Textarea;