import React, { useEffect, useRef, useState } from 'react';

export const Slider = ({
                           min = 0,
                           max = 100,
                           step = 1,
                           value = [0],
                           onValueChange,
                           className = '',
                           ...props
                       }) => {
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef(null);
    const currentValue = value[0];

    const calculatePosition = (clientX) => {
        const rect = sliderRef.current.getBoundingClientRect();
        const position = ((clientX - rect.left) / rect.width) * (max - min);
        const snapped = Math.round(position / step) * step;
        return Math.max(min, Math.min(max, snapped));
    };

    const handleMove = (clientX) => {
        const newValue = calculatePosition(clientX);
        onValueChange([newValue]);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleMove(e.clientX);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            handleMove(e.clientX);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const percentage = ((currentValue - min) / (max - min)) * 100;

    return (
        <div
            ref={sliderRef}
            className={`
        relative w-full h-5 flex items-center cursor-pointer
        ${className}
      `}
            onMouseDown={handleMouseDown}
            {...props}
        >
            {/* Track background */}
            <div className="absolute w-full h-2 bg-gray-200 rounded-full" />

            {/* Active track */}
            <div
                className="absolute h-2 bg-green-500 rounded-full"
                style={{ width: `${percentage}%` }}
            />

            {/* Thumb */}
            <div
                className={`
          absolute w-5 h-5 rounded-full bg-white border-2 border-green-500
          transform -translate-x-1/2 transition-shadow
          hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
          ${isDragging ? 'shadow-lg scale-110' : ''}
        `}
                style={{ left: `${percentage}%` }}
                role="slider"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={currentValue}
                tabIndex={0}
            />
        </div>
    );
};

export default Slider;