"use client"

import { useState } from "react"
import { format, addDays } from "date-fns"
import { ArrowLeft, PawPrint, Calendar, Clock } from "lucide-react"
import  Button  from "./ui/Button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select"

export default function FosteringBooking() {
    const [date, setDate] = useState(null)
    const [period, setPeriod] = useState(null)
    const [message, setMessage] = useState("")

    // Generate next 10 days for date options
    const today = new Date()
    const dateOptions = Array.from({ length: 10 }, (_, i) => {
        const day = addDays(today, i)
        return {
            value: day.toISOString(),
            label: format(day, "dd/MM/yyyy"),
        }
    })

    // Generate period options (months)
    const periodOptions = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        return {
            value: month.toString(),
            label: `${month} ${month === 1 ? "lună" : "luni"}`,
        }
    })

    const handleConfirm = () => {
        if (!date || !period) {
            setMessage("Te rugăm să selectezi atât perioada, cât și data de început")
            return
        }
        setMessage(
            `Ai programat adopția pe ${format(new Date(date), "dd/MM/yyyy")} pe o perioadă de ${period} ${period === "1" ? "lună" : "luni"}.`,
        )
    }

    const handleReturn = () => {
        window.history.back()
    }

    return (
        <div className="flex flex-col min-h-screen p-4">

            <div className="flex items-center gap-2 mb-4">
                <PawPrint className="h-6 w-6 text-green-600" />
                <span className="text-xl font-bold">PetPal Fostering</span>
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
                    <h1 className="text-4xl font-bold mb-12 text-center">Programare Fostering</h1>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-base font-medium flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-green-600" />
                                Selectează data de început:
                            </label>
                            <Select value={date} onValueChange={setDate}>
                                <SelectTrigger className="w-full h-14 text-base border-2 border-green-500 focus:ring-green-500">
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
                                Selectează perioada (luni):
                            </label>
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="w-full h-14 text-base border-2 border-green-500 focus:ring-green-500">
                                    <SelectValue placeholder="Alege perioada" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periodOptions.map((option) => (
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

