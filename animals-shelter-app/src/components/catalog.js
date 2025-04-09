import { useState, useEffect } from "react"
import { PawPrint, MapPin, LogOut } from "lucide-react"
import Button from "./ui/Button"

const Catalog = () => {
    const [viewMode, setViewMode] = useState("catalog")
    const [animals, setAnimals] = useState([])
    const [locations, setLocations] = useState({})
    const API_BASE_URL = "http://localhost:8083"

    // Add the byteArrayToImageUrl function to convert image data to displayable URLs
    const byteArrayToImageUrl = (imageData) => {
        if (!imageData) return null

        // Check if the data is already a Base64 string (starts with /9j/ for JPEG)
        if (typeof imageData === "string") {
            // If it's a Base64 string that starts with the actual data (without the data:image prefix)
            if (imageData.startsWith("/9j/") || imageData.startsWith("iVBOR") || imageData.startsWith("R0lGOD")) {
                // Add the proper data URL prefix based on the image format
                let prefix = "data:image/jpeg;base64,"
                if (imageData.startsWith("iVBOR")) {
                    prefix = "data:image/png;base64,"
                } else if (imageData.startsWith("R0lGOD")) {
                    prefix = "data:image/gif;base64,"
                }

                // Return the complete data URL
                return prefix + imageData
            }

            // If it already has the data:image prefix, return as is
            if (imageData.startsWith("data:image/")) {
                return imageData
            }

            // If it's some other string format, try to parse it
            try {
                // Check if it's a stringified array
                const parsedData = JSON.parse(imageData)
                if (Array.isArray(parsedData)) {
                    // Convert the array back to Uint8Array
                    const uint8Array = new Uint8Array(parsedData)
                    // Create a blob and URL
                    const blob = new Blob([uint8Array], { type: "image/jpeg" })
                    return URL.createObjectURL(blob)
                }
            } catch (e) {
                console.error("Failed to parse image data:", e)
            }

            // If all else fails, try to use it as is
            return imageData
        }

        // Handle byte array
        if (Array.isArray(imageData) && imageData.length) {
            // Convert the array to Uint8Array
            const uint8Array = new Uint8Array(imageData)

            // Try to detect image type from the first few bytes
            let imageType = "image/jpeg" // Default type

            // Simple magic number detection for common image formats
            if (uint8Array.length > 2) {
                // Check for PNG signature
                if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4e) {
                    imageType = "image/png"
                }
                // Check for GIF signature
                else if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46) {
                    imageType = "image/gif"
                }
                // JPEG starts with FF D8
                else if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8) {
                    imageType = "image/jpeg"
                }
            }

            // Create a blob from the byte array with detected type
            const blob = new Blob([uint8Array], { type: imageType })

            // Create a URL for the blob
            return URL.createObjectURL(blob)
        }

        return null
    }

    // Process animals to add image URLs
    const processAnimalsWithImages = (animalsData) => {
        return animalsData.map((animal) => {
            // Check if animal has image data (could be Base64 string or byte array)
            if (animal.image) {
                console.log(`Processing image for animal ${animal.id}, type:`, typeof animal.image)
                // Try to convert the image data to a URL
                const imageUrl = byteArrayToImageUrl(animal.image)
                console.log(`Converted image for animal ${animal.id}, URL created:`, !!imageUrl)
                return {
                    ...animal,
                    imageUrl: imageUrl,
                }
            } else if (animal.imageBytes && animal.imageBytes.length) {
                // Handle legacy imageBytes field if present
                const imageUrl = byteArrayToImageUrl(animal.imageBytes)
                return {
                    ...animal,
                    imageUrl: imageUrl,
                }
            }
            return animal
        })
    }

    useEffect(() => {
        const fetchAnimals = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/allAnimals`)
                if (!response.ok) {
                    throw new Error("Network response was not ok")
                }
                const data = await response.json()

                // Process images before setting state
                const processedAnimals = processAnimalsWithImages(data)
                setAnimals(processedAnimals)

                // 🔹 Pentru fiecare animal, luăm locația user-ului asociat
                processedAnimals.forEach((animal) => {
                    if (animal.userId) {
                        fetchUserLocation(animal.id, animal.userId)
                    }
                })
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
        <div className="container mx-auto px-4 py-8">
            <header className="border-b mb-8">
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
            <h1 className="text-3xl font-bold mb-6 text-center">Animale disponibile</h1>

            <div className="flex items-center justify-center space-x-4 mb-6">
                <Button onClick={() => (window.location.href = "/map")}>Hartă</Button>
            </div>

            {viewMode === "catalog" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {animals.map((animal) => (
                        <div key={animal.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Add image display */}
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                {animal.imageUrl ? (
                                    <img
                                        src={animal.imageUrl || "/placeholder.svg"}
                                        alt={animal.name}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : animal.image ? (
                                    <img
                                        src={byteArrayToImageUrl(animal.image) || "/placeholder.svg"}
                                        alt={animal.name}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="text-gray-400">Fără imagine</div>
                                )}
                            </div>
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">{animal.name}</h2>
                                <p className="text-gray-600 mb-1">Specia: {animal.species}</p>
                                <p className="text-gray-600 mb-1">Descrierea: {animal.description}</p>
                                <p className="text-gray-600 flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {locations[animal.id] || "Se încarcă locația..."}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => navigateToAdoption(animal.id)}
                                    >
                                        Adopție
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={() => navigateToFostering(animal.id)}
                                    >
                                        Foster
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700"
                                        onClick={() => navigateToDistantAdoption(animal.id)}
                                    >
                                        Adopție la distanță
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-xl font-semibold">Map View (Implement Google Maps or similar here)</p>
                </div>
            )}
        </div>
    )
}

export default Catalog
