import type React from "react"
import { useState } from "react"
import { PawPrint, Search, Loader2, MapPin, LogOut, Menu, X } from "lucide-react"
import  Button  from "./ui/Button"
import  Input  from "./ui/Input"
import { AnimalImage } from "./catalog"

const API_BASE_URL = "http://localhost:8083"
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

const PetCard = ({ pet, location, userInfo, onAdopt, onFoster, onDistantAdopt, index }) => {

    const getAvailableAdoptionTypes = (animal) => {
        if (!animal.typesOfAdoptions && !animal.adoptionTypes) {
            return {
                adoption: true,
                fostering: true,
                distantAdoption: true,
            }
        }

        if (animal.typesOfAdoptions && Array.isArray(animal.typesOfAdoptions)) {
            const adoptionTypes = {
                adoption: false,
                fostering: false,
                distantAdoption: false,
            }

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

        if (animal.adoptionTypes && typeof animal.adoptionTypes === "object") {
            return {
                adoption: animal.adoptionTypes.adoptie_permanenta || animal.adoptionTypes.adoption || false,
                fostering: animal.adoptionTypes.foster || animal.adoptionTypes.fostering || false,
                distantAdoption: animal.adoptionTypes.adoptie_la_distanta || animal.adoptionTypes.distantAdoption || false,
            }
        }

        return {
            adoption: true,
            fostering: true,
            distantAdoption: true,
        }
    }

    const getPrimaryImage = (pet) => {
        if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
            return pet.images[0]
        }
        if (pet.image) {
            return pet.image
        }
        return null
    }

    const availableAdoptionTypes = getAvailableAdoptionTypes(pet)
    const adoptionTypeCount = Object.values(availableAdoptionTypes).filter(Boolean).length
    const primaryImage = getPrimaryImage(pet)

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="w-full h-48 sm:h-56 lg:h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                <AnimalImage src={primaryImage} alt={pet.name || "Imagine animal"} animalName={pet.name} />
            </div>
            <div className="p-3 sm:p-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 truncate">{pet.name}</h2>

                <div className="space-y-1 sm:space-y-2 mb-3">
                    <p className="text-sm sm:text-base text-gray-600">
                        <span className="font-medium">Specia:</span> {normalizeSpecies(pet.species)}
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                        <span className="font-medium">Descrierea:</span> {pet.description}
                    </p>
                </div>

                {userInfo && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-md">
                        <p className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Proprietar:</span> {userInfo.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Tip:</span> {normalizeUserType(userInfo.type)}
                        </p>
                    </div>
                )}

                <div className="flex items-start gap-1 mb-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{location || "Se încarcă locația..."}</p>
                </div>

                <div className="mb-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Tipuri disponibile:</p>
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

                <div className="space-y-2">
                    {availableAdoptionTypes.adoption && (
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-2"
                            onClick={() => onAdopt(pet.id)}
                        >
                            Adopție
                        </Button>
                    )}
                    {availableAdoptionTypes.fostering && (
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-2"
                            onClick={() => onFoster(pet.id)}
                        >
                            Foster
                        </Button>
                    )}
                    {availableAdoptionTypes.distantAdoption && (
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm py-2"
                            onClick={() => onDistantAdopt(pet.id)}
                        >
                            Adopție la distanță
                        </Button>
                    )}
                </div>

                {adoptionTypeCount === 0 && (
                    <div className="text-center py-3">
                        <p className="text-xs sm:text-sm text-gray-500">Nu sunt disponibile tipuri de adopție</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const semanticSearch = async (query: string, adoptionType: string, topN = 50) => {

    const adoptionTypeMapping = {
        standard: "adoptie permanenta",
        foster: "foster",
        distant: "adoptie la distanta",
    }

    const backendAdoptionType = adoptionTypeMapping[adoptionType] || adoptionType
    const searchParams = new URLSearchParams({
        query: query,
        topN: topN.toString(),
    })

    searchParams.append("typesOfAdoption", backendAdoptionType)


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
    return data
}

const AdoptionPage = () => {
    const [searchQuery, setSearchQuery] = useState("")
    const [pets, setPets] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [adoptionType, setAdoptionType] = useState("standard")
    const [locations, setLocations] = useState({})
    const [userInfo, setUserInfo] = useState({}) // Add user info state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setPets([])
        setLocations({})
        setUserInfo({})

        try {
            const animalResults = await semanticSearch(searchQuery, adoptionType)
            setPets([...animalResults])
            const locationPromises = animalResults.map(async (animal) => {
                if (animal.userId) {
                    try {
                        const result = await fetchUserLocationAndInfoForAnimal(animal.id, animal.userId)
                        return { animalId: animal.id, ...result }
                    } catch (error) {
                        console.warn(`Failed to fetch location for animal ${animal.id}:`, error)
                        return { animalId: animal.id, location: "Locație indisponibilă", userInfo: null }
                    }
                }
                return { animalId: animal.id, location: "Locație indisponibilă", userInfo: null }
            })

            const locationResults = await Promise.allSettled(locationPromises)
            const newLocations = {}
            const newUserInfo = {}
            locationResults.forEach((result, index) => {
                if (result.status === "fulfilled" && result.value) {
                    newLocations[result.value.animalId] = result.value.location
                    if (result.value.userInfo) {
                        newUserInfo[result.value.animalId] = result.value.userInfo
                    }
                } else {
                    newLocations[animalResults[index].id] = "Locație indisponibilă"
                }
            })

            setLocations(newLocations)
            setUserInfo(newUserInfo)
        } catch (error) {
            console.error("Error performing search:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchUserLocationAndInfoForAnimal = async (animalId, userId) => {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`)
        if (!response.ok) {
            throw new Error(`Failed to fetch user data for ${userId}`)
        }

        const userData = await response.json()
        const userInfo = {
            name: userData.name,
            type: userData.type,
        }

        let location = "Locație indisponibilă"

        if (userData.location && userData.location.coordinates && userData.location.coordinates.length === 2) {
            const [longitude, latitude] = userData.location.coordinates

            if (
                typeof latitude === "number" &&
                typeof longitude === "number" &&
                latitude >= -90 &&
                latitude <= 90 &&
                longitude >= -180 &&
                longitude <= 180
            ) {
                location = await fetchLocationText(latitude, longitude)
            } else {
                console.warn(`Invalid coordinates for animal ${animalId}: lat=${latitude}, lng=${longitude}`)
            }
        }

        return { location, userInfo }
    }

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

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <a href="/home" className="flex items-center gap-2 flex-shrink-0">
                            <PawPrint className="h-6 w-6 text-green-600" />
                            <span className="text-lg sm:text-xl font-bold">PetPal Adoptions</span>
                        </a>

                        <nav className="hidden lg:flex items-center gap-6">
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
                                className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                                onClick={() => {
                                    console.log("Logging out")
                                    window.location.href = "/login"
                                }}
                            >
                                <LogOut className="h-4 w-4" />
                                Deconectare
                            </button>
                        </nav>
                        <button
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <div className="lg:hidden border-t bg-white">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                <a
                                    href="/home"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    Acasă
                                </a>
                                <a
                                    href="/adoption"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    Adoptă acum
                                </a>
                                <a
                                    href="/editor_catalog"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    Adaugă anunț adopție
                                </a>
                                <a
                                    href="/info"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    ÎntreabăPetPal
                                </a>
                                <a
                                    href="/community"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    Alătură-te comunității
                                </a>
                                <button
                                    className="flex items-center gap-2 w-full px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                                    onClick={() => {
                                        console.log("Logging out")
                                        window.location.href = "/login"
                                    }}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Deconectare
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">
                        Găsește-ți noul membru al familiei!
                    </h1>
                </div>
                <div className="max-w-5xl mx-auto mb-6 sm:mb-8">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                                <Input
                                    id="searchQuery"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Ex: pisică blândă, potrivită pentru familie cu copii"
                                    className="pl-10 sm:pl-12 py-3 sm:py-4 text-sm sm:text-lg w-full"
                                />
                            </div>

                            <div className="lg:w-64">
                                <select
                                    value={adoptionType}
                                    onChange={(e) => setAdoptionType(e.target.value)}
                                    className="w-full px-3 py-3 sm:py-4 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                                    aria-label="Tip relație"
                                >
                                    <option value="standard">Adopție permanentă</option>
                                    <option value="foster">Foster (temporar)</option>
                                    <option value="distant">Adopție la distanță</option>
                                </select>
                            </div>

                            <div className="lg:w-32">
                                <Button
                                    className="w-full py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-lg bg-green-600 hover:bg-green-700 flex items-center justify-center"
                                    disabled={isLoading}
                                    onClick={handleSearch}
                                    type="submit"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin w-5 h-5 sm:w-6 sm:h-6" />
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                            <span className="hidden sm:inline">Caută</span>
                                            <span className="sm:hidden">Caută</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="text-xs sm:text-sm text-gray-600 mt-2 px-1">
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
                                    Adopția la distanță - sprijini financiar un animal care rămâne în adăpost, primind actualizări
                                    regulate.
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {pets.map((pet, index) => (
                        <PetCard
                            key={pet.id}
                            pet={pet}
                            location={locations[pet.id]}
                            userInfo={userInfo[pet.id]}
                            onAdopt={navigateToAdoption}
                            onFoster={navigateToFostering}
                            onDistantAdopt={navigateToDistantAdoption}
                            index={index}
                        />
                    ))}
                </div>

                {pets.length === 0 && !isLoading && (
                    <div className="text-center mt-8 text-gray-600">
                        <p className="text-sm sm:text-base">
                            Nu ai găsit ce cauți?{" "}
                            <a href="/catalog" className="text-green-600 font-semibold hover:underline">
                                Vezi toate anunțurile
                            </a>
                        </p>
                    </div>
                )}

                {pets.length > 0 && !isLoading && (
                    <div className="text-center mt-8 mb-12 text-gray-600">
                        <p className="text-sm sm:text-base">
                            Nu ai găsit ce cauți?{" "}
                            <a href="/catalog" className="text-green-600 font-semibold hover:underline">
                                Vezi toate anunțurile
                            </a>
                        </p>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center mt-8">
                        <Loader2 className="animate-spin h-6 w-6 sm:h-8 sm:w-8 mx-auto text-green-600" />
                        <p className="mt-2 text-sm sm:text-base text-gray-600">Se încarcă rezultatele...</p>
                    </div>
                )}
            </main>
        </div>
    )
}

export default AdoptionPage
