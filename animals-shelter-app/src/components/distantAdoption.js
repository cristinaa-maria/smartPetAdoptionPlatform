import { useState, useEffect } from "react"
import { ArrowLeft, CreditCard, DollarSign, Clock, Info } from "lucide-react"


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
    const [ownerInfo, setOwnerInfo] = useState(null)

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

    const getSuggestedAmounts = (selectedPeriod) => {
        const monthlyBase = 50
        const period = Number.parseInt(selectedPeriod) || 1
        return [
            monthlyBase * period,
            Math.round(monthlyBase * period * 1.5),
            monthlyBase * period * 2,
            Math.round(monthlyBase * period * 3),
        ]
    }

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
        const matches = v.match(/\d{4,16}/g)
        const match = (matches && matches[0]) || ""
        const parts = []

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4))
        }

        if (parts.length) {
            return parts.join(" ")
        } else {
            return v
        }
    }

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
        if (v.length >= 2) {
            return v.substring(0, 2) + "/" + v.substring(2, 4)
        }
        return v
    }

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value)
        if (formatted.length <= 19) {
            setCardNumber(formatted)
        }
    }

    const handleExpiryChange = (e) => {
        const formatted = formatExpiry(e.target.value)
        if (formatted.length <= 5) {
            setCardExpiry(formatted)
        }
    }

    const handleCVCChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/gi, "")
        if (value.length <= 4) {
            setCardCVC(value)
        }
    }

    const handleConfirm = async () => {
        if (!period || !amount || !cardNumber || !cardExpiry || !cardCVC) {
            setMessage("Te rugăm să completezi toate câmpurile.")
            return
        }

        if (!adopterId || !userId) {
            setMessage("Informațiile despre utilizator sau animal lipsesc. Te rugăm să încerci din nou.")
            return
        }

        if (Number.parseInt(amount) < 10) {
            setMessage("Suma minimă pentru sponsorizare este de 10 RON.")
            return
        }

        if (cardNumber.replace(/\s/g, "").length < 13) {
            setMessage("Numărul cardului pare să fie incomplet.")
            return
        }

        if (cardCVC.length < 3) {
            setMessage("Codul CVC trebuie să aibă cel puțin 3 cifre.")
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
                    cardNumber: cardNumber.replace(/\s/g, ""), // Remove spaces for API
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
                <ArrowLeft className="h-6 w-6 text-green-600 cursor-pointer" onClick={handleReturn} />
                <span className="text-lg sm:text-xl font-bold">PetPal Adopție la Distanță</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-2xl">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12 text-center">
                        Programare Adopție la Distanță
                    </h1>

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

                            <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-start gap-2 mb-2">
                                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <h3 className="text-base sm:text-lg font-semibold text-blue-800">Despre Adopția la Distanță</h3>
                                </div>
                                <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                                    Adopția la distanță îți permite să susții financiar îngrijirea unui animal fără să îl iei acasă.
                                    Contribuția ta ajută la hrană, îngrijire veterinară și alte necesități ale animalului.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-5 w-5 text-green-600" />
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

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    <label className="text-base font-medium">Introdu suma (RON):</label>
                                </div>
                                <input
                                    type="number"
                                    className="w-full p-3 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Minim 10 RON"
                                    min="10"
                                />
                                {period && (
                                    <div className="mt-2">
                                        <p className="text-xs sm:text-sm text-gray-600 mb-2">Sume sugerate:</p>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {getSuggestedAmounts(period).map((suggestedAmount) => (
                                                <button
                                                    key={suggestedAmount}
                                                    type="button"
                                                    className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs sm:text-sm hover:bg-green-200 transition-colors"
                                                    onClick={() => setAmount(suggestedAmount.toString())}
                                                >
                                                    {suggestedAmount} RON
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="h-5 w-5 text-green-600" />
                                    <label className="text-base font-medium">Datele cardului:</label>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-md text-sm sm:text-base"
                                        placeholder="1234 5678 9012 3456"
                                        value={cardNumber}
                                        onChange={handleCardNumberChange}
                                    />
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-300 rounded-md text-sm sm:text-base"
                                            placeholder="MM/YY"
                                            value={cardExpiry}
                                            onChange={handleExpiryChange}
                                        />
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-300 rounded-md text-sm sm:text-base"
                                            placeholder="CVC"
                                            value={cardCVC}
                                            onChange={handleCVCChange}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    🔒 Datele tale sunt securizate și criptate. Nu stocăm informațiile cardului.
                                </p>
                            </div>

                            {amount && period && (
                                <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md">
                                    <h3 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">Rezumat sponsorizare:</h3>
                                    <div className="space-y-1 text-xs sm:text-sm text-green-700">
                                        <p>
                                            <strong>Perioadă:</strong> {period} {period === "1" ? "lună" : "luni"}
                                        </p>
                                        <p>
                                            <strong>Sumă totală:</strong> {amount} RON
                                        </p>
                                        <p>
                                            <strong>Sumă lunară:</strong> {Math.round(Number.parseInt(amount) / Number.parseInt(period))} RON
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                className="w-full bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 text-base sm:text-lg rounded-md transition-colors"
                                onClick={handleConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? "Se procesează..." : "Confirmă sponsorizarea"}
                            </button>

                            {message && (
                                <div
                                    className={`mt-6 p-3 sm:p-4 border rounded-md text-center text-sm sm:text-lg ${
                                        message.includes("eroare") || message.includes("incomplet") || message.includes("minimă")
                                            ? "bg-red-50 border-red-200 text-red-700"
                                            : "bg-green-50 border-green-200 text-green-700"
                                    }`}
                                >
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
