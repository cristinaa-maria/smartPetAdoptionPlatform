import { useState, useEffect, useRef } from "react"
import { LogOut, PawPrint, Pencil, Trash, ChevronLeft, ChevronRight, X } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import Label from "./ui/Label"
import Textarea from "./ui/Textarea"
import { RadioGroup, RadioGroupItem } from "./ui/Radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Checkbox } from "./ui/Checkbox"

// Image Carousel Component
const ImageCarousel = ({ images, onRemove, editable = false }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [touchStart, setTouchStart] = useState(null)
    const [touchEnd, setTouchEnd] = useState(null)

    const minSwipeDistance = 50

    const onTouchStart = (e) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return
        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe && currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
        if (isRightSwipe && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    const goToPrevious = () => {
        setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1)
    }

    const goToNext = () => {
        setCurrentIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0)
    }

    const removeImage = (index) => {
        if (onRemove) {
            onRemove(index)
            if (currentIndex >= images.length - 1) {
                setCurrentIndex(Math.max(0, images.length - 2))
            }
        }
    }

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg">
                <div className="text-gray-400">Fără imagini</div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <div className="w-full h-full" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                <img
                    src={images[currentIndex] || "/placeholder.svg"}
                    alt={`Image ${currentIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = "/placeholder.svg?height=200&width=200"
                    }}
                />
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </>
            )}

            {/* Remove button for editable mode */}
            {editable && (
                <button
                    onClick={() => removeImage(currentIndex)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            )}

            {/* Dots indicator */}
            {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentIndex ? "bg-white" : "bg-white bg-opacity-50"
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Image counter */}
            {images.length > 1 && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    )
}

const EditorCatalog = () => {
    const [animals, setAnimals] = useState([])
    const [newAnimal, setNewAnimal] = useState({
        name: "",
        species: "",
        description: "",
        image: [], // Changed to array to match DTO
        userId: "",
    })
    const [selectedFiles, setSelectedFiles] = useState([]) // Changed to array
    const [filePreviews, setFilePreviews] = useState([]) // Changed to array
    const [location, setLocation] = useState("")
    const [contact, setContact] = useState("")
    const [userType, setUserType] = useState("individual")
    const [adoptionTypes, setAdoptionTypes] = useState({
        adoptie_permanenta: false,
        foster: false,
        adoptie_la_distanta: false,
    })
    const [isEditing, setIsEditing] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [userId, setUserId] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    const API_BASE_URL = "http://localhost:8083"
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchCurrentUserId()
    }, [])

    useEffect(() => {
        if (userId) {
            fetchUserAnimals()
            fetchUserInfo()
        }
    }, [userId])

    const fetchCurrentUserId = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_BASE_URL}/currentUserId`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = "/login"
                    return
                }
                throw new Error("Failed to fetch user session")
            }

            const userId = await response.text()
            if (userId) {
                setUserId(userId)
                console.log("Current user ID:", userId)
            } else {
                throw new Error("Invalid user data received")
            }
        } catch (err) {
            console.error("Error fetching user ID:", err)
            setError("Nu sunteți conectat. Vă rugăm să vă autentificați.")
        } finally {
            setLoading(false)
        }
    }

    const fetchUserInfo = async () => {
        if (!userId) return

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: "GET",
                credentials: "include",
            })

            if (!response.ok) {
                console.error("Failed to fetch user info:", response.status, response.statusText)
                return
            }

            const userData = await response.json()
            console.log("User data:", userData)

            if (userData.contact) setContact(userData.contact)
            if (userData.type) setUserType(userData.type)
        } catch (err) {
            console.error("Error fetching user info:", err)
        }
    }

    const fetchUserAnimals = async () => {
        if (!userId) return

        try {
            setLoading(true)
            console.log("Fetching animals for user:", userId)

            const response = await fetch(`${API_BASE_URL}/animalCatalog?userId=${userId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch animals: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("Fetched animals:", data)

            // Ensure images is always an array
            const processedData = data.map((animal) => ({
                ...animal,
                image: animal.image || (animal.images ? animal.images : []),
            }))

            setAnimals(processedData)
        } catch (err) {
            console.error("Error fetching animals:", err)
            setError("Failed to load animals. Please try again later.")
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        // Limit to 5 images maximum
        const maxImages = 5
        const currentImageCount = filePreviews.length
        const availableSlots = maxImages - currentImageCount

        if (availableSlots <= 0) {
            setError(`Poți adăuga maximum ${maxImages} imagini.`)
            return
        }

        const filesToProcess = files.slice(0, availableSlots)

        if (files.length > availableSlots) {
            setError(
                `Ai selectat ${files.length} imagini, dar poți adăuga doar ${availableSlots} mai multe. Primele ${availableSlots} au fost adăugate.`,
            )
        }

        const newSelectedFiles = [...selectedFiles, ...filesToProcess]
        setSelectedFiles(newSelectedFiles)

        // Process each file for preview
        filesToProcess.forEach((file) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const newPreview = e.target.result
                setFilePreviews((prev) => [...prev, newPreview])
                setNewAnimal((prevAnimal) => ({
                    ...prevAnimal,
                    image: [...prevAnimal.image, newPreview],
                }))
            }
            reader.readAsDataURL(file)
        })

        // Clear the input so the same files can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const removeImage = (index) => {
        const newPreviews = filePreviews.filter((_, i) => i !== index)
        const newSelectedFiles = selectedFiles.filter((_, i) => i !== index)
        const newImages = newAnimal.image.filter((_, i) => i !== index)

        setFilePreviews(newPreviews)
        setSelectedFiles(newSelectedFiles)
        setNewAnimal({
            ...newAnimal,
            image: newImages,
        })
    }

    const clearAllImages = () => {
        setSelectedFiles([])
        setFilePreviews([])
        setNewAnimal({
            ...newAnimal,
            image: [],
        })
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleAdoptionTypeToggle = (type) => {
        setAdoptionTypes((prev) => ({
            ...prev,
            [type]: !prev[type],
        }))
    }

    // Convert adoption types object to list format for DTO
    const convertAdoptionTypesToList = (adoptionTypesObj) => {
        const types = []
        if (adoptionTypesObj.adoptie_permanenta) types.push("adoptie_permanenta")
        if (adoptionTypesObj.foster) types.push("foster")
        if (adoptionTypesObj.adoptie_la_distanta) types.push("adoptie_la_distanta")
        return types
    }

    const addAnimal = async (e) => {
        e.preventDefault()

        if (!userId) {
            setError("Vă rugăm să vă autentificați pentru a adăuga un anunț.")
            return
        }

        if (!newAnimal.name || !newAnimal.species) {
            setError("Numele și specia animalului sunt obligatorii.")
            return
        }

        // Check if at least one adoption type is selected
        const hasSelectedAdoptionType = Object.values(adoptionTypes).some((type) => type === true)
        if (!hasSelectedAdoptionType) {
            setError("Vă rugăm să selectați cel puțin un tip de adopție.")
            return
        }

        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)

            const currentId = userId

            if (!currentId) {
                throw new Error("User ID is not available")
            }

            // Create AnimalDTO exactly as specified
            const animalDTO = {
                name: newAnimal.name,
                species: newAnimal.species,
                description: newAnimal.description,
                image: newAnimal.image, // List<String> as per DTO
                userId: currentId,
                typesOfAdoption: convertAdoptionTypesToList(adoptionTypes), // List<String> as per DTO
            }

            console.log("Creating animal with AnimalDTO:", animalDTO)

            const animalResponse = await fetch(`${API_BASE_URL}/createAnimal`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(animalDTO),
                credentials: "include",
            })

            const animalResponseText = await animalResponse.text()
            console.log("Animal creation response:", animalResponseText)

            if (!animalResponse.ok) {
                console.error("Failed to create animal:", animalResponseText)
                throw new Error("Failed to create animal")
            }

            console.log("Animal created successfully")

            let hasErrors = false
            const errorMessages = []

            if (location) {
                try {
                    console.log("Updating location with:", location)
                    const locationResponse = await fetch(`${API_BASE_URL}/${currentId}/update-location`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            location: location,
                        }),
                        credentials: "include",
                    })

                    const responseText = await locationResponse.text()
                    console.log("Location update response:", responseText)

                    if (!locationResponse.ok) {
                        console.error("Location update failed:", responseText)
                        hasErrors = true
                        errorMessages.push("Locația nu a putut fi actualizată, dar animalul a fost salvat")
                    }
                } catch (err) {
                    console.error("Location update error:", err)
                    hasErrors = true
                    errorMessages.push("Locația nu a putut fi actualizată, dar animalul a fost salvat")
                }
            }

            if (userType || contact) {
                try {
                    const updateData = {}
                    if (userType) updateData.type = userType
                    if (contact) updateData.contact = contact

                    console.log("Updating user info with:", updateData)
                    const userInfoResponse = await fetch(`${API_BASE_URL}/update-info`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updateData),
                        credentials: "include",
                    })

                    const responseText = await userInfoResponse.text()
                    console.log("User info update response:", responseText)

                    if (!userInfoResponse.ok) {
                        console.error("User info update failed:", responseText)
                        hasErrors = true
                        errorMessages.push("Informațiile utilizatorului nu au putut fi actualizate, dar animalul a fost salvat")
                    }
                } catch (err) {
                    console.error("User info update error:", err)
                    hasErrors = true
                    errorMessages.push("Informațiile utilizatorului nu au putut fi actualizate, dar animalul a fost salvat")
                }
            }

            await fetchUserAnimals()

            // Reset form
            setNewAnimal({
                name: "",
                species: "",
                description: "",
                image: [],
                userId: "",
            })
            setLocation("")
            setAdoptionTypes({
                adoptie_permanenta: false,
                foster: false,
                adoptie_la_distanta: false,
            })
            setIsEditing(false)
            setEditingId(null)
            setSelectedFiles([])
            setFilePreviews([])

            if (hasErrors) {
                setError(`Animalul a fost salvat, dar unele actualizări au eșuat: ${errorMessages.join(", ")}`)
            } else {
                setSuccessMessage("Animalul a fost adăugat cu succes!")
                setError(null)
            }
        } catch (err) {
            console.error("Error adding animal:", err)
            setError("Nu s-a putut salva animalul. Vă rugăm să încercați din nou.")
        } finally {
            setLoading(false)
        }
    }

    const updateAnimal = async (e) => {
        e.preventDefault()

        if (!userId || !editingId) {
            setError("Nu se poate actualiza animalul.")
            return
        }

        // Check if at least one adoption type is selected
        const hasSelectedAdoptionType = Object.values(adoptionTypes).some((type) => type === true)
        if (!hasSelectedAdoptionType) {
            setError("Vă rugăm să selectați cel puțin un tip de adopție.")
            return
        }

        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)

            const currentId = userId

            if (!currentId) {
                throw new Error("User ID is not available")
            }

            // Create AnimalDTO exactly as specified
            const animalDTO = {
                name: newAnimal.name,
                species: newAnimal.species,
                description: newAnimal.description,
                image: newAnimal.image, // List<String> as per DTO
                userId: currentId,
                typesOfAdoption: convertAdoptionTypesToList(adoptionTypes), // List<String> as per DTO
            }

            const updateData = Object.fromEntries(
                Object.entries(animalDTO).filter(([_, value]) => value !== undefined && value !== null && value !== ""),
            )

            let hasErrors = false
            const errorMessages = []

            if (Object.keys(updateData).length > 0) {
                console.log("Updating animal with AnimalDTO:", updateData)

                const animalResponse = await fetch(`${API_BASE_URL}/updateFullAnimal/${editingId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                    credentials: "include",
                })

                const responseText = await animalResponse.text()
                console.log("Animal update response:", responseText)

                if (!animalResponse.ok) {
                    console.error("Failed to update animal:", responseText)
                    throw new Error("Failed to update animal")
                }
            }

            if (location) {
                try {
                    console.log("Updating location with:", location)
                    const locationResponse = await fetch(`${API_BASE_URL}/${currentId}/update-location`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            location: location,
                        }),
                        credentials: "include",
                    })

                    const responseText = await locationResponse.text()
                    console.log("Location update response:", responseText)

                    if (!locationResponse.ok) {
                        console.error("Location update failed:", responseText)
                        hasErrors = true
                        errorMessages.push("Locația nu a putut fi actualizată, dar animalul a fost actualizat")
                    }
                } catch (err) {
                    console.error("Location update error:", err)
                    hasErrors = true
                    errorMessages.push("Locația nu a putut fi actualizată, dar animalul a fost actualizat")
                }
            }

            if (userType || contact) {
                try {
                    const userUpdateData = {}
                    if (userType) userUpdateData.type = userType
                    if (contact) userUpdateData.contact = contact

                    console.log("Updating user info with:", userUpdateData)
                    const userInfoResponse = await fetch(`${API_BASE_URL}/update-info`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(userUpdateData),
                        credentials: "include",
                    })

                    const responseText = await userInfoResponse.text()
                    console.log("User info update response:", responseText)

                    if (!userInfoResponse.ok) {
                        console.error("User info update failed:", responseText)
                        hasErrors = true
                        errorMessages.push("Informațiile utilizatorului nu au putut fi actualizate, dar animalul a fost actualizat")
                    }
                } catch (err) {
                    console.error("User info update error:", err)
                    hasErrors = true
                    errorMessages.push("Informațiile utilizatorului nu au putut fi actualizate, dar animalul a fost actualizat")
                }
            }

            await fetchUserAnimals()

            // Reset form
            setNewAnimal({
                name: "",
                species: "",
                description: "",
                image: [],
                userId: "",
            })
            setLocation("")
            setAdoptionTypes({
                adoptie_permanenta: false,
                foster: false,
                adoptie_la_distanta: false,
            })
            setIsEditing(false)
            setEditingId(null)
            setSelectedFiles([])
            setFilePreviews([])

            if (hasErrors) {
                setError(`Animalul a fost actualizat, dar unele actualizări au eșuat: ${errorMessages.join(", ")}`)
            } else {
                setSuccessMessage("Animalul a fost actualizat cu succes!")
                setError(null)
            }
        } catch (err) {
            console.error("Error updating animal:", err)
            setError("Nu s-a putut actualiza animalul. Vă rugăm să încercați din nou.")
        } finally {
            setLoading(false)
        }
    }

    const deleteAnimal = async (id) => {
        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)

            console.log("Deleting animal with ID:", id)
            const response = await fetch(`${API_BASE_URL}/deleteAnimal/${id}`, {
                method: "DELETE",
                credentials: "include",
            })

            const responseText = await response.text()
            console.log("Delete response:", responseText)

            if (!response.ok) {
                console.error("Failed to delete animal:", responseText)
                throw new Error("Failed to delete animal")
            }

            await fetchUserAnimals()
            setSuccessMessage("Animalul a fost șters cu succes!")
        } catch (err) {
            console.error("Error deleting animal:", err)
            setError("Nu s-a putut șterge animalul. Vă rugăm să încercați din nou.")
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = async (animal) => {
        setNewAnimal({
            name: animal.name,
            species: animal.species,
            description: animal.description,
            image: animal.image || [],
            userId: animal.userId,
        })
        setLocation(animal.place || "")
        setContact(animal.contact || "")
        setUserType(animal.type || "individual")

        // Convert typesOfAdoption list back to object format
        const adoptionTypesObj = {
            adoptie_permanenta: false,
            foster: false,
            adoptie_la_distanta: false,
        }

        if (animal.typesOfAdoption && Array.isArray(animal.typesOfAdoption)) {
            animal.typesOfAdoption.forEach((type) => {
                if (adoptionTypesObj.hasOwnProperty(type)) {
                    adoptionTypesObj[type] = true
                }
            })
        } else if (animal.adoptionTypes) {
            // Backward compatibility
            adoptionTypesObj.adoptie_permanenta = animal.adoptionTypes.adoptie_permanenta || false
            adoptionTypesObj.foster = animal.adoptionTypes.foster || false
            adoptionTypesObj.adoptie_la_distanta = animal.adoptionTypes.adoptie_la_distanta || false
        }

        setAdoptionTypes(adoptionTypesObj)
        setIsEditing(true)
        setEditingId(animal.id)
        setError(null)
        setSuccessMessage(null)

        // Handle existing images
        if (animal.image && animal.image.length > 0) {
            setFilePreviews(animal.image)
        } else {
            setFilePreviews([])
        }
        setSelectedFiles([])
    }

    const handleCancel = () => {
        setNewAnimal({
            name: "",
            species: "",
            description: "",
            image: [],
            userId: "",
        })
        setLocation("")
        setContact("")
        setAdoptionTypes({
            adoptie_permanenta: false,
            foster: false,
            adoptie_la_distanta: false,
        })
        setIsEditing(false)
        setEditingId(null)
        setError(null)
        setSuccessMessage(null)
        setSelectedFiles([])
        setFilePreviews([])
    }

    return (
        <div className="min-h-screen">
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600" />
                        <span className="text-xl font-bold">PetPal Adoptions</span>
                    </a>
                    <nav className="flex gap-6 items-center">
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
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <h1 className="text-3xl font-bold mb-6 text-center">Adaugă anunț nou</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                        <button className="float-right font-bold" onClick={() => setError(null)}>
                            &times;
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {successMessage}
                        <button className="float-right font-bold" onClick={() => setSuccessMessage(null)}>
                            &times;
                        </button>
                    </div>
                )}

                <Card className="mb-8 w-full">
                    <CardHeader>
                        <CardTitle>{isEditing ? "Editează Anunț" : "Detalii Anunț"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={isEditing ? updateAnimal : addAnimal} className="space-y-4">
                            <div>
                                <Label htmlFor="userType">Tip Utilizator</Label>
                                <RadioGroup value={userType} onValueChange={setUserType} className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="individual" id="individual" />
                                        <Label htmlFor="individual">Individual</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="shelter" id="shelter" />
                                        <Label htmlFor="shelter">Adăpost</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div>
                                <Label htmlFor="name">Nume Animal</Label>
                                <Input
                                    id="name"
                                    value={newAnimal.name}
                                    onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })}
                                    placeholder="Introduceți numele animalului"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="species">Specie</Label>
                                <Input
                                    id="species"
                                    value={newAnimal.species}
                                    onChange={(e) => setNewAnimal({ ...newAnimal, species: e.target.value })}
                                    placeholder="Introduceți specia"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Descriere</Label>
                                <Textarea
                                    id="description"
                                    value={newAnimal.description}
                                    onChange={(e) => setNewAnimal({ ...newAnimal, description: e.target.value })}
                                    placeholder="Introduceți descrierea"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label htmlFor="location">Locație (Adresă)</Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Introduceți locația"
                                />
                            </div>

                            <div>
                                <Label htmlFor="contact">Informații de Contact</Label>
                                <Input
                                    id="contact"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="Telefon sau email pentru contact"
                                />
                            </div>

                            <div>
                                <Label className="text-base font-medium mb-3 block">Tipuri de Adopție Disponibile</Label>
                                <p className="text-sm text-gray-600 mb-4">
                                    Selectați tipurile de adopție disponibile pentru acest animal (cel puțin unul):
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <Checkbox
                                            id="adoptie_permanenta"
                                            checked={adoptionTypes.adoptie_permanenta}
                                            onCheckedChange={(checked) => handleAdoptionTypeToggle("adoptie_permanenta")}
                                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        />
                                        <Label htmlFor="adoptie_permanenta" className="flex-1 cursor-pointer font-medium text-green-700">
                                            Adopție permanentă
                                        </Label>
                                        <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-600"></div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <Checkbox
                                            id="foster"
                                            checked={adoptionTypes.foster}
                                            onCheckedChange={(checked) => handleAdoptionTypeToggle("foster")}
                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <Label htmlFor="foster" className="flex-1 cursor-pointer font-medium text-blue-700">
                                            Foster
                                        </Label>
                                        <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-600"></div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <Checkbox
                                            id="adoptie_la_distanta"
                                            checked={adoptionTypes.adoptie_la_distanta}
                                            onCheckedChange={(checked) => handleAdoptionTypeToggle("adoptie_la_distanta")}
                                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <Label htmlFor="adoptie_la_distanta" className="flex-1 cursor-pointer font-medium text-purple-700">
                                            Adopție la distanță
                                        </Label>
                                        <div className="w-4 h-4 rounded-full bg-purple-100 border-2 border-purple-600"></div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label>Imagini Animal (maximum 5)</Label>
                                <div className="space-y-2 mt-2">
                                    <Input
                                        ref={fileInputRef}
                                        id="imageFiles"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="cursor-pointer"
                                    />
                                    <p className="text-sm text-gray-500">
                                        Poți selecta până la 5 imagini. Imaginile vor fi afișate într-un carusel cu funcție de swipe.
                                    </p>

                                    {filePreviews.length > 0 && (
                                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-600">
                        {filePreviews.length} imagine{filePreviews.length !== 1 ? "i" : ""} selectată
                          {filePreviews.length !== 1 ? "e" : ""}
                      </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={clearAllImages}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                Șterge toate
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {filePreviews.length > 0 && (
                                    <div className="mt-4">
                                        <ImageCarousel images={filePreviews} onRemove={removeImage} editable={true} />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-center">
                                <Button type="submit" className="px-6 py-3 text-lg" disabled={loading || !userId}>
                                    {loading ? "Se procesează..." : isEditing ? "Salvează Modificările" : "Adaugă Animal"}
                                </Button>
                                {isEditing && (
                                    <Button
                                        type="button"
                                        className="px-6 py-3 text-lg ml-4 bg-gray-500 hover:bg-gray-600"
                                        onClick={handleCancel}
                                    >
                                        Anulează
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Animalele tale</h2>
                    {loading && <p className="text-center">Se încarcă...</p>}

                    {animals.length === 0 && !loading ? (
                        <p className="text-center text-gray-500">Nu ai adăugat încă niciun animal.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {animals.map((animal) => (
                                <Card key={animal.id} className="overflow-hidden">
                                    <ImageCarousel images={animal.image} />
                                    <CardContent className="p-4">
                                        <h3 className="text-xl font-bold">{animal.name}</h3>
                                        <p className="text-sm text-gray-500">{animal.species}</p>
                                        <p className="mt-2">{animal.description}</p>
                                        {animal.place && (
                                            <p className="text-sm mt-2">
                                                <strong>Locație:</strong> {animal.place}
                                            </p>
                                        )}
                                        {animal.contact && (
                                            <p className="text-sm mt-2">
                                                <strong>Contact:</strong> {animal.contact}
                                            </p>
                                        )}
                                        {animal.location && (
                                            <p className="text-sm mt-2">
                                                <strong>Coordonate:</strong> {animal.location}
                                            </p>
                                        )}
                                        {animal.type && (
                                            <p className="text-sm mt-2">
                                                <strong>Tip:</strong> {animal.type === "individual" ? "Individual" : "Adăpost"}
                                            </p>
                                        )}
                                        {(animal.typesOfAdoption || animal.adoptionTypes) && (
                                            <div className="text-sm mt-2">
                                                <strong>Tipuri adopție disponibile:</strong>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {/* Handle new format (typesOfAdoption list) */}
                                                    {animal.typesOfAdoption &&
                                                        Array.isArray(animal.typesOfAdoption) &&
                                                        animal.typesOfAdoption.map((type) => (
                                                            <span
                                                                key={type}
                                                                className={`px-2 py-1 rounded-full text-xs ${
                                                                    type === "adoptie_permanenta"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : type === "foster"
                                                                            ? "bg-blue-100 text-blue-800"
                                                                            : "bg-purple-100 text-purple-800"
                                                                }`}
                                                            >
                                {type === "adoptie_permanenta"
                                    ? "Adopție permanentă"
                                    : type === "foster"
                                        ? "Foster"
                                        : "Adopție la distanță"}
                              </span>
                                                        ))}
                                                    {/* Handle old format (adoptionTypes object) for backward compatibility */}
                                                    {animal.adoptionTypes && !animal.typesOfAdoption && (
                                                        <>
                                                            {animal.adoptionTypes.adoptie_permanenta && (
                                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                  Adopție permanentă
                                </span>
                                                            )}
                                                            {animal.adoptionTypes.foster && (
                                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Foster</span>
                                                            )}
                                                            {animal.adoptionTypes.adoptie_la_distanta && (
                                                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                  Adopție la distanță
                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-end mt-4 space-x-2">
                                            <Button onClick={() => handleEdit(animal)} className="p-2 bg-blue-500 hover:bg-blue-600">
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                                onClick={() => deleteAnimal(animal.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600"
                                                disabled={loading}
                                            >
                                                <Trash className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default EditorCatalog
