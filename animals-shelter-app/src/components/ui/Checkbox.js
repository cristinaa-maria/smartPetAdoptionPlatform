import { useState, createContext, useContext } from "react"

// Checkbox components
const CheckboxContext = createContext({})

const Checkbox = ({ children, checked = false, onCheckedChange, id, className = "" }) => {
    const [isChecked, setIsChecked] = useState(checked)

    console.log("Checkbox render - received checked:", checked)

    const handleCheckedChange = (newChecked) => {
        console.log("Checkbox handleCheckedChange called with:", newChecked)
        setIsChecked(newChecked)
        if (onCheckedChange) {
            onCheckedChange(newChecked)
        }
    }

    const toggleChecked = () => {
        const newChecked = !isChecked
        handleCheckedChange(newChecked)
    }

    return (
        <CheckboxContext.Provider
            value={{
                checked: isChecked,
                onCheckedChange: handleCheckedChange,
                id,
            }}
        >
            <div className={`inline-flex items-center ${className}`}>
                <button
                    id={id}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={toggleChecked}
                    className={`
                        w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200
                        ${isChecked
                        ? "bg-green-600 border-green-600 text-white"
                        : "bg-white border-gray-300 hover:border-green-500"
                    }
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    `}
                >
                    {isChecked && (
                        <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </button>
                {children}
            </div>
        </CheckboxContext.Provider>
    )
}

const CheckboxLabel = ({ children, className = "" }) => {
    const { id } = useContext(CheckboxContext)

    return (
        <label
            htmlFor={id}
            className={`ml-2 text-sm font-medium text-gray-900 cursor-pointer select-none ${className}`}
        >
            {children}
        </label>
    )
}

const CheckboxIndicator = ({ className = "" }) => {
    const { checked } = useContext(CheckboxContext)

    if (!checked) return null

    return (
        <div className={`ml-2 ${className}`}>
            <svg
                className="w-4 h-4 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                />
            </svg>
        </div>
    )
}

// Export all components
export { Checkbox, CheckboxLabel, CheckboxIndicator }

// Usage example:
// export default function CheckboxExample() {
//     const [adoptionTypes, setAdoptionTypes] = useState({
//         adoptie_permanenta: false,
//         foster: false,
//         adoptie_la_distanta: false,
//     })
//
//     const handleAdoptionTypeChange = (type, checked) => {
//         setAdoptionTypes(prev => ({
//             ...prev,
//             [type]: checked
//         }))
//     }
//
//     return (
//         <div className="space-y-3">
//             <Checkbox
//                 id="adoptie_permanenta"
//                 checked={adoptionTypes.adoptie_permanenta}
//                 onCheckedChange={(checked) => handleAdoptionTypeChange("adoptie_permanenta", checked)}
//             >
//                 <CheckboxLabel>Adopție permanentă</CheckboxLabel>
//                 <CheckboxIndicator />
//             </Checkbox>
//
//             <Checkbox
//                 id="foster"
//                 checked={adoptionTypes.foster}
//                 onCheckedChange={(checked) => handleAdoptionTypeChange("foster", checked)}
//             >
//                 <CheckboxLabel>Foster</CheckboxLabel>
//                 <CheckboxIndicator />
//             </Checkbox>
//
//             <Checkbox
//                 id="adoptie_la_distanta"
//                 checked={adoptionTypes.adoptie_la_distanta}
//                 onCheckedChange={(checked) => handleAdoptionTypeChange("adoptie_la_distanta", checked)}
//             >
//                 <CheckboxLabel>Adopție la distanță</CheckboxLabel>
//                 <CheckboxIndicator />
//             </Checkbox>
//         </div>
//     )
// }