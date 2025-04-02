import { useState, useEffect } from "react"
import { PawPrint, Heart, MessageCircle, Share2, LogOut } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import Textarea from "./ui/Textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/Avatar"

const initialPosts = [
    {
        id: 1,
        author: "John Doe",
        avatar: "/placeholder.svg?height=40&width=40",
        content: "Max is doing great! He loves his new toy and has been playing with it all day.",
        image: "/placeholder.svg?height=300&width=500",
        likes: 15,
        comments: 3,
        timestamp: "2 hours ago",
    },
    {
        id: 2,
        author: "Jane Smith",
        avatar: "/placeholder.svg?height=40&width=40",
        content: "Bella had her first visit to the vet today. She was so brave!",
        image: "/placeholder.svg?height=300&width=500",
        likes: 10,
        comments: 2,
        timestamp: "5 hours ago",
    },
]

export default function PostUpdates() {
    const [posts, setPosts] = useState(initialPosts)
    const [newPost, setNewPost] = useState({ content: "", image: "" })
    const [currentUserId, setCurrentUserId] = useState(null)
    const [currentUserName, setCurrentUserName] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const API_BASE_URL = "http://localhost:8083"

    // Fetch current user ID when component mounts
    useEffect(() => {
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
                        setError("Nu sunteți autentificat. Vă rugăm să vă conectați.")
                        return
                    }
                    throw new Error("Failed to fetch user ID")
                }

                const userId = await response.text()
                setCurrentUserId(userId)

                // After getting the user ID, fetch the user name
                if (userId) {
                    fetchCurrentUserName(userId)
                }
            } catch (err) {
                console.error("Error fetching user ID:", err)
                setError("Nu s-a putut obține ID-ul utilizatorului.")
            } finally {
                setLoading(false)
            }
        }

        fetchCurrentUserId()
    }, [API_BASE_URL])

    // Fetch current user name using the user ID
    const fetchCurrentUserName = async (userId) => {
        try {
            setLoading(true)
            const response = await fetch(`${API_BASE_URL}/currentUserName/${userId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error("Failed to fetch user name")
            }

            const userName = await response.text()
            setCurrentUserName(userName)
        } catch (err) {
            console.error("Error fetching user name:", err)
            setError("Nu s-a putut obține numele utilizatorului.")
        } finally {
            setLoading(false)
        }
    }

    const handlePostSubmit = (e) => {
        e.preventDefault()
        if (newPost.content.trim()) {
            const post = {
                id: Date.now(),
                author: currentUserName || "Utilizator necunoscut",
                avatar: "/placeholder.svg?height=40&width=40",
                content: newPost.content,
                image: newPost.image,
                likes: 0,
                comments: 0,
                timestamp: "Just now",
            }
            setPosts([post, ...posts])
            setNewPost({ content: "", image: "" })
        }
    }

    return (
        <div className="min-h-screen bg-white-100">
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/public" className="flex items-center gap-2">
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
            <main className="container mx-auto py-8 px-4">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Adaugă o postare</CardTitle>
                        {currentUserName && <p className="text-sm text-gray-500">Postezi ca: {currentUserName}</p>}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePostSubmit}>
                            <Textarea
                                placeholder="Ce mai face animăluțul tău?"
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                className="mb-4"
                            />
                            <Input
                                type="text"
                                placeholder="Adaugă și o imagine!"
                                value={newPost.image}
                                onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                                className="mb-4"
                            />
                            <Button type="submit" disabled={loading || !currentUserId}>
                                {loading ? "Se încarcă..." : "Postează"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {posts.map((post) => (
                    <Card key={post.id} className="mb-6">
                        <CardHeader>
                            <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-4">
                                    <AvatarImage src={post.avatar} alt={post.author} />
                                    <AvatarFallback>{post.author[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg">{post.author}</CardTitle>
                                    <p className="text-sm text-gray-500">{post.timestamp}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4">{post.content}</p>
                            {post.image && <img src={post.image || "/placeholder.svg"} alt="Post" className="rounded-lg w-full" />}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="ghost" className="flex items-center">
                                <Heart className="mr-2 h-4 w-4" />
                                {post.likes} Likes
                            </Button>
                            <Button variant="ghost" className="flex items-center">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                {post.comments} Comments
                            </Button>
                            <Button variant="ghost" className="flex items-center">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </main>
        </div>
    )
}

