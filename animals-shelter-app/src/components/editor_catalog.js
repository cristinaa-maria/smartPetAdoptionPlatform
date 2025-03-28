import { useState, useEffect } from "react"
import { LogOut, PawPrint, Pencil, Trash } from "lucide-react"
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
        place: "",
        imageFile: null,
    })
    const [location, setLocation] = useState("")
    const [contact, setContact] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [userType, setUserType] = useState("individual")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [userId, setUserId] = useState(null)

    useEffect(() => {
        fetchUserSession()
        fetchAnimals()
    }, [])

    const fetchUserSession = async () => {
        try {
            setLoading(true)
            const response = await fetch("http://localhost:8083/api/user/current", {
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

            const data = await response.json()
            if (data && data.id) {
                setUserId(data.id)
            } else {
                throw new Error("Invalid user data received")
            }
        } catch (err) {
            console.error("Error fetching user session:", err)
            setError("Nu sunteți conectat. Vă rugăm să vă autentificați.")
        } finally {
            setLoading(false)
        }
    }

    const fetchAnimals = async () => {
        try {
            setLoading(true)
            const response = await fetch("http://localhost:8083/animals", {
                credentials: "include",
            })

            if (!response.ok) {
                throw new Error("Failed to fetch animals")
            }

            const data = await response.json()
            setAnimals(data)
        } catch (err) {
            console.error("Error fetching animals:", err)
            setError("Failed to load animals. Please try again later.")
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            setNewAnimal({ ...newAnimal, imageFile: file, imageUrl: URL.createObjectURL(file) })
        }
    }

    const addAnimal = async () => {
        if (!userId) {
            setError("Vă rugăm să vă autentificați pentru a adăuga un anunț.")
            return
        }

        if (newAnimal.name && newAnimal.species) {
            try {
                setLoading(true)

                const animalDTO = {
                    name: newAnimal.name,
                    species: newAnimal.species,
                    description: newAnimal.description,
                    imageUrl: newAnimal.imageUrl || `/placeholder.svg?height=200&width=200`,
                    place: newAnimal.place,
                    userId: userId,
                }

                const url = new URL("http://localhost:8083/createAnimal")
                url.searchParams.append("location", location)
                url.searchParams.append("contact", contact)
                url.searchParams.append("type", userType)
                url.searchParams.append("userId", userId.toString())

                const response = await fetch(url.toString(), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(animalDTO),
                    credentials: "include",
                })

                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = "/login"
                        return
                    }
                    throw new Error("Failed to create animal")
                }

                await fetchAnimals()

                // Reset form
                setNewAnimal({
                    name: "",
                    species: "",
                    description: "",
                    imageUrl: "",
                    place: "",
                    imageFile: null,
                })
                setLocation("")
                setContact("")
                setIsEditing(false)
                setEditingId(null)
            } catch (err) {
                console.error("Error adding/updating animal:", err)
                setError("Failed to save animal. Please try again.")
            } finally {
                setLoading(false)
            }
        }
    }

    const updateAnimal = async (id, animalData) => {
        // Update each field individually as required by the backend
        for (const [field, value] of Object.entries(animalData)) {
            if (value) {
                try {
                    const response = await fetch(`http://localhost:8083/updateAnimal/${id}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ [field]: value }),
                        credentials: "include",
                    })

                    if (!response.ok) {
                        throw new Error(`Failed to update ${field}`)
                    }
                } catch (err) {
                    console.error(`Error updating ${field}:`, err)
                    throw err
                }
            }
        }

        if (location) {
            try {
                const response = await fetch(`http://localhost:8083/updateAnimal/${id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ location: location }),
                    credentials: "include",
                })

                if (!response.ok) {
                    throw new Error("Failed to update location")
                }
            } catch (err) {
                console.error("Error updating location:", err)
                throw err
            }
        }

        if (contact) {
            try {
                const response = await fetch(`http://localhost:8083/updateAnimal/${id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ contact: contact }),
                    credentials: "include",
                })

                if (!response.ok) {
                    throw new Error("Failed to update contact")
                }
            } catch (err) {
                console.error("Error updating contact:", err)
                throw err
            }
        }

        if (userType) {
            try {
                const response = await fetch(`http://localhost:8083/updateAnimal/${id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ type: userType }),
                    credentials: "include",
                })

                if (!response.ok) {
                    throw new Error("Failed to update type")
                }
            } catch (err) {
                console.error("Error updating type:", err)
                throw err
            }
        }
    }

    const deleteAnimal = async (id) => {
        try {
            setLoading(true)

            const response = await fetch(`http://localhost:8083/deleteAnimal/${id}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (!response.ok) {
                throw new Error("Failed to delete animal")
            }

            await fetchAnimals()
        } catch (err) {
            console.error("Error deleting animal:", err)
            setError("Failed to delete animal. Please try again.")
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
            place: animal.place,
            imageFile: null,
        })
        setLocation(animal.location || "")
        setContact(animal.contact || "")
        setUserType(animal.type || "individual")
        setIsEditing(true)
        setEditingId(animal.id)
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

                {userId ? (
                    <div className="text-sm text-gray-600 mb-4">Utilizator conectat: ID {userId}</div>
                ) : (
                    <div className="text-sm text-red-600 mb-4">Nu sunteți conectat. Vă rugăm să vă autentificați.</div>
                )}

                <Card className="mb-8 w-full">
                    <CardHeader>
                        <CardTitle>{isEditing ? "Editează Anunț" : "Detalii Anunț"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                addAnimal()
                            }}
                            className="space-y-4"
                        >
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
                                <Label htmlFor="place">Locație (Adresă)</Label>
                                <Input
                                    id="place"
                                    value={newAnimal.place}
                                    onChange={(e) => setNewAnimal({ ...newAnimal, place: e.target.value })}
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
                                        src={newAnimal.imageUrl || "/placeholder.svg"}
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
                                        onClick={() => {
                                            setNewAnimal({
                                                name: "",
                                                species: "",
                                                description: "",
                                                imageUrl: "",
                                                place: "",
                                                imageFile: null,
                                            })
                                            setLocation("")
                                            setContact("")
                                            setIsEditing(false)
                                            setEditingId(null)
                                        }}
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
                                            src={animal.imageUrl || "/placeholder.svg"}
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

