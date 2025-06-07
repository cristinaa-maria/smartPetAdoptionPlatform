import type React from "react"

import { useState } from "react"
import { PawPrint, Search, Loader2, MapPin, LogOut } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"

// The API base URL - adjust as needed for your environment
const API_BASE_URL = "http://localhost:8083"

const PetCard = ({ pet, location, onAdopt, onFoster, onDistantAdopt }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            {pet.image ? (
                <img
                    src={pet.image || "/placeholder.svg"}
                    alt={pet.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                        e.target.src = "/placeholder.svg?height=192&width=300"
                    }}
                />
            ) : (
                <div className="text-gray-400">Fără imagine</div>
            )}
        </div>
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-2">{pet.name}</h2>
            <p className="text-gray-600 mb-1">Specia: {pet.species}</p>
            <p className="text-gray-600 mb-1">Descrierea: {pet.description}</p>
            <p className="text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {location || "Se încarcă locația..."}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onAdopt(pet.id)}>
                    Adopție
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => onFoster(pet.id)}>
                    Foster
                </Button>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => onDistantAdopt(pet.id)}>
                    Adopție la distanță
                </Button>
            </div>
        </div>
    </div>
)

const semanticSearch = async (query: string, topN = 50) => {
    const response = await fetch(
        `${API_BASE_URL}/api/embeddings/semantic-search?query=${encodeURIComponent(query)}&topN=${topN}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        },
    )
    if (!response.ok) throw new Error("Nu am putut efectua căutarea semantică")
    const data = await response.json()

    // The backend now returns Animal objects directly, no need to parse strings
    return data
}

// Remove this function entirely as the backend now returns full Animal objects

const AdoptionPage = () => {
    const [searchQuery, setSearchQuery] = useState("")
    const [pets, setPets] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [adoptionType, setAdoptionType] = useState("standard")
    const [locations, setLocations] = useState({})

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            // Get search results - now returns Animal objects directly
            const animalResults = await semanticSearch(searchQuery)
            setPets(animalResults)

            // Fetch locations for each animal
            animalResults.forEach((animal) => {
                if (animal.userId) {
                    fetchUserLocation(animal.id, animal.userId)
                }
            })
        } catch (error) {
            console.error("Error performing search:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchUserLocation = async (animalId, userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`)
            if (!response.ok) {
                console.warn(`Failed to fetch user data for ${userId}`)
                return
            }
            const userData = await response.json()

            if (userData.location && userData.location.coordinates && userData.location.coordinates.length === 2) {
                const [longitude, latitude] = userData.location.coordinates

                // Validate coordinates
                if (
                    typeof latitude === "number" &&
                    typeof longitude === "number" &&
                    latitude >= -90 &&
                    latitude <= 90 &&
                    longitude >= -180 &&
                    longitude <= 180
                ) {
                    await fetchLocation(animalId, latitude, longitude)
                } else {
                    console.warn(`Invalid coordinates for animal ${animalId}: lat=${latitude}, lng=${longitude}`)
                    setLocations((prevLocations) => ({ ...prevLocations, [animalId]: "Locație indisponibilă" }))
                }
            } else {
                setLocations((prevLocations) => ({ ...prevLocations, [animalId]: "Locație indisponibilă" }))
            }
        } catch (error) {
            console.warn(`Error fetching user location for ${userId}:`, error)
            setLocations((prevLocations) => ({ ...prevLocations, [animalId]: "Locație indisponibilă" }))
        }
    }

    const fetchLocation = async (animalId, latitude, longitude) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reverse-geocode?latitude=${latitude}&longitude=${longitude}`)
            if (!response.ok) {
                console.warn(`Reverse geocoding failed for coordinates ${latitude}, ${longitude}. Status: ${response.status}`)
                setLocations((prevLocations) => ({ ...prevLocations, [animalId]: "Locație indisponibilă" }))
                return
            }
            const address = await response.text()
            setLocations((prevLocations) => ({ ...prevLocations, [animalId]: address }))
        } catch (error) {
            console.warn("Error fetching location:", error)
            setLocations((prevLocations) => ({ ...prevLocations, [animalId]: "Locație indisponibilă" }))
        }
    }

    const navigateToAdoption = (animalId) => {
        window.location.href = `/book-adoption?animalId=${animalId}`
    }

    const navigateToFostering = (animalId) => {
        window.location.href = `/fostering?animalId=${animalId}`
    }

    const navigateToDistantAdoption = (animalId) => {
        window.location.href = `/distantAdoption?animalId=${animalId}`
    }

    return (
        <div className="min-h-screen">
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600" />
                        <span className="text-xl font-bold">PetPal Adoptions</span>
                    </a>
                    <nav className="flex gap-6">
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/home">
                            Acasă
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/adoption">
                            Adoptă acum
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/editor_catalog">
                            Adaugă anunț adopție
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/info">
                            ÎntreabăPetPal
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/community">
                            Alătură-te comunității
                        </a>
                        <button
                            className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors ml-2"
                            onClick={() => {
                                console.log("Logging out")
                                window.location.href = "/login"
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Deconectare
                        </button>
                    </nav>
                </div>
            </header>

            <h1 className="text-4xl font-bold mt-8 mb-6 text-center">Găsește-ți noul membru al familiei!</h1>

            <div className="max-w-5xl mx-auto px-4 mb-8">
                <form onSubmit={handleSearch} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="relative lg:col-span-7">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                            <Input
                                id="searchQuery"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ex: pisică blândă, potrivită pentru familie cu copii"
                                className="pl-12 py-4 text-lg w-full"
                            />
                        </div>

                        <div className="lg:col-span-3">
                            <select
                                value={adoptionType}
                                onChange={(e) => setAdoptionType(e.target.value)}
                                className="w-full h-full px-3 py-4 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                                aria-label="Tip relație"
                            >
                                <option value="standard">Adopție permanentă</option>
                                <option value="foster">Foster (temporar)</option>
                                <option value="distant">Adopție la distanță</option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-full py-4 px-6 text-lg bg-green-600 hover:bg-green-700 flex items-center justify-center"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <Search className="w-6 h-6 mr-2" />}
                                {isLoading ? "Căutare..." : "Caută"}
                            </Button>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600 mt-2">
                        {adoptionType === "standard" && (
                            <p>Adopția permanentă înseamnă că animalul va deveni pe deplin membrul familiei tale.</p>
                        )}
                        {adoptionType === "foster" && (
                            <p>
                                Foster (temporar) - oferă un cămin temporar unui animal până când acesta își găsește o familie
                                permanentă.
                            </p>
                        )}
                        {adoptionType === "distant" && (
                            <p>
                                Adopția la distanță - sprijini financiar un animal care rămâne în adăpost, primind actualizări regulate.
                            </p>
                        )}
                    </div>
                </form>
            </div>

            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {pets.map((pet) => (
                        <PetCard
                            key={pet.id}
                            pet={pet}
                            location={locations[pet.id]}
                            onAdopt={navigateToAdoption}
                            onFoster={navigateToFostering}
                            onDistantAdopt={navigateToDistantAdoption}
                        />
                    ))}
                </div>
                {pets.length === 0 && !isLoading && (
                    <div className="text-center mt-8 text-gray-600">
                        <p>
                            Nu ai găsit ce cauți?{" "}
                            <a href="/catalog" className="text-green-600 font-semibold">
                                Vezi toate anunțurile
                            </a>
                        </p>
                    </div>
                )}
                {pets.length > 0 && !isLoading && (
                    <div className="text-center mt-8 mb-12 text-gray-600">
                        <p>
                            Nu ai găsit ce cauți?{" "}
                            <a href="/catalog" className="text-green-600 font-semibold hover:underline">
                                Vezi toate anunțurile
                            </a>
                        </p>
                    </div>
                )}
                {isLoading && (
                    <div className="text-center mt-8">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto text-green-600" />
                        <p className="mt-2 text-gray-600">Se încarcă rezultatele...</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdoptionPage
