import { useState, createContext, useContext } from "react"

// Select components
const SelectContext = createContext({})

const Select = ({ children, onValueChange, value }) => {
    const [isOpen, setIsOpen] = useState(false)

    console.log("Select render - received value:", value)

    const handleValueChange = (newValue) => {
        console.log("Select handleValueChange called with:", newValue)
        if (onValueChange) {
            onValueChange(newValue)
        }
        setIsOpen(false)
    }

    return (
        <SelectContext.Provider
            value={{
                isOpen,
                setIsOpen,
                value: value || "",
                onValueChange: handleValueChange,
            }}
        >
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

const SelectTrigger = ({ children, id, className = "" }) => {
    const { isOpen, setIsOpen } = useContext(SelectContext)

    return (
        <button
            id={id}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-3 py-2 text-left border-2 border-green-500 rounded-none shadow-sm flex items-center justify-between bg-white hover:bg-gray-50 ${className}`}
            style={{ height: "40px", minHeight: "40px" }}
        >
            <div className="flex-1 text-left overflow-hidden">{children}</div>
            <svg className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    )
}

const SelectContent = ({ children, className = "" }) => {
    const { isOpen } = useContext(SelectContext)

    if (!isOpen) return null

    return (
        <div className={`absolute left-0 top-full w-full bg-white border-2 border-green-500 shadow-md z-50 max-h-48 overflow-y-auto ${className}`}>
            <div className="py-1">{children}</div>
        </div>
    )
}

const SelectItem = ({ children, value, className = "" }) => {
    const { onValueChange, value: selectedValue } = useContext(SelectContext)

    const handleClick = () => {
        console.log("SelectItem clicked with value:", value)
        if (onValueChange) {
            onValueChange(value)
        }
    }

    return (
        <div
            onClick={handleClick}
            className={`px-4 py-2 cursor-pointer hover:bg-green-50 ${
                selectedValue === value ? "bg-green-100 text-green-700 font-semibold" : "text-gray-900"
            } ${className}`}
        >
            {children}
        </div>
    )
}

const SelectValue = ({ placeholder }) => {
    const { value } = useContext(SelectContext)

    console.log("SelectValue rendering with value:", value)

    const valueMap = {
        "technical": "Probleme tehnice",
        "account": "Probleme cu contul",
        "adoption": "Probleme cu procesul de adopție",
        "chatbot": "Probleme cu asistentul virtual",
        "other": "Altă problemă",
    }

    if (!value || value === "") {
        return <span className="text-gray-400">{placeholder}</span>
    }

    const displayText = valueMap[value] || value
    console.log("SelectValue display text:", displayText)

    return <span className="text-gray-900 font-medium">{displayText}</span>
}

// Export toate componentele
export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }

// Exemplu de utilizare:
// export default function SelectExample() {
//     const [selectedValue, setSelectedValue] = useState("")
//
//     return (
//         <div className="space-y-2">
//             <label htmlFor="category">Categoria problemei *</label>
//             <Select value={selectedValue} onValueChange={setSelectedValue}>
//                 <SelectTrigger id="category">
//                     <SelectValue placeholder="Selectați categoria" />
//                 </SelectTrigger>
//                 <SelectContent>
//                     <SelectItem value="technical">Probleme tehnice</SelectItem>
//                     <SelectItem value="account">Probleme cu contul</SelectItem>
//                     <SelectItem value="adoption">Probleme cu procesul de adopție</SelectItem>
//                     <SelectItem value="chatbot">Probleme cu asistentul virtual</SelectItem>
//                     <SelectItem value="other">Altă problemă</SelectItem>
//                 </SelectContent>
//             </Select>
//         </div>
//     )
// }