import { useState, useEffect } from "react"
import { PawPrint, MapPin, LogOut } from "lucide-react"
import Button from "./ui/Button"

const AnimalImage = ({ src: initialSrc, alt, animalName }) => {
    const [currentSrc, setCurrentSrc] = useState(initialSrc)
    const [imageError, setImageError] = useState(false)
    const [debugInfo, setDebugInfo] = useState("")

    // Helper function to extract the relevant path from local file paths
    const extractStaticPath = (localPath) => {
        if (!localPath || typeof localPath !== "string") return null

        // Normalize path separators to forward slashes
        const normalizedPath = localPath.replace(/\\/g, "/")

        // Look for "pisici" or "caini" in the path
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

        // If no pisici/caini found, try to extract just the filename and guess the category
        const filename = normalizedPath.split("/").pop()
        if (filename) {
            // Try to guess category from animal species or default to caini
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

            // Handle local file system paths
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
            // Handle paths that already start with /static/
            else if (trimmedSrc.startsWith("/static/")) {
                newSrcToTry = trimmedSrc
                console.log(`📂 Using existing static path for ${animalName}: ${trimmedSrc}`)
                setDebugInfo(`Using static: ${trimmedSrc}`)
            }
            // Handle other web paths
            else if (trimmedSrc.startsWith("/")) {
                newSrcToTry = trimmedSrc
                console.log(`🌐 Using web path for ${animalName}: ${trimmedSrc}`)
                setDebugInfo(`Web path: ${trimmedSrc}`)
            }
            // Handle external URLs
            else if (trimmedSrc.startsWith("http")) {
                newSrcToTry = trimmedSrc
                console.log(`🔗 Using external URL for ${animalName}`)
                setDebugInfo(`External URL`)
            }
            // Handle data URLs
            else if (trimmedSrc.startsWith("data:image")) {
                newSrcToTry = trimmedSrc
                console.log(`📊 Using data URL for ${animalName}`)
                setDebugInfo(`Data URL`)
            }
            // Handle Unsplash URLs
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
            // Assume it's a filename and try both categories
            else {
                // Default to caini if we can't determine the category
                newSrcToTry = `/static/caini/${trimmedSrc}`
                console.log(`📄 Assuming filename in caini for ${animalName}: ${newSrcToTry}`)
                setDebugInfo(`Assumed caini: ${newSrcToTry}`)
            }
        }

        setCurrentSrc(newSrcToTry)
    }, [initialSrc, animalName])

    const handleImageError = () => {
        console.error(`❌ Image load failed for ${animalName}: ${currentSrc}`)

        // If it failed and it's in one category, try the other
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

        // If static paths failed, try other common paths
        if (currentSrc && currentSrc.startsWith("/static/")) {
            const filename = currentSrc.split("/").pop()
            const publicPath = `/public/images/${filename}`
            console.log(`🔄 Trying public path for ${animalName}: ${publicPath}`)
            setDebugInfo(`Fallback to public: ${publicPath}`)
            setCurrentSrc(publicPath)
            return
        }

        // If all paths failed, show placeholder
        console.error(`💥 All image paths failed for ${animalName}, showing placeholder`)
        setDebugInfo(`All paths failed`)
        setImageError(true)
    }

    if (imageError || !currentSrc) {
        return (
            <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500 text-sm">
                <div>📷 No image</div>
                {debugInfo && <div className="text-xs mt-1">{debugInfo}</div>}
            </div>
        )
    }

    return (
        <div className="relative w-full h-full">
            <img
                src={currentSrc || "/placeholder.svg"}
                alt={alt || animalName || "Animal image"}
                className="w-full h-full object-contain bg-gray-50"
                onError={handleImageError}
            />
            {/* Debug info overlay - remove this in production */}
            {process.env.NODE_ENV === "development" && debugInfo && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate">
                    {debugInfo}
                </div>
            )}
        </div>
    )
}

