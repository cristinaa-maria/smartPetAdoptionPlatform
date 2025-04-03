import { useState, useEffect, useRef } from "react"
import { PawPrint, Heart, MessageCircle, Share2, LogOut, MoreVertical, Edit, Trash, Flag } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import Textarea from "./ui/Textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/Avatar"

// Custom Dialog component
const Dialog = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">{title}</h2>
                </div>
                <div className="p-4">{children}</div>
                <div className="p-4 border-t flex justify-end space-x-2">{footer}</div>
            </div>
        </div>
    )
}

// Custom Dropdown Menu component
const CustomDropdownMenu = ({ children, trigger }) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border">{children}</div>
            )}
        </div>
    )
}

// Dropdown Menu Item component
const DropdownMenuItem = ({ onClick, children }) => {
    return (
        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={onClick}>
            {children}
        </button>
    )
}

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
        userId: "user123", // Adding a userId for testing
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
        userId: "user456",
    },
]

export default function PostUpdates() {
    const [posts, setPosts] = useState(() => {
        // Try to get posts from localStorage on initial load
        try {
            const savedPosts = localStorage.getItem("petpalPosts")
            return savedPosts ? JSON.parse(savedPosts) : initialPosts
        } catch (error) {
            console.error("Error loading posts from localStorage:", error)
            return initialPosts
        }
    })
    const [newPost, setNewPost] = useState({ content: "", image: "" })
    const [currentUserId, setCurrentUserId] = useState("user123") // Default for testing
    const [currentUserName, setCurrentUserName] = useState("Nume generic")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("Nu s-a putut obține ID-ul utilizatorului.")
    const [editingPost, setEditingPost] = useState(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editedContent, setEditedContent] = useState("")
    const [editedImage, setEditedImage] = useState("")
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
    const [reportReason, setReportReason] = useState("")
    const [reportedPostId, setReportedPostId] = useState(null)

    const API_BASE_URL = "http://localhost:8083"

    // Save posts to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem("petpalPosts", JSON.stringify(posts))
        } catch (error) {
            console.error("Error saving posts to localStorage:", error)
        }
    }, [posts])

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

        // Uncomment this to fetch from real API
        // fetchCurrentUserId()
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
                userId: currentUserId, // Store the user ID to identify the post owner
            }
            setPosts([post, ...posts])
            setNewPost({ content: "", image: "" })
        }
    }

    const handleLike = (postId) => {
        setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
    }

    const handleEditClick = (post) => {
        setEditingPost(post)
        setEditedContent(post.content)
        setEditedImage(post.image || "")
        setIsEditDialogOpen(true)
    }

    const handleSaveEdit = () => {
        if (editedContent.trim()) {
            setPosts(
                posts.map((post) =>
                    post.id === editingPost.id
                        ? {
                            ...post,
                            content: editedContent,
                            image: editedImage,
                            edited: true,
                        }
                        : post,
                ),
            )
            setIsEditDialogOpen(false)
            setEditingPost(null)
        }
    }

    const handleDeletePost = (postId) => {
        if (window.confirm("Ești sigur că vrei să ștergi această postare?")) {
            setPosts(posts.filter((post) => post.id !== postId))
        }
    }

    const handleReportClick = (postId) => {
        setReportedPostId(postId)
        setReportReason("")
        setIsReportDialogOpen(true)
    }

    const handleSubmitReport = () => {
        if (reportReason.trim()) {
            // In a real app, you would send this to your backend
            console.log(`Post ${reportedPostId} reported for: ${reportReason}`)
            alert("Mulțumim pentru raportare. O vom analiza cât mai curând.")
            setIsReportDialogOpen(false)
            setReportedPostId(null)
            setReportReason("")
        }
    }

    // Check if the current user is the author of a post
    const isPostOwner = (post) => {
        return post.userId === currentUserId
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Avatar className="h-10 w-10 mr-4">
                                        <AvatarImage src={post.avatar} alt={post.author} />
                                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{post.author}</CardTitle>
                                        <p className="text-sm text-gray-500">
                                            {post.timestamp} {post.edited && <span className="italic">(editat)</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center">
                                    <CustomDropdownMenu
                                        trigger={
                                            <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100">
                                                <MoreVertical className="h-5 w-5 text-gray-500" />
                                            </button>
                                        }
                                    >
                                        {/* Always show all options for testing */}
                                        <DropdownMenuItem onClick={() => handleEditClick(post)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Editează</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeletePost(post.id)}>
                                            <Trash className="mr-2 h-4 w-4" />
                                            <span>Șterge</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleReportClick(post.id)}>
                                            <Flag className="mr-2 h-4 w-4" />
                                            <span>Raportează</span>
                                        </DropdownMenuItem>
                                    </CustomDropdownMenu>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4">{post.content}</p>
                            {post.image && <img src={post.image || "/placeholder.svg"} alt="Post" className="rounded-lg w-full" />}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="ghost" className="flex items-center" onClick={() => handleLike(post.id)}>
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

            {/* Edit Post Dialog */}
            <Dialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                title="Editează postarea"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Anulează
                        </Button>
                        <Button onClick={handleSaveEdit}>Salvează</Button>
                    </>
                }
            >
                <Textarea
                    placeholder="Ce mai face animăluțul tău?"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="mb-4"
                />
                <Input
                    type="text"
                    placeholder="URL imagine"
                    value={editedImage}
                    onChange={(e) => setEditedImage(e.target.value)}
                    className="mb-4"
                />
            </Dialog>

            {/* Report Post Dialog */}
            <Dialog
                isOpen={isReportDialogOpen}
                onClose={() => setIsReportDialogOpen(false)}
                title="Raportează postarea"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                            Anulează
                        </Button>
                        <Button onClick={handleSubmitReport}>Trimite</Button>
                    </>
                }
            >
                <Textarea
                    placeholder="Care este motivul raportării?"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="mb-4"
                />
            </Dialog>
        </div>
    )
}

