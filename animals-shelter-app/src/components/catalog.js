import { useState, useEffect } from "react"
import { PawPrint, MapPin, LogOut, Menu, X } from "lucide-react"
import  Button  from "./ui/Button"

const AnimalImage = ({ src: initialSrc, alt, animalName }) => {
    const [currentSrc, setCurrentSrc] = useState(initialSrc)
    const [imageError, setImageError] = useState(false)
    const [debugInfo, setDebugInfo] = useState("")

    const extractStaticPath = (localPath) => {
        if (!localPath || typeof localPath !== "string") return null

        const normalizedPath = localPath.replace(/\\/g, "/")

        const pisiciMatch = normalizedPath.match(/.*\/(pisici\/[^/]+)$/i)
        const cainiMatch = normalizedPath.match(/.*\/(caini\/[^/]+)$/i)

        if (pisiciMatch) {
            const staticPath = `/static/${pisiciMatch[1]}`
            return staticPath
        }

        if (cainiMatch) {
            const staticPath = `/static/${cainiMatch[1]}`
            return staticPath
        }

        const filename = normalizedPath.split("/").pop()
        if (filename) {
            const species = animalName?.toLowerCase() || ""
            if (species.includes("pisica") || species.includes("cat")) {
                const staticPath = `/static/pisici/${filename}`
                console.log(`🔍 Guessing pisici category for ${animalName}: ${staticPath}`)
                setDebugInfo(`Guessed pisici: ${staticPath}`)
                return staticPath
            } else {
                const staticPath = `/static/caini/${filename}`
                console.log(`🔍 Guessing caini category for ${animalName}: ${staticPath}`)
                setDebugInfo(`Guessed caini: ${staticPath}`)
                return staticPath
            }
        }

        return null
    }

    useEffect(() => {
        setImageError(false)
        setDebugInfo("")
        let newSrcToTry = initialSrc

        if (initialSrc && typeof initialSrc === "string") {
            const trimmedSrc = initialSrc.trim()

            if (
                trimmedSrc.match(/^[A-Z]:\\/i) ||
                trimmedSrc.includes("\\") ||
                trimmedSrc.startsWith("/home/") ||
                trimmedSrc.startsWith("/Users/")
            ) {
                console.log(`📁 Local path detected for ${animalName}: ${trimmedSrc}`)

                const staticPath = extractStaticPath(trimmedSrc)
                if (staticPath) {
                    newSrcToTry = staticPath
                } else {
                    console.error(`❌ Could not extract static path for ${animalName}: ${trimmedSrc}`)
                    setDebugInfo(`Error: Could not extract path`)
                    setImageError(true)
                    return
                }
            }
            else if (trimmedSrc.startsWith("/static/")) {
                newSrcToTry = trimmedSrc
                console.log(`📂 Using existing static path for ${animalName}: ${trimmedSrc}`)
                setDebugInfo(`Using static: ${trimmedSrc}`)
            }
            else if (trimmedSrc.startsWith("/")) {
                newSrcToTry = trimmedSrc
                console.log(`🌐 Using web path for ${animalName}: ${trimmedSrc}`)
                setDebugInfo(`Web path: ${trimmedSrc}`)
            }

            else if (trimmedSrc.startsWith("http")) {
                newSrcToTry = trimmedSrc
                console.log(`🔗 Using external URL for ${animalName}`)
                setDebugInfo(`External URL`)
            }
            else if (trimmedSrc.startsWith("data:image")) {
                newSrcToTry = trimmedSrc

            }
            else if (trimmedSrc.includes("unsplash.com")) {
                try {
                    const urlParts = trimmedSrc.split("/")
                    const slugWithId = urlParts[urlParts.length - 1]
                    if (slugWithId) {
                        const idParts = slugWithId.split("-")
                        const photoId = idParts[idParts.length - 1]
                        if (photoId) {
                            newSrcToTry = `https://source.unsplash.com/${photoId}/300x192`
                            console.log(`🖼️ Transformed Unsplash URL for ${animalName}: ${newSrcToTry}`)
                            setDebugInfo(`Unsplash: ${photoId}`)
                        }
                    }
                } catch (e) {
                    console.error("Error parsing Unsplash URL:", e)
                    newSrcToTry = trimmedSrc
                }
            }
            else {
                newSrcToTry = `/static/caini/${trimmedSrc}`
                console.log(`📄 Assuming filename in caini for ${animalName}: ${newSrcToTry}`)
                setDebugInfo(`Assumed caini: ${newSrcToTry}`)
            }
        }

        setCurrentSrc(newSrcToTry)
    }, [initialSrc, animalName])

    const handleImageError = () => {

        if (currentSrc && currentSrc.includes("/static/caini/")) {
            const filename = currentSrc.split("/").pop()
            const pisiciPath = `/static/pisici/${filename}`
            console.log(`🔄 Trying pisici category for ${animalName}: ${pisiciPath}`)
            setDebugInfo(`Fallback to pisici: ${pisiciPath}`)
            setCurrentSrc(pisiciPath)
            return
        }

        if (currentSrc && currentSrc.includes("/static/pisici/")) {
            const filename = currentSrc.split("/").pop()
            const cainiPath = `/static/caini/${filename}`
            console.log(`🔄 Trying caini category for ${animalName}: ${cainiPath}`)
            setDebugInfo(`Fallback to caini: ${cainiPath}`)
            setCurrentSrc(cainiPath)
            return
        }

        if (currentSrc && currentSrc.startsWith("/static/")) {
            const filename = currentSrc.split("/").pop()
            const publicPath = `/public/images/${filename}`
            console.log(`🔄 Trying public path for ${animalName}: ${publicPath}`)
            setDebugInfo(`Fallback to public: ${publicPath}`)
            setCurrentSrc(publicPath)
            return
        }

        console.error(`💥 All image paths failed for ${animalName}, showing placeholder`)
        setDebugInfo(`All paths failed`)
        setImageError(true)
    }

    if (imageError || !currentSrc) {
        return (
            <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500 text-xs sm:text-sm">
                <div>📷 No image</div>
                {debugInfo && <div className="text-xs mt-1 px-1 text-center">{debugInfo}</div>}
            </div>
        )
    }

    return (
        <div className="relative w-full h-full">
            <img
                src={currentSrc || "/placeholder.svg"}
                alt={alt || animalName || "Animal image"}
                className="w-full h-full object-cover bg-gray-50"
                onError={handleImageError}
            />

        </div>
    )
}

