import { useState, useEffect, useRef } from "react"
import { LogOut, PawPrint, Pencil, Trash, ChevronLeft, ChevronRight, X, Menu } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import Label from "./ui/Label"
import Textarea from "./ui/Textarea"
import { RadioGroup, RadioGroupItem } from "./ui/Radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Checkbox } from "./ui/Checkbox"
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
            <div className="w-full h-48 sm:h-56 lg:h-48 bg-gray-100 flex items-center justify-center rounded-lg">
                <div className="text-gray-400 text-sm sm:text-base">Fără imagini</div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-48 sm:h-56 lg:h-48 bg-gray-100 rounded-lg overflow-hidden">
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

            {images.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 sm:p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 sm:p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                </>
            )}

            {editable && (
                <button
                    onClick={() => removeImage(currentIndex)}
                    className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
            {images.length > 1 && (
                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                                index === currentIndex ? "bg-white" : "bg-white bg-opacity-50"
                            }`}
                        />
                    ))}
                </div>
            )}

            {images.length > 1 && (
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black bg-opacity-50 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
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
        image: [],
        userId: "",
    })
    const [selectedFiles, setSelectedFiles] = useState([])
    const [filePreviews, setFilePreviews] = useState([])
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = (error) => reject(error)
            reader.readAsDataURL(file)
        })
    }

    const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            const img = new Image()

            img.crossOrigin = "anonymous"
            img.onload = () => {
                let { width, height } = img

                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width
                        width = maxWidth
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height
                        height = maxHeight
                    }
                }

                canvas.width = width
                canvas.height = height
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob)
                        } else {
                            reject(new Error("Canvas to Blob conversion failed"))
                        }
                    },
                    "image/jpeg",
                    quality,
                )
            }

            img.onerror = () => reject(new Error("Image loading failed"))
            img.src = URL.createObjectURL(file)
        })
    }

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return
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

        try {
            setLoading(true)
            const processedImages = []

            for (const file of filesToProcess) {
                try {
                    const resizedBlob = await resizeImage(file, 800, 600, 0.8)
                    const base64String = await convertFileToBase64(resizedBlob)
                    processedImages.push(base64String)
                } catch (error) {
                    setError(`Eroare la procesarea imaginii ${file.name}. Vă rugăm să încercați din nou.`)
                    return
                }
            }
            const newSelectedFiles = [...selectedFiles, ...filesToProcess]
            const newPreviews = [...filePreviews, ...processedImages]
            const newBase64Images = [...newAnimal.image, ...processedImages]

            setSelectedFiles(newSelectedFiles)
            setFilePreviews(newPreviews)
            setNewAnimal((prevAnimal) => ({
                ...prevAnimal,
                image: newBase64Images,
            }))

            console.log("Images resized and converted to base64:", processedImages.length, "images")
        } catch (error) {
            console.error("Error converting files to base64:", error)
            setError("Eroare la procesarea imaginilor. Vă rugăm să încercați din nou.")
        } finally {
            setLoading(false)
        }
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
        setAdoptionTypes((prev) => {
            const newState = {
                ...prev,
                [type]: !prev[type],
            }
            console.log(`Toggling ${type}:`, prev[type], "->", newState[type])
            console.log("New adoption types state:", newState)
            return newState
        })
    }
    const convertAdoptionTypesToList = (adoptionTypesObj) => {
        const types = []
        if (adoptionTypesObj.adoptie_permanenta) types.push("Adoptie permanenta")
        if (adoptionTypesObj.foster) types.push("Foster")
        if (adoptionTypesObj.adoptie_la_distanta) types.push("Adoptie la distanta")
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
        const hasSelectedAdoptionType = Object.values(adoptionTypes).some((type) => type === true)
        console.log("Adoption types state:", adoptionTypes)
        console.log("Has selected adoption type:", hasSelectedAdoptionType)
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
            const animalDTO = {
                name: newAnimal.name,
                species: newAnimal.species,
                description: newAnimal.description,
                images: newAnimal.image,
                userId: currentId,
                typesOfAdoption: convertAdoptionTypesToList(adoptionTypes),
            }

            console.log("Creating animal with AnimalDTO (base64 images):", {
                ...animalDTO,
                images: animalDTO.images.map((img, index) => `Base64 image ${index + 1} (${img.length} chars)`),
            })

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

            console.log("Animal created successfully with base64 images")

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

        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)

            const currentId = userId

            if (!currentId) {
                throw new Error("User ID is not available")
            }

            let hasErrors = false
            const errorMessages = []
            const fieldsToUpdate = []

            if (newAnimal.name) {
                fieldsToUpdate.push({ field: "name", value: newAnimal.name })
            }
            if (newAnimal.species) {
                fieldsToUpdate.push({ field: "species", value: newAnimal.species })
            }
            if (newAnimal.description) {
                fieldsToUpdate.push({ field: "description", value: newAnimal.description })
            }

            const adoptionTypesList = convertAdoptionTypesToList(adoptionTypes)
            if (adoptionTypesList.length > 0) {
                fieldsToUpdate.push({ field: "typesOfAdoptions", value: adoptionTypesList.join(",") })
            }
            for (const { field, value } of fieldsToUpdate) {
                try {
                    console.log(`Updating field ${field} with value:`, value)

                    const updateData = { [field]: value }

                    const animalResponse = await fetch(`${API_BASE_URL}/updateAnimal/${editingId}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updateData),
                        credentials: "include",
                    })

                    const responseText = await animalResponse.text()
                    console.log(`Update response for ${field}:`, responseText)

                    if (!animalResponse.ok) {
                        console.error(`Failed to update ${field}:`, responseText)
                        hasErrors = true
                        errorMessages.push(`Nu s-a putut actualiza ${field}`)
                    }
                } catch (err) {
                    console.error(`Error updating ${field}:`, err)
                    hasErrors = true
                    errorMessages.push(`Eroare la actualizarea ${field}`)
                }
            }
            if (newAnimal.image && newAnimal.image.length > 0) {
                try {
                    console.log("Images update not implemented in backend yet")
                } catch (err) {
                    console.error("Error updating images:", err)
                    hasErrors = true
                    errorMessages.push("Nu s-au putut actualiza imaginile")
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
                        errorMessages.push("Locația nu a putut fi actualizată")
                    }
                } catch (err) {
                    console.error("Location update error:", err)
                    hasErrors = true
                    errorMessages.push("Locația nu a putut fi actualizată")
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
                        errorMessages.push("Informațiile utilizatorului nu au putut fi actualizate")
                    }
                } catch (err) {
                    console.error("User info update error:", err)
                    hasErrors = true
                    errorMessages.push("Informațiile utilizatorului nu au putut fi actualizate")
                }
            }

            await fetchUserAnimals()
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
                setError(`Unele actualizări au eșuat: ${errorMessages.join(", ")}`)
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

        const adoptionTypesObj = {
            adoptie_permanenta: false,
            foster: false,
            adoptie_la_distanta: false,
        }

        console.log("Original animal.typesOfAdoption:", animal.typesOfAdoption)

        if (animal.typesOfAdoption && Array.isArray(animal.typesOfAdoption)) {
            animal.typesOfAdoption.forEach((type) => {
                console.log("Processing adoption type:", type)
                if (type === "Adoptie permanenta") {
                    adoptionTypesObj.adoptie_permanenta = true
                    console.log("Set adoptie_permanenta to true")
                } else if (type === "Foster") {
                    adoptionTypesObj.foster = true
                    console.log("Set foster to true")
                } else if (type === "Adoptie la distanta") {
                    adoptionTypesObj.adoptie_la_distanta = true
                    console.log("Set adoptie_la_distanta to true")
                }
                else if (type === "adoptie_permanenta") {
                    adoptionTypesObj.adoptie_permanenta = true
                    console.log("Set adoptie_permanenta to true (old format)")
                } else if (type === "foster") {
                    adoptionTypesObj.foster = true
                    console.log("Set foster to true (old format)")
                } else if (type === "adoptie_la_distanta") {
                    adoptionTypesObj.adoptie_la_distanta = true
                    console.log("Set adoptie_la_distanta to true (old format)")
                }
            })
        } else if (animal.adoptionTypes) {
            console.log("Using old adoptionTypes format:", animal.adoptionTypes)
            adoptionTypesObj.adoptie_permanenta = animal.adoptionTypes.adoptie_permanenta || false
            adoptionTypesObj.foster = animal.adoptionTypes.foster || false
            adoptionTypesObj.adoptie_la_distanta = animal.adoptionTypes.adoptie_la_distanta || false
        }

        console.log("Final adoptionTypesObj before setState:", adoptionTypesObj)
        setAdoptionTypes(adoptionTypesObj)
        setTimeout(() => {
            console.log("Adoption types state after setTimeout:", adoptionTypes)
        }, 100)

        setIsEditing(true)
        setEditingId(animal.id)
        setError(null)
        setSuccessMessage(null)
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

    const deleteAnimal = async (animalId) => {
        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)

            const response = await fetch(`${API_BASE_URL}/deleteAnimal/${animalId}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error("Failed to delete animal:", errorText)
                throw new Error(`Failed to delete animal: ${errorText}`)
            }

            console.log("Animal deleted successfully")
            setSuccessMessage("Animalul a fost șters cu succes!")
            await fetchUserAnimals() // Refresh animal list
        } catch (err) {
            console.error("Error deleting animal:", err)
            setError("Nu s-a putut șterge animalul. Vă rugăm să încercați din nou.")
        } finally {
            setLoading(false)
        }
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
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                        Adaugă anunț nou
                    </h1>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded mb-4 text-sm sm:text-base">
                            {error}
                            <button className="float-right font-bold" onClick={() => setError(null)}>
                                &times;
                            </button>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-4 py-3 rounded mb-4 text-sm sm:text-base">
                            {successMessage}
                            <button className="float-right font-bold" onClick={() => setSuccessMessage(null)}>
                                &times;
                            </button>
                        </div>
                    )}

                    <Card className="mb-6 sm:mb-8 w-full">
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">{isEditing ? "Editează Anunț" : "Detalii Anunț"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={isEditing ? updateAnimal : addAnimal} className="space-y-4 sm:space-y-6">
                                <div>
                                    <Label htmlFor="userType" className="text-sm sm:text-base">
                                        Tip Utilizator
                                    </Label>
                                    <RadioGroup value={userType} onValueChange={setUserType} className="flex flex-col space-y-2 mt-2">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="individual" id="individual" />
                                            <Label htmlFor="individual" className="text-sm sm:text-base">
                                                Individual
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="shelter" id="shelter" />
                                            <Label htmlFor="shelter" className="text-sm sm:text-base">
                                                Adăpost
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name" className="text-sm sm:text-base">
                                            Nume Animal
                                        </Label>
                                        <Input
                                            id="name"
                                            value={newAnimal.name}
                                            onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })}
                                            placeholder="Introduceți numele animalului"
                                            className="mt-1 text-sm sm:text-base"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="species" className="text-sm sm:text-base">
                                            Specie
                                        </Label>
                                        <Input
                                            id="species"
                                            value={newAnimal.species}
                                            onChange={(e) => setNewAnimal({ ...newAnimal, species: e.target.value })}
                                            placeholder="Introduceți specia"
                                            className="mt-1 text-sm sm:text-base"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="description" className="text-sm sm:text-base">
                                        Descriere
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={newAnimal.description}
                                        onChange={(e) => setNewAnimal({ ...newAnimal, description: e.target.value })}
                                        placeholder="Introduceți descrierea"
                                        rows={3}
                                        className="mt-1 text-sm sm:text-base"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="location" className="text-sm sm:text-base">
                                            Locație (Adresă)
                                        </Label>
                                        <Input
                                            id="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Introduceți locația"
                                            className="mt-1 text-sm sm:text-base"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="contact" className="text-sm sm:text-base">
                                            Informații de Contact
                                        </Label>
                                        <Input
                                            id="contact"
                                            value={contact}
                                            onChange={(e) => setContact(e.target.value)}
                                            placeholder="Telefon sau email pentru contact"
                                            className="mt-1 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm sm:text-base font-medium mb-3 block">Tipuri de Adopție Disponibile</Label>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                                        Selectați tipurile de adopție disponibile pentru acest animal (cel puțin unul):
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <Checkbox
                                                id="adoptie_permanenta"
                                                checked={adoptionTypes.adoptie_permanenta}
                                                onCheckedChange={(checked) => {
                                                    console.log("Permanent adoption checkbox changed to:", checked)
                                                    setAdoptionTypes((prev) => {
                                                        const newState = {
                                                            ...prev,
                                                            adoptie_permanenta: checked === true,
                                                        }
                                                        console.log("New adoption types state:", newState)
                                                        return newState
                                                    })
                                                }}
                                                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                            />
                                            <Label
                                                htmlFor="adoptie_permanenta"
                                                className="flex-1 cursor-pointer font-medium text-green-700 text-sm sm:text-base"
                                            >
                                                Adopție permanentă
                                            </Label>
                                            <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-600"></div>
                                        </div>

                                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <Checkbox
                                                id="foster"
                                                checked={adoptionTypes.foster}
                                                onCheckedChange={(checked) => {
                                                    console.log("Foster checkbox changed to:", checked)
                                                    setAdoptionTypes((prev) => {
                                                        const newState = {
                                                            ...prev,
                                                            foster: checked === true,
                                                        }
                                                        console.log("New adoption types state:", newState)
                                                        return newState
                                                    })
                                                }}
                                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                            <Label
                                                htmlFor="foster"
                                                className="flex-1 cursor-pointer font-medium text-blue-700 text-sm sm:text-base"
                                            >
                                                Foster
                                            </Label>
                                            <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-600"></div>
                                        </div>

                                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <Checkbox
                                                id="adoptie_la_distanta"
                                                checked={adoptionTypes.adoptie_la_distanta}
                                                onCheckedChange={(checked) => {
                                                    console.log("Remote adoption checkbox changed to:", checked)
                                                    setAdoptionTypes((prev) => {
                                                        const newState = {
                                                            ...prev,
                                                            adoptie_la_distanta: checked === true,
                                                        }
                                                        console.log("New adoption types state:", newState)
                                                        return newState
                                                    })
                                                }}
                                                className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                            />
                                            <Label
                                                htmlFor="adoptie_la_distanta"
                                                className="flex-1 cursor-pointer font-medium text-purple-700 text-sm sm:text-base"
                                            >
                                                Adopție la distanță
                                            </Label>
                                            <div className="w-4 h-4 rounded-full bg-purple-100 border-2 border-purple-600"></div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm sm:text-base">Imagini Animal (maximum 5)</Label>
                                    <div className="space-y-2 mt-2">
                                        <Input
                                            ref={fileInputRef}
                                            id="imageFiles"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="cursor-pointer text-sm sm:text-base"
                                            disabled={loading}
                                        />
                                        <p className="text-xs sm:text-sm text-gray-500">
                                            Poți selecta până la 5 imagini. Imaginile vor fi redimensionate (max 800x600px) și convertite în
                                            format base64 pentru optimizare.
                                        </p>

                                        {filePreviews.length > 0 && (
                                            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {filePreviews.length} imagine{filePreviews.length !== 1 ? "i" : ""} selectată
                            {filePreviews.length !== 1 ? "e" : ""} (Base64)
                        </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={clearAllImages}
                                                    className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
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

                                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg order-2 sm:order-1"
                                        disabled={loading || !userId}
                                    >
                                        {loading ? "Se procesează..." : isEditing ? "Salvează Modificările" : "Adaugă Animal"}
                                    </Button>
                                    {isEditing && (
                                        <Button
                                            type="button"
                                            className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg bg-gray-500 hover:bg-gray-600 order-1 sm:order-2"
                                            onClick={handleCancel}
                                        >
                                            Anulează
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="mt-6 sm:mt-8">
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">Animalele tale</h2>
                        {loading && <p className="text-center text-sm sm:text-base">Se încarcă...</p>}

                        {animals.length === 0 && !loading ? (
                            <p className="text-center text-gray-500 text-sm sm:text-base">Nu ai adăugat încă niciun animal.</p>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {animals.map((animal) => (
                                    <Card key={animal.id} className="overflow-hidden">
                                        <ImageCarousel images={animal.image} />
                                        <CardContent className="p-3 sm:p-4">
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{animal.name}</h3>
                                            <p className="text-xs sm:text-sm text-gray-500">{animal.species}</p>
                                            <p className="mt-2 text-sm sm:text-base text-gray-700 line-clamp-2">{animal.description}</p>

                                            <div className="mt-3 space-y-1">
                                                {animal.place && (
                                                    <p className="text-xs sm:text-sm">
                                                        <strong>Locație:</strong> {animal.place}
                                                    </p>
                                                )}
                                                {animal.contact && (
                                                    <p className="text-xs sm:text-sm">
                                                        <strong>Contact:</strong> {animal.contact}
                                                    </p>
                                                )}
                                                {animal.location && (
                                                    <p className="text-xs sm:text-sm">
                                                        <strong>Coordonate:</strong> {animal.location}
                                                    </p>
                                                )}
                                                {animal.type && (
                                                    <p className="text-xs sm:text-sm">
                                                        <strong>Tip:</strong> {animal.type === "individual" ? "Individual" : "Adăpost"}
                                                    </p>
                                                )}
                                            </div>

                                            {(animal.typesOfAdoption || animal.adoptionTypes) && (
                                                <div className="text-xs sm:text-sm mt-3">
                                                    <strong>Tipuri adopție disponibile:</strong>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {animal.typesOfAdoption &&
                                                            Array.isArray(animal.typesOfAdoption) &&
                                                            animal.typesOfAdoption.map((type) => (
                                                                <span
                                                                    key={type}
                                                                    className={`px-2 py-1 rounded-full text-xs ${
                                                                        type === "Adoptie permanenta" || type === "adoptie_permanenta"
                                                                            ? "bg-green-100 text-green-800"
                                                                            : type === "Foster" || type === "foster"
                                                                                ? "bg-blue-100 text-blue-800"
                                                                                : "bg-purple-100 text-purple-800"
                                                                    }`}
                                                                >
                                  {type === "adoptie_permanenta"
                                      ? "Adoptie permanenta"
                                      : type === "foster"
                                          ? "Foster"
                                          : type === "adoptie_la_distanta"
                                              ? "Adoptie la distanta"
                                              : type}
                                </span>
                                                            ))}
                                                        {/* Handle old format (adoptionTypes object) for backward compatibility */}
                                                        {animal.adoptionTypes && !animal.typesOfAdoption && (
                                                            <>
                                                                {animal.adoptionTypes.adoptie_permanenta && (
                                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    Adoptie permanenta
                                  </span>
                                                                )}
                                                                {animal.adoptionTypes.foster && (
                                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    Foster
                                  </span>
                                                                )}
                                                                {animal.adoptionTypes.adoptie_la_distanta && (
                                                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                    Adoptie la distanta
                                  </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2">
                                                <Button
                                                    onClick={() => handleEdit(animal)}
                                                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sm:hidden">Editează</span>
                                                    <span className="sr-only sm:not-sr-only">Editează</span>
                                                </Button>
                                                <Button
                                                    onClick={() => deleteAnimal(animal.id)}
                                                    className="p-2 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                                                    disabled={loading}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                    <span className="sm:hidden">Șterge</span>
                                                    <span className="sr-only sm:not-sr-only">Șterge</span>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default EditorCatalog
