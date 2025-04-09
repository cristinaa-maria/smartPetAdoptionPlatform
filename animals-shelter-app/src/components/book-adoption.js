import { useState, useEffect } from "react"
import { format, startOfWeek, addDays, parseISO } from "date-fns"
import { ArrowLeft } from "lucide-react"

export default function AdoptionBooking() {
    const [animalId, setAnimalId] = useState(null)

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const id = urlParams.get("animalId")
        console.log("Extracted animalId from URL:", id)
        setAnimalId(id)
    }, [])

    const [date, setDate] = useState(null)
    const [time, setTime] = useState(null)
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [adopterId, setAdopterId] = useState(null)
    const [userId, setUserId] = useState(null)
    const [dataLoading, setDataLoading] = useState(true)
    const [error, setError] = useState(null)
    const [animalDetails, setAnimalDetails] = useState(null)

    const API_BASE_URL = "http://localhost:8083"

    useEffect(() => {
        const fetchRequiredData = async () => {
            setDataLoading(true)
            try {
                // Fetch current user ID (adopter)
                const userResponse = await fetch(`${API_BASE_URL}/currentUserId`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json, text/plain, */*",
                    },
                })

                if (!userResponse.ok) {
                    console.error("User response status:", userResponse.status)
                    throw new Error("Failed to get current user information")
                }

                const currentUserId = await userResponse.text()
                console.log("Current user ID (adopterId):", currentUserId)
                setAdopterId(currentUserId)

                const animalResponse = await fetch(`${API_BASE_URL}/animalInfo/${animalId}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                })

                if (!animalResponse.ok) {
                    console.error("Animal response status:", animalResponse.status)
                    throw new Error("Failed to fetch animal information")
                }

                const animal = await animalResponse.json()
                console.log("Fetched animal:", animal)
                setAnimalDetails(animal)
                setUserId(animal.userId)

                setError(null)
            } catch (err) {
                console.error("Error fetching required data:", err)
                setError("Nu s-au putut încărca datele necesare. Te rugăm să încerci din nou.")
            } finally {
                setDataLoading(false)
            }
        }

        if (animalId) {
            fetchRequiredData()
        } else {
            setError("ID-ul animalului lipsește. Te rugăm să te întorci și să încerci din nou.")
            setDataLoading(false)
        }
    }, [animalId])

    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const dateOptions = Array.from({ length: 10 }, (_, i) => {
        const day = addDays(start, i)
        return {
            value: day.toISOString(),
            label: format(day, "dd/MM/yyyy"),
        }
    })

    // Generate time options - 10:00 to 19:00
    const timeOptions = Array.from({ length: 10 }, (_, i) => {
        const hour = 10 + i
        return {
            value: `${hour}:00`,
            label: `${hour}:00`,
        }
    })

    const handleConfirm = async () => {
        // Form validation
        if (!date || !time) {
            setMessage("Te rugăm să selectezi atât data, cât și ora adopției.")
            return
        }

        if (!adopterId || !userId) {
            setMessage("Informațiile despre utilizator sau animal lipsesc. Te rugăm să încerci din nou.")
            return
        }

        setIsLoading(true)

        try {
            const selectedDate = parseISO(date)
            const [hours, minutes] = time.split(":").map(Number)

            const adoptionDTO = {
                adopterId: adopterId,
                userId: userId,
                animalId: animalId,
                status: "initializat",
                type: "adoptie permanenta",
                adoptionDate: `${format(selectedDate, "yyyy-MM-dd")}T${hours}:${minutes}:00`,
            }

            console.log("Sending adoption request:", adoptionDTO)

            const response = await fetch(`${API_BASE_URL}/scheduleAdoption`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(adoptionDTO),
                credentials: "include",
            })

            if (response.ok) {
                console.log("Adoption created successfully")
                setMessage(`Ai programat adopția pe ${format(selectedDate, "dd/MM/yyyy")} la ${time}.`)
            } else {
                const errorText = await response.text()
                console.error("Server error response:", errorText)
                setMessage("A apărut o eroare la programarea adopției. Te rugăm să încerci din nou.")
            }
        } catch (error) {
            console.error("Error creating adoption:", error)
            setMessage("A apărut o eroare la programarea adopției. Te rugăm să încerci din nou.")
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
                <ArrowLeft className="h-6 w-6 text-green-600" onClick={handleReturn} />
                <span className="text-xl font-bold">PetPal Adopție</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <h1 className="text-4xl font-bold mb-12 text-center">Programare Adopție</h1>

                    {dataLoading ? (
                        <div className="text-center py-8">
                            <p className="text-lg text-gray-600">Se încarcă datele...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-center">{error}</div>
                    ) : (
                        <div className="space-y-8">
                            {animalDetails && (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                                    <h2 className="text-xl font-semibold mb-2">Detalii animal:</h2>
                                    <p>
                                        <strong>Nume:</strong> {animalDetails.name}
                                    </p>
                                    <p>
                                        <strong>Specie:</strong> {animalDetails.species}
                                    </p>
                                    {animalDetails.breed && (
                                        <p>
                                            <strong>Rasă:</strong> {animalDetails.breed}
                                        </p>
                                    )}
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
                                    <label className="text-base font-medium">Selectează data:</label>
                                </div>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-md"
                                    value={date || ""}
                                    onChange={(e) => setDate(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Alege o dată
                                    </option>
                                    {dateOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
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
                                    <label className="text-base font-medium">Selectează ora:</label>
                                </div>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-md"
                                    value={time || ""}
                                    onChange={(e) => setTime(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Alege o oră
                                    </option>
                                    {timeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className="w-full bg-green-600 hover:bg-green-700 text-white p-4 text-lg rounded-md"
                                onClick={handleConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? "Se procesează..." : "Confirmă programarea"}
                            </button>
                            {message && (
                                <div
                                    className={`mt-6 p-4 border rounded-md text-center text-lg ${
                                        message.includes("eroare")
                                            ? "bg-red-50 border-red-200 text-red-700"
                                            : "bg-green-50 border-green-200 text-green-700"
                                    }`}
                                >
                                    {message}
                                </div>
                            )}

                            {/* Added veterinary clinic link */}
                            <div className="mt-8 text-center">
                                <a
                                    href="/find-clinics"
                                    className="inline-flex items-center text-green-600 hover:text-green-800 text-lg font-medium"
                                >
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        ></path>
                                    </svg>
                                    Găsește veterinar ușor pentru noul tău prieten, tot aici
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
