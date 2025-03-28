import { useState } from "react"
import Button from "./ui/Button"
import { format, startOfWeek, addDays } from "date-fns"
import { ArrowLeft, PawPrint, Calendar, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select"

export default function AdoptionBooking() {
    const [date, setDate] = useState(null)
    const [time, setTime] = useState(null)
    const [message, setMessage] = useState("")

    const start = startOfWeek(new Date(), { weekStQartsOn: 1 })
    const dateOptions = Array.from({ length: 10 }, (_, i) => {
        const day = addDays(start, i)
        return {
            value: day.toISOString(),
            label: format(day, "dd/MM/yyyy"),
        }
    })

    const timeOptions = Array.from({ length: 10 }, (_, i) => {
        const hour = 10 + i
        return {
            value: `${hour}:00`,
            label: `${hour}:00`,
        }
    })

    const handleConfirm = () => {
        if (!date || !time) {
            setMessage("Te rugăm să selectezi atât data, cât și ora adopției.")
            return
        }
        setMessage(`Ai programat adopția pe ${format(new Date(date), "dd/MM/yyyy")} la ${time}.`)
    }

    const handleReturn = () => {
        window.history.back()
    }

    return (
        <div className="flex flex-col min-h-screen p-4">
            <div className="flex items-center gap-2 mb-4">
                <PawPrint className="h-6 w-6 text-green-600" />
                <span className="text-xl font-bold">PetPal Adopții</span>
            </div>

            <div className="mb-8">
                <Button
                    variant="ghost"
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-md"
                    onClick={handleReturn}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Înapoi
                </Button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm p-8">
                    <h1 className="text-4xl font-bold mb-12 text-center">Programare Adopție</h1>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-base font-medium flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-green-600" />
                                Selectează data:
                            </label>
                            <Select value={date} onValueChange={setDate}>
                                <SelectTrigger className="w-full h-14 text-base">
                                    <SelectValue placeholder="Alege o dată" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dateOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-base font-medium flex items-center gap-2">
                                <Clock className="h-5 w-5 text-green-600" />
                                Selectează ora:
                            </label>
                            <Select value={time} onValueChange={setTime}>
                                <SelectTrigger className="w-full h-14 text-base">
                                    <SelectValue placeholder="Alege o oră" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg mt-8"
                            onClick={handleConfirm}
                        >
                            Confirmă programarea
                        </Button>

                        {message && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-center text-lg">
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

