import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"

export default function DistantAdoptionBooking() {
    const [animalId, setAnimalId] = useState(null)
    const [period, setPeriod] = useState(null)
    const [amount, setAmount] = useState("") // Suma sponsorizată
    const [cardNumber, setCardNumber] = useState("") // Număr card
    const [cardExpiry, setCardExpiry] = useState("") // Data expirare card
    const [cardCVC, setCardCVC] = useState("") // CVC card
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [adopterId, setAdopterId] = useState(null)
    const [userId, setUserId] = useState(null)
    const [dataLoading, setDataLoading] = useState(true)
    const [error, setError] = useState(null)
    const [animalDetails, setAnimalDetails] = useState(null)
    const [ownerName, setOwnerName] = useState(null)

    const API_BASE_URL = "http://localhost:8083"

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const id = urlParams.get("animalId")
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
                setAdopterId(currentUserId)

                const animalResponse = await fetch(`${API_BASE_URL}/animalInfo/${animalId}`, {
                    method: "GET",
                    credentials: "include",
                    headers: { Accept: "application/json" },
                })

                if (!animalResponse.ok) throw new Error("Failed to fetch animal information")

                const animal = await animalResponse.json()
                setAnimalDetails(animal)
                setUserId(animal.userId)

                // Fetch owner name
                if (animal.userId) {
                    try {
                        const ownerResponse = await fetch(`${API_BASE_URL}/currentUserName/${animal.userId}`, {
                            method: "GET",
                            credentials: "include",
                            headers: { Accept: "text/plain, */*" },
                        })

                        if (ownerResponse.ok) {
                            const ownerNameText = await ownerResponse.text()
                            console.log("Owner name:", ownerNameText)
                            setOwnerName(ownerNameText)
                        } else {
                            console.error("Failed to fetch owner name:", ownerResponse.status)
                        }
                    } catch (ownerError) {
                        console.error("Error fetching owner name:", ownerError)
                    }
                }

                setError(null)
            } catch (err) {
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

    const periodOptions = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        return { value: month.toString(), label: `${month} ${month === 1 ? "lună" : "luni"}` }
    })

    const handleConfirm = async () => {
        if (!period || !amount || !cardNumber || !cardExpiry || !cardCVC) {
            setMessage("Te rugăm să completezi toate câmpurile.")
            return
        }

        if (!adopterId || !userId) {
            setMessage("Informațiile despre utilizator sau animal lipsesc. Te rugăm să încerci din nou.")
            return
        }

        setIsLoading(true)

        try {
            const adoptionDTO = {
                adopterId,
                userId,
                animalId,
                status: "initializat",
                type: "distant_adoption",
                period,
                amount,
                paymentInfo: {
                    cardNumber,
                    cardExpiry,
                    cardCVC,
                },
            }

            const response = await fetch(`${API_BASE_URL}/scheduleAdoption`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(adoptionDTO),
                credentials: "include",
            })

            if (response.ok) {
                setMessage(
                    `Ai sponsorizat adopția la distanță pentru ${period} ${period === "1" ? "lună" : "luni"} cu suma de ${amount} RON.`,
                )
            } else {
                setMessage("A apărut o eroare la procesarea plății. Te rugăm să încerci din nou.")
            }
        } catch (error) {
            setMessage("A apărut o eroare la programarea adopției la distanță. Te rugăm să încerci din nou.")
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
                <span className="text-xl font-bold">PetPal Adopție la Distanță</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <h1 className="text-4xl font-bold mb-12 text-center">Programare Adopție la Distanță</h1>

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
                                    {ownerName && (
                                        <p>
                                            <strong>Proprietar:</strong> {ownerName}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="text-base font-medium">Selectează perioada (luni):</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-md"
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

                            <div>
                                <label className="text-base font-medium">Introdu suma minimă (RON):</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-md"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Ex: 50"
                                />
                            </div>

                            <div>
                                <label className="text-base font-medium">Introdu datele cardului:</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-md"
                                    placeholder="Număr card"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="w-full p-3 mt-2 border border-gray-300 rounded-md"
                                    placeholder="MM/YY"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="w-full p-3 mt-2 border border-gray-300 rounded-md"
                                    placeholder="CVC"
                                    value={cardCVC}
                                    onChange={(e) => setCardCVC(e.target.value)}
                                />
                            </div>

                            <button
                                className="w-full bg-green-600 hover:bg-green-700 text-white p-4 text-lg rounded-md"
                                onClick={handleConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? "Se procesează..." : "Confirmă sponsorizarea"}
                            </button>

                            {message && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-center text-lg">
                                    {message}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
