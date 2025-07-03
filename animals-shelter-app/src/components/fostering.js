import { useState, useEffect } from "react"
import { format, addDays, parseISO } from "date-fns"
import { ArrowLeft } from "lucide-react"

const normalizeSpecies = (species) => {
    if (!species) return species

    const lowerSpecies = species.toLowerCase().trim()

    if (lowerSpecies.includes("catel") || lowerSpecies.includes("dog") || lowerSpecies.includes("caine")) {
        return "Caine"
    }

    if (lowerSpecies.includes("pisica") || lowerSpecies.includes("cat")) {
        return "Pisica"
    }

    return species
}

const normalizeUserType = (type) => {
    if (!type) return type

    const lowerType = type.toLowerCase().trim()

    if (
        lowerType.includes("individual") ||
        lowerType.includes("person") ||
        lowerType.includes("persoana") ||
        lowerType.includes("fizica")
    ) {
        return "Persoana individuala"
    }

    if (
        lowerType.includes("shelter") ||
        lowerType.includes("adapost") ||
        lowerType.includes("organizatie") ||
        lowerType.includes("organization")
    ) {
        return "Adapost"
    }

    return type
}

export default function FosteringBooking() {
    const [animalId, setAnimalId] = useState(null)
    const [date, setDate] = useState(null)
    const [period, setPeriod] = useState(null)
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [adopterId, setAdopterId] = useState(null)
    const [userId, setUserId] = useState(null)
    const [dataLoading, setDataLoading] = useState(true)
    const [error, setError] = useState(null)
    const [animalDetails, setAnimalDetails] = useState(null)
    const [ownerInfo, setOwnerInfo] = useState(null) // Changed from ownerName to ownerInfo

    const API_BASE_URL = "http://localhost:8083"

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const id = urlParams.get("animalId")
        console.log("Extracted animalId from URL:", id)
        setAnimalId(id)
    }, [])

    useEffect(() => {
        const fetchRequiredData = async () => {
            setDataLoading(true)
            try {
                const userResponse = await fetch(`${API_BASE_URL}/currentUserId`, {
                    method: "GET",
                    credentials: "include",
                    headers: { Accept: "application/json" },
                })

                if (!userResponse.ok) throw new Error("Failed to get current user information")

                const currentUserId = await userResponse.text()
                console.log("Current user ID (adopterId):", currentUserId)
                setAdopterId(currentUserId)

                const animalResponse = await fetch(`${API_BASE_URL}/animalInfo/${animalId}`, {
                    method: "GET",
                    credentials: "include",
                    headers: { Accept: "application/json" },
                })

                if (!animalResponse.ok) throw new Error("Failed to fetch animal information")

                const animal = await animalResponse.json()
                console.log("Fetched animal:", animal)
                setAnimalDetails(animal)
                setUserId(animal.userId)

                if (animal.userId) {
                    try {
                        const ownerResponse = await fetch(`${API_BASE_URL}/users/${animal.userId}`, {
                            method: "GET",
                            credentials: "include",
                            headers: { Accept: "application/json" },
                        })

                        if (ownerResponse.ok) {
                            const ownerData = await ownerResponse.json()
                            console.log("Owner data:", ownerData)
                            setOwnerInfo({
                                name: ownerData.name,
                                type: ownerData.type,
                            })
                        } else {
                            console.error("Failed to fetch owner information:", ownerResponse.status)
                        }
                    } catch (ownerError) {
                        console.error("Error fetching owner information:", ownerError)
                    }
                }

                setError(null)
            } catch (err) {
                console.error("Error fetching required data:", err)
                setError("Nu s-au putut încărca datele necesare. Te rugăm să încerci din nou.")
            } finally {
                setDataLoading(false)
            }
        }

        if (animalId) fetchRequiredData()
        else {
            setError("ID-ul animalului lipsește. Te rugăm să te întorci și să încerci din nou.")
            setDataLoading(false)
        }
    }, [animalId])

    const today = new Date()
    const dateOptions = Array.from({ length: 14 }, (_, i) => {
        const day = addDays(today, i)
        return {
            value: day.toISOString(),
            label: format(day, "dd/MM/yyyy"),
            dayName: format(day, "EEEE"), // Add day name for better UX
        }
    })

    const periodOptions = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        return { value: month.toString(), label: `${month} ${month === 1 ? "lună" : "luni"}` }
    })

    const handleConfirm = async () => {
        if (!date || !period) {
            setMessage("Te rugăm să selectezi atât data de început, cât și perioada fostering-ului.")
            return
        }

        if (!adopterId || !userId) {
            setMessage("Informațiile despre utilizator sau animal lipsesc. Te rugăm să încerci din nou.")
            return
        }

        setIsLoading(true)

        try {
            const selectedDate = parseISO(date)

            const fosteringDTO = {
                adopterId,
                userId,
                animalId,
                status: "initializat",
                type: "fostering",
                fosteringStartDate: format(selectedDate, "yyyy-MM-dd"),
                period: period,
            }

            console.log("Sending fostering request:", fosteringDTO)

            const response = await fetch(`${API_BASE_URL}/scheduleAdoption`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(fosteringDTO),
                credentials: "include",
            })

            if (response.ok) {
                console.log("Fostering scheduled successfully")
                setMessage(
                    `Ai programat fostering-ul pe ${format(selectedDate, "dd/MM/yyyy")} pentru o perioadă de ${period} ${
                        period === "1" ? "lună" : "luni"
                    }.`,
                )
            } else {
                const errorText = await response.text()
                console.error("Server error response:", errorText)
                setMessage("A apărut o eroare la programarea fostering-ului. Te rugăm să încerci din nou.")
            }
        } catch (error) {
            console.error("Error scheduling fostering:", error)
            setMessage("A apărut o eroare la programarea fostering-ului. Te rugăm să încerci din nou.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleReturn = () => {
        window.history.back()
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex items-center gap-2 p-4 bg-white shadow-sm">
                <ArrowLeft className="h-6 w-6 text-green-600 cursor-pointer" onClick={handleReturn} />
                <span className="text-lg sm:text-xl font-bold">PetPal Foster</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-2xl">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12 text-center">Programare Fostering</h1>

                    {dataLoading ? (
                        <div className="text-center py-8">
                            <p className="text-lg text-gray-600">Se încarcă datele...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-center">{error}</div>
                    ) : (
                        <div className="space-y-8">
                            {animalDetails && (
                                <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-md">
                                    <h2 className="text-lg sm:text-xl font-semibold mb-2">Detalii animal:</h2>
                                    <div className="space-y-1 text-sm sm:text-base">
                                        <p>
                                            <strong>Nume:</strong> {animalDetails.name}
                                        </p>
                                        <p>
                                            <strong>Specie:</strong> {normalizeSpecies(animalDetails.species)}
                                        </p>
                                        {animalDetails.breed && (
                                            <p>
                                                <strong>Rasă:</strong> {animalDetails.breed}
                                            </p>
                                        )}
                                        {ownerInfo && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <p>
                                                    <strong>Proprietar:</strong> {ownerInfo.name}
                                                </p>
                                                <p>
                                                    <strong>Tip utilizator:</strong> {normalizeUserType(ownerInfo.type)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                                            stroke="#10B981"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M16 2V6M8 2V6M3 10H21M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01"
                                            stroke="#10B981"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <label className="text-base font-medium">Selectează data de început:</label>
                                </div>
                                <select
                                    className="w-full p-3 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base"
                                    value={date || ""}
                                    onChange={(e) => setDate(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Alege o dată
                                    </option>
                                    {dateOptions.map((option, index) => (
                                        <option key={option.value} value={option.value}>
                                            {index === 0 ? "Astăzi" : index === 1 ? "Mâine" : option.dayName} - {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="9" stroke="#10B981" strokeWidth="2" />
                                        <path
                                            d="M12 7V12L15 15"
                                            stroke="#10B981"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <label className="text-base font-medium">Selectează perioada (luni):</label>
                                </div>
                                <select
                                    className="w-full p-3 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base"
                                    value={period || ""}
                                    onChange={(e) => setPeriod(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Alege perioada
                                    </option>
                                    {periodOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className="w-full bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 text-base sm:text-lg rounded-md transition-colors"
                                onClick={handleConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? "Se procesează..." : "Confirmă programarea"}
                            </button>

                            {message && (
                                <div
                                    className={`mt-6 p-3 sm:p-4 border rounded-md text-center text-sm sm:text-lg ${
                                        message.includes("eroare")
                                            ? "bg-red-50 border-red-200 text-red-700"
                                            : "bg-green-50 border-green-200 text-green-700"
                                    }`}
                                >
                                    {message}
                                </div>
                            )}

                            <div className="mt-8 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">Despre Fostering</h3>
                                <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                                    Fostering-ul este o formă temporară de îngrijire care oferă animalelor un mediu sigur și iubitor în
                                    timp ce așteaptă să găsească o familie permanentă. Este o experiență minunată atât pentru tine, cât și
                                    pentru animalul pe care îl ajuți!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
