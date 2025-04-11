
import Button from "./ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/Card"
import { PawPrint, Calendar, Info, LogOut, ArrowRight } from "lucide-react"

export default function Homepage() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600" />
                        <span className="text-xl font-bold">PetPal Adoptions</span>
                    </a>
                    <nav className="flex gap-6 items-center">
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="#">
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
            <main className="flex-1">
                <section className="w-full py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-r from-green-400 via-green-500 to-green-600 flex items-center justify-center">
                    <div className="container px-2 md:px-4">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                                    Prietenie pe viață? Începe aici!
                                </h1>
                            </div>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => (window.location.href = "/adoption")}>
                                Adoptă acum
                            </Button>
                        </div>
                    </div>
                </section>
                <section className="w-full py-20 md:py-28 lg:py-40 flex items-center justify-center">
                    <div className="container px-6 md:px-8">
                        <h2 className="text-3xl font-bold tracking-tighter justify-center text-center mb-12">
                            Ultimele postări și evenimente
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    id: "event-1",
                                    title: "Târg de Adopții de Vară",
                                    date: "15 Iulie, 2023",
                                    description:
                                        "Alătură-te nouă la cel mai mare eveniment de adopție al anului! Întâlnește sute de animăluțe adorabile.",
                                },
                                {
                                    id: "event-2",
                                    title: "Anunț Nou Parteneriat",
                                    date: "1 August, 2023",
                                    description:
                                        "Suntem încântați să anunțăm noul nostru parteneriat cu Clinica Veterinară Locală, oferind îngrijire la preț redus.",
                                },
                                {
                                    id: "event-3",
                                    title: "Orientare pentru Voluntari",
                                    date: "10 August, 2023",
                                    description:
                                        "Ești interesat să ajuți animalele? Participă la orientarea noastră pentru voluntari pentru a afla cum poți face o diferență.",
                                },
                            ].map((event, index) => (
                                <Card key={index} className="flex flex-col h-full">
                                    <CardHeader>
                                        <CardTitle>{event.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center flex-grow">
                                        <p className="text-sm text-gray-500 mb-2 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            {event.date}
                                        </p>
                                        <p className="text-sm">{event.description}</p>
                                    </CardContent>
                                    <CardFooter className="pt-0 flex justify-center">
                                        <Button
                                            variant="outline"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                            onClick={() => (window.location.href = `/events/${event.id}`)}
                                        >
                                            Vezi mai multe detalii
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="w-full py-12 md:py-24 lg:py-32 bg-green-50 flex items-center justify-center">
                    <div className="container px-4 md:px-6">
                        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Despre PetPal Adoptions</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-center">
                                        <Info className="h-5 w-5 text-green-600" />
                                        Misiunea Noastră
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p>
                                        Ne străduim să găsim cămine iubitoare pentru toate animalele care au nevoie, promovând deținerea
                                        responsabilă de animale de companie și compasiunea pentru toate creaturile.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-center">
                                        <PawPrint className="h-5 w-5 text-green-600" />
                                        Procesul de Adopție
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p>
                                        Procesul nostru de adopție este conceput pentru a asigura cea mai bună potrivire între animale și
                                        noile lor familii. Oferim sprijin la fiecare pas.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-center">
                                        <Calendar className="h-5 w-5 text-green-600" />
                                        Implică-te
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p>
                                        De la voluntariat la găzduire temporară, există multe modalități de a ajuta animalele în nevoie.
                                        Alătură-te comunității noastre de iubitori de animale astăzi!
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="border-t py-6 md:py-0 text-center">
                <div className="container flex flex-col gap-4 md:h-24 md:flex-row md:items-center md:justify-center">
                    <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:items-center">
                        <a href="/public" className="flex items-center gap-2 text-lg font-bold justify-center">
                            <PawPrint className="h-6 w-6" />
                            <span>PetPal Adoptions</span>
                        </a>
                        <p className="text-sm text-gray-500 md:text-base">© 2023 PetPal Adoptions. Toate drepturile rezervate.</p>
                    </div>
                    <nav className="flex gap-4 md:gap-6 justify-center">
                        <a className="text-sm font-medium hover:underline underline-offset-4" href="#">
                            Termeni
                        </a>
                        <a className="text-sm font-medium hover:underline underline-offset-4" href="#">
                            Confidențialitate
                        </a>
                    </nav>
                </div>
            </footer>
        </div>
    )
}
