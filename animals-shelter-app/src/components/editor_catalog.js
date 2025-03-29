import { useState, useEffect } from "react"
import { LogOut, PawPrint, Pencil, Trash } from 'lucide-react'
import Button from "./ui/Button"
import Input from "./ui/Input"
import Label from "./ui/Label"
import Textarea from "./ui/Textarea"
import { RadioGroup, RadioGroupItem } from "./ui/Radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"

const EditorCatalog = () => {
    const [animals, setAnimals] = useState([])
    const [newAnimal, setNewAnimal] = useState({
        name: "",
        species: "",
        description: "",
        imageUrl: "",
        imageFile: null,
        userId: "",
    })
    const [location, setLocation] = useState("")
    const [contact, setContact] = useState("")
    const [userType, setUserType] = useState("individual")
    const [isEditing, setIsEditing] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [userId, setUserId] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    const API_BASE_URL = "http://localhost:8083"

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

            // Update state with user data
            if (userData.contact) setContact(userData.contact)
            if (userData.type) setUserType(userData.type)
        } catch (err) {
            console.error("Error fetching user info:", err)
        }
    }

    const fetchUserAnimals = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            console.log("Fetching animals for user:", userId);

            const response = await fetch(`${API_BASE_URL}/animalCatalog?userId=${userId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch animals: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Fetched animals:", data);
            setAnimals(data);
        } catch (err) {
            console.error("Error fetching animals:", err);
            setError("Failed to load animals. Please try again later.");
        } finally {
            setLoading(false);
        }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            setNewAnimal({ ...newAnimal, imageFile: file, imageUrl: URL.createObjectURL(file) })
        }
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
                imageUrl: newAnimal.imageUrl || `/placeholder.svg?height=200&width=200`,
                userId: currentId,
            }

            // Step 1: Create the animal
            console.log("Creating animal with data:", animalDTO)
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

            // Animal was created successfully
            let hasErrors = false
            let errorMessages = []

            // Step 2: Try to update location, but don't fail the whole operation if it fails
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
                imageUrl: "",
                imageFile: null,
                userId: "",
            })
            setLocation("")
            setIsEditing(false)
            setEditingId(null)

            if (hasErrors) {
                setError(`Animalul a fost salvat, dar unele actualizări au eșuat: ${errorMessages.join(", ")}`)
            } else {
                // Show success message
                setSuccessMessage("Animalul a fost adăugat cu succes!")
                setError(null) // Clear any previous errors
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

            const animalFields = {
                name: newAnimal.name,
                species: newAnimal.species,
                description: newAnimal.description,
                imageUrl: newAnimal.imageUrl,
                userId: currentId,
            }

            const updateData = Object.fromEntries(
                Object.entries(animalFields).filter(([_, value]) => value !== undefined && value !== "")
            )

            let hasErrors = false
            let errorMessages = []

            if (Object.keys(updateData).length > 0) {
                console.log("Updating animal with data:", updateData)
                const animalResponse = await fetch(`${API_BASE_URL}/updateAnimal/${editingId}`, {
                    method: "PATCH",
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

            // Step 3: Update user type and contact
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

            // Step 4: Refresh the animals list
            await fetchUserAnimals()

            // Reset form
            setNewAnimal({
                name: "",
                species: "",
                description: "",
                imageUrl: "",
                imageFile: null,
                userId: "",
            })
            setLocation("")
            setIsEditing(false)
            setEditingId(null)

            // Show warning if there were partial failures, but don't treat it as a complete error
            if (hasErrors) {
                setError(`Animalul a fost actualizat, dar unele actualizări au eșuat: ${errorMessages.join(", ")}`)
            } else {
                // Show success message
                setSuccessMessage("Animalul a fost actualizat cu succes!")
                setError(null) // Clear any previous errors
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

    const handleEdit = (animal) => {
        setNewAnimal({
            name: animal.name,
            species: animal.species,
            description: animal.description,
            imageUrl: animal.imageUrl,
            imageFile: null,
            userId: animal.userId,
        })
        setLocation(animal.place || "")
        setContact(animal.contact || "")
        setUserType(animal.type || "individual")
        setIsEditing(true)
        setEditingId(animal.id)
        setError(null)
        setSuccessMessage(null)
    }

    const handleCancel = () => {
        setNewAnimal({
            name: "",
            species: "",
            description: "",
            imageUrl: "",
            imageFile: null,
            userId: "",
        })
        setLocation("")
        setContact("")
        setIsEditing(false)
        setEditingId(null)
        setError(null)
        setSuccessMessage(null)
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
                                <Label htmlFor="imageUpload">Imagine</Label>
                                <input
                                    type="file"
                                    id="imageUpload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="block w-full text-sm border border-gray-300 rounded-lg p-2"
                                />
                                {newAnimal.imageUrl && (
                                    <img
                                        src={newAnimal.imageUrl || "/placeholder.svg?height=200&width=200"}
                                        alt="Preview"
                                        className="mt-4 w-full max-h-64 object-cover rounded-lg"
                                    />
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
                                    {animal.imageUrl && (
                                        <img
                                            src={animal.imageUrl || "/placeholder.svg?height=200&width=200"}
                                            alt={animal.name}
                                            className="w-full h-48 object-cover"
                                        />
                                    )}
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