import type React from "react"
import { useState } from "react"
import { PawPrint, Search, Loader2, MapPin, LogOut } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"

// The API base URL - adjust as needed for your environment
const API_BASE_URL = "http://localhost:8083"

// Function to remove diacritics from Romanian text
const removeDiacritics = (text: string): string => {
    const diacriticsMap = {
        ă: "a",
        â: "a",
        î: "i",
        ș: "s",
        ț: "t",
        Ă: "A",
        Â: "A",
        Î: "I",
        Ș: "S",
        Ț: "T",
    }

    return text.replace(/[ăâîșțĂÂÎȘȚ]/g, (match) => diacriticsMap[match] || match)
}

const PetCard = ({ pet, location, onAdopt, onFoster, onDistantAdopt, index }) => {
    // Get available adoption types for this specific animal
    const getAvailableAdoptionTypes = (animal) => {
        // If no adoption types are specified, show all buttons (backward compatibility)
        if (!animal.typesOfAdoptions && !animal.adoptionTypes) {
            return {
                adoption: true,
                fostering: true,
                distantAdoption: true,
            }
        }

        // Handle the backend format: typesOfAdoptions array
        if (animal.typesOfAdoptions && Array.isArray(animal.typesOfAdoptions)) {
            const adoptionTypes = {
                adoption: false,
                fostering: false,
                distantAdoption: false,
            }

            // Check each type in the array
            animal.typesOfAdoptions.forEach((type) => {
                const lowerType = type.toLowerCase()

                if (lowerType.includes("adoptie permanenta") || lowerType.includes("adoptie_permanenta")) {
                    adoptionTypes.adoption = true
                }
                if (lowerType.includes("foster")) {
                    adoptionTypes.fostering = true
                }
                if (lowerType.includes("adoptie la distanta") || lowerType.includes("adoptie_la_distanta")) {
                    adoptionTypes.distantAdoption = true
                }
            })

            return adoptionTypes
        }

        // Handle the editor format: adoptionTypes object (for backward compatibility)
        if (animal.adoptionTypes && typeof animal.adoptionTypes === "object") {
            return {
                adoption: animal.adoptionTypes.adoptie_permanenta || animal.adoptionTypes.adoption || false,
                fostering: animal.adoptionTypes.foster || animal.adoptionTypes.fostering || false,
                distantAdoption: animal.adoptionTypes.adoptie_la_distanta || animal.adoptionTypes.distantAdoption || false,
            }
        }

        // Default fallback - show all
        return {
            adoption: true,
            fostering: true,
            distantAdoption: true,
        }
    }

    const availableAdoptionTypes = getAvailableAdoptionTypes(pet)
    const adoptionTypeCount = Object.values(availableAdoptionTypes).filter(Boolean).length

    return (
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
                <p className="text-gray-600 flex items-center mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {location || "Se încarcă locația..."}
                </p>

                {/* Show available adoption types as badges */}
                <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Tipuri disponibile:</p>
                    <div className="flex flex-wrap gap-1">
                        {availableAdoptionTypes.adoption && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Adopție</span>
                        )}
                        {availableAdoptionTypes.fostering && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Foster</span>
                        )}
                        {availableAdoptionTypes.distantAdoption && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Adopție la distanță</span>
                        )}
                    </div>
                </div>

                {/* Fixed-width button container - all buttons same size */}
                <div className="flex flex-wrap gap-2 justify-start">
                    {availableAdoptionTypes.adoption && (
                        <Button
                            className={`bg-green-600 hover:bg-green-700 text-sm ${adoptionTypeCount === 2 ? "flex-1" : "w-32"}`}
                            onClick={() => onAdopt(pet.id)}
                        >
                            Adopție
                        </Button>
                    )}
                    {availableAdoptionTypes.fostering && (
                        <Button
                            className={`bg-blue-600 hover:bg-blue-700 text-sm ${adoptionTypeCount === 2 ? "flex-1" : "w-32"}`}
                            onClick={() => onFoster(pet.id)}
                        >
                            Foster
                        </Button>
                    )}
                    {availableAdoptionTypes.distantAdoption && (
                        <Button
                            className={`bg-purple-600 hover:bg-purple-700 text-sm ${adoptionTypeCount === 2 ? "flex-1" : "w-32"}`}
                            onClick={() => onDistantAdopt(pet.id)}
                        >
                            Adopție la distanță
                        </Button>
                    )}
                </div>

                {/* Show message if no adoption types are available */}
                {adoptionTypeCount === 0 && (
                    <div className="text-center py-2">
                        <p className="text-sm text-gray-500">Nu sunt disponibile tipuri de adopție</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const semanticSearch = async (query: string, adoptionType: string, topN = 50) => {
    // Map frontend adoption types to backend expected values (with diacritics removed)
    const adoptionTypeMapping = {
        standard: "adoptie permanenta", // "adopție_permanentă" -> "adoptie permanenta"
        foster: "foster",
        distant: "adoptie la distanta", // "adopție_la_distanță" -> "adoptie la distanta"
    }

    // Get the backend adoption type value (already without diacritics)
    const backendAdoptionType = adoptionTypeMapping[adoptionType] || adoptionType

    // Build the URL with query parameters
    const searchParams = new URLSearchParams({
        query: query,
        topN: topN.toString(),
    })

    // Add the adoption type as a list parameter (without diacritics)
    searchParams.append("typesOfAdoption", backendAdoptionType)

    console.log("Sending request with params:", searchParams.toString())
    console.log("Backend adoption type (no diacritics):", backendAdoptionType)

    const response = await fetch(`${API_BASE_URL}/api/embeddings/semantic-search?${searchParams.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error("Search failed:", response.status, errorText)
        throw new Error(`Nu am putut efectua căutarea semantică: ${response.status}`)
    }

    const data = await response.json()

    // DEBUG: Log the exact order received from backend
    console.log("=== BACKEND RESPONSE ORDER ===")
    data.forEach((animal, index) => {
        console.log(`${index + 1}. ${animal.name} (ID: ${animal.id})`)
    })
    console.log("===============================")

    return data
}

const AdoptionPage = () => {
    const [searchQuery, setSearchQuery] = useState("")
    const [pets, setPets] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [adoptionType, setAdoptionType] = useState("standard")
    const [locations, setLocations] = useState({})

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Clear previous results and locations to avoid stale state
        setPets([])
        setLocations({})

        try {
            // Pass adoption type to the search function
            const animalResults = await semanticSearch(searchQuery, adoptionType)

            // DEBUG: Log the order received from backend
            console.log("=== BACKEND RESPONSE ORDER (in handleSearch) ===")
            animalResults.forEach((animal, index) => {
                console.log(`${index + 1}. ${animal.name} (ID: ${animal.id})`)
            })
            console.log("===============================")

            // CRITICAL: Set pets state immediately with the exact order from backend
            // React's useState will preserve the array order
            setPets([...animalResults]) // Create new array to ensure fresh state

            // DEBUG: Verify what we're setting
            console.log("=== SETTING PETS STATE ORDER ===")
            animalResults.forEach((animal, index) => {
                console.log(`${index + 1}. ${animal.name} (ID: ${animal.id})`)
            })
            console.log("=================================")

            // Fetch locations asynchronously but don't let it affect the order
            // Use Promise.allSettled to handle all location fetches
            const locationPromises = animalResults.map(async (animal) => {
                if (animal.userId) {
                    try {
                        const location = await fetchUserLocationForAnimal(animal.id, animal.userId)
                        return { animalId: animal.id, location }
                    } catch (error) {
                        console.warn(`Failed to fetch location for animal ${animal.id}:`, error)
                        return { animalId: animal.id, location: "Locație indisponibilă" }
                    }
                }
                return { animalId: animal.id, location: "Locație indisponibilă" }
            })

            // Wait for all location fetches to complete
            const locationResults = await Promise.allSettled(locationPromises)

            // Update locations state with all results at once
            const newLocations = {}
            locationResults.forEach((result, index) => {
                if (result.status === "fulfilled" && result.value) {
                    newLocations[result.value.animalId] = result.value.location
                } else {
                    newLocations[animalResults[index].id] = "Locație indisponibilă"
                }
            })

            setLocations(newLocations)
        } catch (error) {
            console.error("Error performing search:", error)
            // You might want to show an error message to the user here
        } finally {
            setIsLoading(false)
        }
    }

    // Helper function to fetch location for a single animal
    const fetchUserLocationForAnimal = async (animalId, userId) => {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`)
        if (!response.ok) {
            throw new Error(`Failed to fetch user data for ${userId}`)
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
                return await fetchLocationText(latitude, longitude)
            } else {
                console.warn(`Invalid coordinates for animal ${animalId}: lat=${latitude}, lng=${longitude}`)
                return "Locație indisponibilă"
            }
        } else {
            return "Locație indisponibilă"
        }
    }

    // Helper function to fetch location text from coordinates
    const fetchLocationText = async (latitude, longitude) => {
        const response = await fetch(`${API_BASE_URL}/reverse-geocode?latitude=${latitude}&longitude=${longitude}`)
        if (!response.ok) {
            console.warn(`Reverse geocoding failed for coordinates ${latitude}, ${longitude}. Status: ${response.status}`)
            return "Locație indisponibilă"
        }
        return await response.text()
    }

    const navigateToAdoption = (animalId) => {
        window.location.href = `/book-adoption?animalId=${animalId}&type=standard`
    }

    const navigateToFostering = (animalId) => {
        window.location.href = `/fostering?animalId=${animalId}&type=foster`
    }

    const navigateToDistantAdoption = (animalId) => {
        window.location.href = `/distantAdoption?animalId=${animalId}&type=distant`
    }

    // DEBUG: Log the pets state when it changes
    console.log("=== CURRENT PETS STATE ORDER ===")
    pets.forEach((pet, index) => {
        console.log(`${index + 1}. ${pet.name} (ID: ${pet.id})`)
    })
    console.log("=================================")

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
                                className="w-full h-full py-4 px-6 text-lg bg-green-600 hover:bg-green-700 flex items-center justify-center"
                                disabled={isLoading}
                                onClick={handleSearch}
                                type="submit"
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
                    {pets.map((pet, index) => (
                        <PetCard
                            key={pet.id}
                            pet={pet}
                            location={locations[pet.id]}
                            onAdopt={navigateToAdoption}
                            onFoster={navigateToFostering}
                            onDistantAdopt={navigateToDistantAdoption}
                            index={index}
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