const Catalog = () => {
    const [viewMode, setViewMode] = useState("catalog")
    const [animals, setAnimals] = useState([])
    const [locations, setLocations] = useState({})
    const [userInfo, setUserInfo] = useState({})
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

    // Test static file serving
    const testStaticFiles = async () => {
        const testPaths = [
            "/static/caini/simon-moog-xnf85jmtrWk-unsplash.jpg",
            "/static/pisici/simon-moog-xnf85jmtrWk-unsplash.jpg",
            "/static/caini/diogo-cardoso-0K-_5Hj58ao-unsplash.jpg",
            "/static/pisici/diogo-cardoso-0K-_5Hj58ao-unsplash.jpg",
        ]

        console.log("🧪 Testing static file access...")
        for (const path of testPaths) {
            try {
                const response = await fetch(path, { method: "HEAD" })
                console.log(`${response.ok ? "✅" : "❌"} ${path} - Status: ${response.status}`)
            } catch (error) {
                console.log(`❌ ${path} - Error: ${error.message}`)
            }
        }
    }

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

                // Test static file serving after loading animals
                testStaticFiles()
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
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                {animal.images.slice(1, 4).map((imgSrc, index) => (
                    <div key={index} className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                        <AnimalImage src={imgSrc} alt={`${animal.name || "Animal"} image ${index + 2}`} animalName={animal.name} />
                    </div>
                ))}
                {animal.images.length > 4 && (
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 flex items-center justify-center text-sm text-gray-500 rounded">
                        +{animal.images.length - 4}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="border-b mb-8">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600" />
                        <span className="text-xl font-bold">PetPal Adoptions</span>
                    </a>
                    <nav className="flex flex-wrap items-center gap-4 md:gap-6">
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
                            className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors ml-auto md:ml-2"
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
            <h1 className="text-3xl font-bold mb-6 text-center">Animale disponibile</h1>
            <div className="flex items-center justify-center space-x-4 mb-6">
                <Button onClick={() => (window.location.href = "/map")}>Hartă</Button>
            </div>

            {viewMode === "catalog" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                                    <AnimalImage src={primaryImageSrc} alt={animal.name || "Imagine animal"} animalName={animal.name} />
                                </div>
                                <div className="p-4">
                                    <h2 className="text-xl font-semibold mb-2">{animal.name}</h2>
                                    {renderAdditionalImages(animal)}
                                    <p className="text-gray-600 mb-1">Specia: {normalizeSpecies(animal.species)}</p>
                                    <p className="text-gray-600 mb-1">Descrierea: {animal.description}</p>
                                    {userInfo[animal.id] && (
                                        <div className="mb-2">
                                            <p className="text-gray-600 text-sm">
                                                <span className="font-medium">Proprietar:</span> {userInfo[animal.id].name}
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                <span className="font-medium">Tip utilizator:</span>{" "}
                                                {normalizeUserType(userInfo[animal.id].type)}
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-gray-600 flex items-center mb-3">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {locations[animal.id] || (animal.userId ? "Se încarcă locația..." : "Locație neprecizată")}
                                    </p>
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
                                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                          Adopție la distanță
                        </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-start">
                                        {availableAdoptionTypes.adoption && (
                                            <Button
                                                size="sm"
                                                className={`bg-green-600 hover:bg-green-700 text-sm ${adoptionTypeCount === 2 ? "flex-1" : "w-32"}`}
                                                onClick={() => navigateToAdoption(animal.id)}
                                            >
                                                Adopție
                                            </Button>
                                        )}
                                        {availableAdoptionTypes.fostering && (
                                            <Button
                                                size="sm"
                                                className={`bg-blue-600 hover:blue-700 text-sm ${adoptionTypeCount === 2 ? "flex-1" : "w-32"}`}
                                                onClick={() => navigateToFostering(animal.id)}
                                            >
                                                Foster
                                            </Button>
                                        )}
                                        {availableAdoptionTypes.distantAdoption && (
                                            <Button
                                                size="sm"
                                                className={`bg-purple-600 hover:bg-purple-700 text-sm ${adoptionTypeCount === 2 ? "flex-1" : "w-32"}`}
                                                onClick={() => navigateToDistantAdoption(animal.id)}
                                            >
                                                Adopție la distanță
                                            </Button>
                                        )}
                                    </div>
                                    {adoptionTypeCount === 0 && (
                                        <div className="text-center py-2">
                                            <p className="text-sm text-gray-500">Nu sunt disponibile tipuri de adopție</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-xl font-semibold">Map View (Implement Google Maps or similar here)</p>
                </div>
            )}
        </div>
    )
}

// Export the AnimalImage component so it can be imported by other components
export { AnimalImage }
export default Catalog
