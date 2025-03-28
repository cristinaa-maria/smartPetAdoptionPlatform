"use client"

import Button from "./ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { PawPrint, Calendar, Info, LogOut } from "lucide-react"

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
                                window.location.href = "/login";
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
                                    title: "Summer Adoption Fair",
                                    date: "July 15, 2023",
                                    description:
                                        "Join us for our biggest adoption event of the year! Meet hundreds of adorable pets looking for their forever homes.",
                                },
                                {
                                    title: "New Partnership Announcement",
                                    date: "August 1, 2023",
                                    description:
                                        "We're excited to announce our new partnership with Local Vet Clinic, offering discounted care for all adopted pets.",
                                },
                                {
                                    title: "Volunteer Orientation",
                                    date: "August 10, 2023",
                                    description:
                                        "Interested in helping animals? Attend our volunteer orientation to learn how you can make a difference.",
                                },
                            ].map((event, index) => (
                                <Card key={index} className="text-center">
                                    <CardHeader>
                                        <CardTitle>{event.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center">
                                        <p className="text-sm text-gray-500 mb-2">{event.date}</p>
                                        <p className="text-sm">{event.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="w-full py-12 md:py-24 lg:py-32 bg-green-50 flex items-center justify-center">
                    <div className="container px-4 md:px-6">
                        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">About PetPal Adoptions</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-center">
                                        <Info className="h-5 w-5 text-green-600" />
                                        Our Mission
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p>
                                        We strive to find loving homes for all animals in need, promoting responsible pet ownership and
                                        compassion for all creatures.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-center">
                                        <PawPrint className="h-5 w-5 text-green-600" />
                                        Adoption Process
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p>
                                        Our adoption process is designed to ensure the best match between pets and their new families. We
                                        provide support every step of the way.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-center">
                                        <Calendar className="h-5 w-5 text-green-600" />
                                        Get Involved
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p>
                                        From volunteering to fostering, there are many ways to help animals in need. Join our community of
                                        animal lovers today!
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
                        <p className="text-sm text-gray-500 md:text-base">© 2023 PetPal Adoptions. All rights reserved.</p>
                    </div>
                    <nav className="flex gap-4 md:gap-6 justify-center">
                        <a className="text-sm font-medium hover:underline underline-offset-4" href="#">
                            Terms
                        </a>
                        <a className="text-sm font-medium hover:underline underline-offset-4" href="#">
                            Privacy
                        </a>
                    </nav>
                </div>
            </footer>
        </div>
    )
}