const Catalog = () => {
    const [viewMode, setViewMode] = useState("catalog")
    const [animals, setAnimals] = useState([])
    const [locations, setLocations] = useState({})
    const [userInfo, setUserInfo] = useState({})
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [API_BASE_URL] = useState("http://localhost:8083")

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

    // const testStaticFiles = async () => {
    //     const testPaths = [
    //         "/static/caini/simon-moog-xnf85jmtrWk-unsplash.jpg",
    //         "/static/pisici/simon-moog-xnf85jmtrWk-unsplash.jpg",
    //         "/static/caini/diogo-cardoso-0K-_5Hj58ao-unsplash.jpg",
    //         "/static/pisici/diogo-cardoso-0K-_5Hj58ao-unsplash.jpg",
    //     ]
    //
    //     console.log("🧪 Testing static file access...")
    //     for (const path of testPaths) {
    //         try {
    //             const response = await fetch(path, { method: "HEAD" })
    //             console.log(`${response.ok ? "✅" : "❌"} ${path} - Status: ${response.status}`)
    //         } catch (error) {
    //             console.log(`❌ ${path} - Error: ${error.message}`)
    //         }
    //     }
    // }

    useEffect(() => {
        const fetchAnimals = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/allAnimals`)
                if (!response.ok) {
                    throw new Error("Network response was not ok")
                }
                const data = await response.json()
                console.log("📊 Fetched animals data:", data.length || 0, "animals")

                setAnimals(data || [])
                if (data) {
                    data.forEach((animal) => {
                        if (animal.userId) {
                            fetchUserLocation(animal.id, animal.userId)
                        }
                    })
                }

            } catch (error) {
                console.error("Error fetching animals:", error)
            }
        }
        fetchAnimals()
    }, [])

    const fetchUserLocation = async (animalId, userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`)
            if (!response.ok) {
                throw new Error("Failed to fetch user data")
            }
            const userData = await response.json()
            setUserInfo((prevUserInfo) => ({
                ...prevUserInfo,
                [animalId]: {
                    name: userData.name,
                    type: userData.type,
                },
            }))
            if (userData.location && userData.location.coordinates) {
                const [longitude, latitude] = userData.location.coordinates
                fetchLocation(animalId, latitude, longitude)
            }
        } catch (error) {
            console.error(`Error fetching user location for ${userId}:`, error)
        }
    }

    const fetchLocation = async (animalId, latitude, longitude) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reverse-geocode?latitude=${latitude}&longitude=${longitude}`)
            if (!response.ok) {
                throw new Error("Failed to fetch location")
            }
            const address = await response.text()
            setLocations((prevLocations) => ({ ...prevLocations, [animalId]: address }))
        } catch (error) {
            console.error("Error fetching location:", error)
        }
    }

    const getAvailableAdoptionTypes = (animal) => {
        if (!animal.typesOfAdoptions && !animal.adoptionTypes) {
            return { adoption: true, fostering: true, distantAdoption: true }
        }
        if (animal.typesOfAdoptions && Array.isArray(animal.typesOfAdoptions)) {
            const adoptionTypes = { adoption: false, fostering: false, distantAdoption: false }
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
        return { adoption: true, fostering: true, distantAdoption: true }
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

    const renderAdditionalImages = (animal) => {
        if (!animal.images || animal.images.length <= 1) return null

        return (
            <div className="mt-2 flex gap-1 sm:gap-2 overflow-x-auto pb-2">
                {animal.images.slice(1, 4).map((imgSrc, index) => (
                    <div key={index} className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded overflow-hidden">
                        <AnimalImage src={imgSrc} alt={`${animal.name || "Animal"} image ${index + 2}`} animalName={animal.name} />
                    </div>
                ))}
                {animal.images.length > 4 && (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-gray-100 flex items-center justify-center text-xs sm:text-sm text-gray-500 rounded">
                        +{animal.images.length - 4}
                    </div>
                )}
            </div>
        )
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
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">Animale disponibile</h1>
                    <Button
                        onClick={() => (window.location.href = "/map")}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 text-sm sm:text-base"
                    >
                        Hartă
                    </Button>
                </div>

                {viewMode === "catalog" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {animals.map((animal) => {
                            const availableAdoptionTypes = getAvailableAdoptionTypes(animal)
                            const adoptionTypeCount = Object.values(availableAdoptionTypes).filter(Boolean).length

                            const primaryImageSrc =
                                animal.images &&
                                animal.images.length > 0 &&
                                typeof animal.images[0] === "string" &&
                                animal.images[0].trim() !== ""
                                    ? animal.images[0]
                                    : null

                            return (
                                <div
                                    key={animal.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105"
                                >
                                    <div className="w-full h-56 sm:h-64 lg:h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
                                        <AnimalImage src={primaryImageSrc} alt={animal.name || "Imagine animal"} animalName={animal.name} />
                                    </div>
                                    <div className="p-3 sm:p-4">
                                        <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 truncate">{animal.name}</h2>
                                        {renderAdditionalImages(animal)}

                                        <div className="space-y-1 sm:space-y-2 mb-3">
                                            <p className="text-sm sm:text-base text-gray-600">
                                                <span className="font-medium">Specia:</span> {normalizeSpecies(animal.species)}
                                            </p>
                                            <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                                                <span className="font-medium">Descrierea:</span> {animal.description}
                                            </p>
                                        </div>

                                        {userInfo[animal.id] && (
                                            <div className="mb-3 p-2 bg-gray-50 rounded-md">
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    <span className="font-medium">Proprietar:</span> {userInfo[animal.id].name}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    <span className="font-medium">Tip:</span> {normalizeUserType(userInfo[animal.id].type)}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-1 mb-3">
                                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                                {locations[animal.id] || (animal.userId ? "Se încarcă locația..." : "Locație neprecizată")}
                                            </p>
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
                                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                            Adopție la distanță
                          </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {availableAdoptionTypes.adoption && (
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-2"
                                                    onClick={() => navigateToAdoption(animal.id)}
                                                >
                                                    Adopție
                                                </Button>
                                            )}
                                            {availableAdoptionTypes.fostering && (
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-2"
                                                    onClick={() => navigateToFostering(animal.id)}
                                                >
                                                    Foster
                                                </Button>
                                            )}
                                            {availableAdoptionTypes.distantAdoption && (
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm py-2"
                                                    onClick={() => navigateToDistantAdoption(animal.id)}
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
                        })}
                    </div>
                ) : (
                    <div className="h-[400px] sm:h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
                        <p className="text-lg sm:text-xl font-semibold text-gray-600">
                            Map View (Implement Google Maps or similar here)
                        </p>
                    </div>
                )}
            </main>
        </div>
    )
}

export { AnimalImage }
export default Catalog
