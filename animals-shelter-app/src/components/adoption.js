import type React from "react"
import { useState } from "react"
import {PawPrint, Search, Loader2, Info, LogOut} from "lucide-react"
import Button from "./ui/Button"
import { Card, CardContent } from "./ui/Card"
import Input from "./ui/Input"

const PetCard = ({ pet }) => (
    <Card className="overflow-hidden">
        <img src={pet.image || "/placeholder.svg"} alt={pet.name} className="w-full h-48 object-cover" />
        <CardContent className="p-4">
            <h3 className="text-lg font-semibold">{pet.name}</h3>
            <div className="text-sm text-gray-600">
                <p>{pet.type} • {pet.age} • {pet.size}</p>
            </div>
        </CardContent>
    </Card>
)

const semanticSearch = async (query: string, adoptionType: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return []
}

const AdoptionPage = () => {
    const [searchQuery, setSearchQuery] = useState("")
    const [pets, setPets] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [adoptionType, setAdoptionType] = useState("standard")

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const results = await semanticSearch(searchQuery, adoptionType)
            setPets(results)
        } catch (error) {
            console.error("Error performing search:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen">
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600"/>
                        <span className="text-xl font-bold">PetPal Adoptions</span>
                    </a>
                    <nav className="flex gap-6">
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/home">
                            Acasă
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/adoption">
                            Adoptă acum
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors"
                           href="/editor_catalog">
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
                                window.location.href = "/login";
                            }}
                        >
                            <LogOut className="h-4 w-4"/>
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
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400"/>
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
                                {isLoading ? <Loader2 className="animate-spin w-6 h-6"/> :
                                    <Search className="w-6 h-6 mr-2"/>}
                                {isLoading ? "Căutare..." : "Caută"}
                            </Button>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600 mt-2">
                        {adoptionType === "standard" && (
                            <p>Adopția permanentă înseamnă că animalul va deveni pe deplin membrul familiei tale.</p>
                        )}
                        {adoptionType === "foster" && (
                            <p>Foster (temporar) - oferă un cămin temporar unui animal până când acesta își găsește o familie permanentă.</p>
                        )}
                        {adoptionType === "distant" && (
                            <p>Adopția la distanță - sprijini financiar un animal care rămâne în adăpost, primind actualizări regulate.</p>
                        )}
                    </div>
                </form>
            </div>

            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pets.map((pet) => (
                        <PetCard key={pet.id} pet={pet}/>
                    ))}
                </div>
                {pets.length === 0 && !isLoading && (
                    <div className="text-center mt-8 text-gray-600">
                        <p>Nu ai găsit ce cauți? <a href="/catalog" className="text-green-600 font-semibold">Vezi toate
                            anunțurile</a></p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdoptionPage