"use client"

import { useState, useEffect, useRef } from "react"
import { PawPrint, Heart, MessageCircle, Share2, LogOut, MoreVertical, Edit, Trash, Flag, X } from "lucide-react"
import Label from "./ui/Label"
import Textarea from "./ui/Textarea"

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
        content: "Max este fericit cu noua lui jucarie.",
        image: "/placeholder.svg?height=300&width=500",
        likes: 15,
        comments: 3,
        timestamp: "2 hours ago",
        userId: "user123", // Adding a userId for testing
    },
    {
        id: 2,
        author: "Jane Smith",
        content: "Bella, pentru prima data la veterinar. Nu e foarte incantata",
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
    const [imagePreview, setImagePreview] = useState(null)
    const [currentUserId, setCurrentUserId] = useState("user123") 
    const [currentUserName, setCurrentUserName] = useState("Nume generic")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [editingPost, setEditingPost] = useState(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editedContent, setEditedContent] = useState("")
    const [editedImage, setEditedImage] = useState("")
    const [editImagePreview, setEditImagePreview] = useState(null)
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
    const [reportReason, setReportReason] = useState("")
    const [reportedPostId, setReportedPostId] = useState(null)

    const fileInputRef = useRef(null)
    const editFileInputRef = useRef(null)

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
                console.log("Current user ID:", userId)

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

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert("Imaginea este prea mare. Vă rugăm să alegeți o imagine mai mică de 5MB.")
            e.target.value = null
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result)
            setNewPost({ ...newPost, image: reader.result })
        }
        reader.readAsDataURL(file)
    }

    const handleEditImageChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert("Imaginea este prea mare. Vă rugăm să alegeți o imagine mai mică de 5MB.")
            e.target.value = null
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setEditImagePreview(reader.result)
            setEditedImage(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const handleRemoveImage = () => {
        setImagePreview(null)
        setNewPost({ ...newPost, image: "" })
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleRemoveEditImage = () => {
        setEditImagePreview(null)
        setEditedImage("")
        if (editFileInputRef.current) {
            editFileInputRef.current.value = ""
        }
    }

    const handlePostSubmit = (e) => {
        e.preventDefault()
        if (newPost.content.trim()) {
            const post = {
                id: Date.now(),
                author: currentUserName || "Utilizator necunoscut",
                content: newPost.content,
                image: newPost.image,
                likes: 0,
                comments: 0,
                timestamp: "Just now",
                userId: currentUserId,
            }
            setPosts([post, ...posts])
            setNewPost({ content: "", image: "" })
            setImagePreview(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleLike = (postId) => {
        setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
    }

    const handleEditClick = (post) => {
        setEditingPost(post)
        setEditedContent(post.content)
        setEditedImage(post.image || "")
        setEditImagePreview(post.image || null)
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
            setEditImagePreview(null)
            if (editFileInputRef.current) {
                editFileInputRef.current.value = ""
            }
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

                <div className="mb-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-2">Adaugă o postare</h2>
                    <p className="text-sm text-gray-500 mb-4">Postezi ca: {currentUserName}</p>

                    <form onSubmit={handlePostSubmit}>
                        <Textarea
                            placeholder="Ce mai face animăluțul tău?"
                            value={newPost.content}
                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                            className="mb-4"
                        />

                        <div className="mb-4">
                            <Label htmlFor="image-upload">Imagine</Label>
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                onChange={handleImageChange}
                                ref={fileInputRef}
                                className="block w-full text-sm border border-gray-300 rounded-lg p-2"
                            />
                            {imagePreview && (
                                <div className="mt-4 relative">
                                    <img
                                        src={imagePreview || "/placeholder.svg"}
                                        alt="Preview"
                                        className="w-full max-h-64 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                                        type="button"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !currentUserId}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            {loading ? "Se încarcă..." : "Postează"}
                        </button>
                    </form>
                </div>

                {posts.map((post) => (
                    <div key={post.id} className="mb-6 bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold">{post.author}</h3>
                                    <p className="text-sm text-gray-500">
                                        {post.timestamp} {post.edited && <span className="italic">(editat)</span>}
                                    </p>
                                </div>
                                <CustomDropdownMenu
                                    trigger={
                                        <button className="text-gray-500 hover:text-gray-700">
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                    }
                                >
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
                            <p className="mb-4">{post.content}</p>
                            {post.image && (
                                <img src={post.image || "/placeholder.svg"} alt="Post" className="w-full rounded-lg mb-3" />
                            )}
                            <div className="flex justify-between mt-4">
                                <button
                                    className="flex items-center text-gray-700 hover:text-green-600"
                                    onClick={() => handleLike(post.id)}
                                >
                                    <Heart className="mr-1 h-5 w-5" />
                                    <span>{post.likes} Aprecieri</span>
                                </button>
                                <button className="flex items-center text-gray-700 hover:text-green-600">
                                    <MessageCircle className="mr-1 h-5 w-5" />
                                    <span>{post.comments} Comentarii</span>
                                </button>
                                <button className="flex items-center text-gray-700 hover:text-green-600">
                                    <Share2 className="mr-1 h-5 w-5" />
                                    <span>Distribuie</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </main>

            {/* Edit Post Dialog */}
            <Dialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                title="Editează postarea"
                footer={
                    <>
                        <button
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            Anulează
                        </button>
                        <button
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            onClick={handleSaveEdit}
                        >
                            Salvează
                        </button>
                    </>
                }
            >
                <Textarea
                    placeholder="Ce mai face animăluțul tău?"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="mb-4"
                />

                <div className="mb-4">
                    <Label htmlFor="edit-image-upload">Imagine</Label>
                    <input
                        type="file"
                        id="edit-image-upload"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        ref={editFileInputRef}
                        className="block w-full text-sm border border-gray-300 rounded-lg p-2"
                    />
                    {editImagePreview && (
                        <div className="mt-4 relative">
                            <img
                                src={editImagePreview || "/placeholder.svg"}
                                alt="Preview"
                                className="w-full max-h-64 object-cover rounded-lg"
                            />
                            <button
                                onClick={handleRemoveEditImage}
                                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                                type="button"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </Dialog>

            {/* Report Post Dialog */}
            <Dialog
                isOpen={isReportDialogOpen}
                onClose={() => setIsReportDialogOpen(false)}
                title="Raportează postarea"
                footer={
                    <>
                        <button
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
                            onClick={() => setIsReportDialogOpen(false)}
                        >
                            Anulează
                        </button>
                        <button
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            onClick={handleSubmitReport}
                        >
                            Trimite
                        </button>
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

