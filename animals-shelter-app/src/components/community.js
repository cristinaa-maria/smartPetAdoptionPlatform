import { useState, useEffect, useRef } from "react"
import {
    PawPrint,
    Heart,
    MessageCircle,
    Share2,
    LogOut,
    MoreVertical,
    Edit,
    Trash,
    Flag,
    X,
    Send,
    ChevronDown,
    ChevronUp,
    Menu,
} from "lucide-react"
import  Label  from "./ui/Label"
import  Textarea  from "./ui/Textarea"

const Dialog = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b">
                    <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
                </div>
                <div className="p-4">{children}</div>
                <div className="p-4 border-t flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-0">{footer}</div>
            </div>
        </div>
    )
}

const CustomDropdownMenu = ({ children, trigger }) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

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

const DropdownMenuItem = ({ onClick, children }) => {
    return (
        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={onClick}>
            {children}
        </button>
    )
}

const PostTag = ({ type }) => {
    const tagStyles = {
        eveniment: "bg-blue-100 text-blue-800",
        voluntariat: "bg-green-100 text-green-800",
        actualizare: "bg-amber-100 text-amber-800",
    }

    const style = tagStyles[type] || "bg-gray-100 text-gray-800"

    return (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${style}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
    )
}

const CommentSection = ({ postId, comments, onAddComment, currentUserName }) => {
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState("")

    const handleSubmitComment = (e) => {
        e.preventDefault()
        if (newComment.trim()) {
            onAddComment(postId, newComment.trim())
            setNewComment("")
        }
    }

    return (
        <div className="border-t pt-3 mt-3">
            <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-3"
            >
                {showComments ? (
                    <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Ascunde comentariile
                    </>
                ) : (
                    <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Vezi comentariile ({comments.length})
                    </>
                )}
            </button>

            {showComments && (
                <div className="space-y-3">
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                                    <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSubmitComment} className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <Textarea
                                placeholder="Scrie un comentariu..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[60px] resize-none text-sm sm:text-base"
                                rows={2}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="self-end px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                    <p className="text-xs text-gray-500">Comentezi ca: {currentUserName}</p>
                </div>
            )}
        </div>
    )
}

const getPlaceholderByTag = (tag) => {
    switch (tag) {
        case "voluntariat":
            return "Cu ce ai nevoie de ajutor azi?"
        case "eveniment":
            return "La ce evenimente ne invită animalutele azi?"
        case "actualizare":
        default:
            return "Ce mai face animăluțul tău?"
    }
}
const mockComments = {
    "event-1": [
        {
            id: 12,
            author: "Alexandra Marin",
            content: "Ce eveniment minunat! Vom fi acolo cu toată familia. Copiii sunt foarte entuziasmați!",
            timestamp: "20 ore în urmă",
        },
        {
            id: 13,
            author: "Bogdan Ionescu",
            content: "Finalmente un eveniment în București! Caut un câine de talie medie pentru apartament.",
            timestamp: "18 ore în urmă",
        },
        {
            id: 14,
            author: "Cristina Popescu",
            content: "Consultațiile veterinare gratuite sunt o idee excelentă! Mulțumim PetPal! 🙏",
            timestamp: "15 ore în urmă",
        },
        {
            id: 15,
            author: "Mihai Georgescu",
            content: "Voi fi acolo ca voluntar! Cine mai vine să ajute?",
            timestamp: "12 ore în urmă",
        },
        {
            id: 16,
            author: "Elena Radu",
            content: "Parcul Herăstrău este locația perfectă! Ușor accesibil cu transportul public.",
            timestamp: "10 ore în urmă",
        },
        {
            id: 17,
            author: "Andrei Stoica",
            content: "Pot să aduc și câinele meu să socializeze cu ceilalți?",
            timestamp: "8 ore în urmă",
        },
    ],
    "event-2": [
        {
            id: 18,
            author: "Maria Vasile",
            content: "Excelentă inițiativă! Reducerile vor ajuta foarte mult familiile care adoptă.",
            timestamp: "2 zile în urmă",
        },
        {
            id: 19,
            author: "Radu Petre",
            content: "Clinica Veterinară Locală are o reputație foarte bună. Parteneriat perfect!",
            timestamp: "2 zile în urmă",
        },
        {
            id: 20,
            author: "Ioana Dumitrescu",
            content: "Serviciile de urgență 24/7 sunt esențiale. Mulțumesc pentru acest parteneriat!",
            timestamp: "1 zi în urmă",
        },
        {
            id: 21,
            author: "Gabriel Marin",
            content: "Cum pot beneficia de aceste reduceri? Trebuie să prezint ceva la clinică?",
            timestamp: "1 zi în urmă",
        },
    ],
    "event-3": [
        {
            id: 22,
            author: "Diana Popescu",
            content: "M-am înscris deja! Nu pot să aștept să încep să ajut animalele! 💕",
            timestamp: "4 zile în urmă",
        },
        {
            id: 23,
            author: "Cosmin Radu",
            content: "Programul de foster mă interesează foarte mult. Voi fi acolo!",
            timestamp: "4 zile în urmă",
        },
        {
            id: 24,
            author: "Alina Georgescu",
            content: "Aveți nevoie de voluntari cu experiență în fotografie? Am lucrat cu animale înainte.",
            timestamp: "3 zile în urmă",
        },
        {
            id: 25,
            author: "Vlad Ionescu",
            content: "Este vreo limită de vârstă pentru voluntari? Fiul meu de 16 ani vrea să participe.",
            timestamp: "3 zile în urmă",
        },
        {
            id: 26,
            author: "Carmen Stoica",
            content: "Orientarea este doar în română sau și în alte limbi?",
            timestamp: "2 zile în urmă",
        },
    ],
    1: [
        {
            id: 1,
            author: "Maria Ionescu",
            content: "Ce drăguț este Max! Se vede că se distrează foarte mult cu jucăria.",
            timestamp: "1 oră în urmă",
        },
        {
            id: 2,
            author: "Andrei Popescu",
            content: "Unde ai găsit jucăria? Și câinele meu ar avea nevoie de una așa.",
            timestamp: "45 min în urmă",
        },
        {
            id: 3,
            author: "Elena Dumitrescu",
            content: "Max arată foarte fericit! 🐕❤️",
            timestamp: "30 min în urmă",
        },
        {
            id: 4,
            author: "Radu Mihai",
            content: "Câinii adoră jucăriile care fac zgomot! Max pare să fie în al nouălea cer.",
            timestamp: "25 min în urmă",
        },
        {
            id: 5,
            author: "Carmen Stoica",
            content: "Așa de frumos să vezi un animal fericit și iubit! Felicitări pentru grija pe care o ai de Max! 💕",
            timestamp: "20 min în urmă",
        },
    ],
    2: [
        {
            id: 6,
            author: "Cristian Marin",
            content: "Prima vizită la veterinar poate fi stresantă pentru ei. Bella a fost curajoasă!",
            timestamp: "3 ore în urmă",
        },
        {
            id: 7,
            author: "Ana Georgescu",
            content: "Recomand să îi aduci o jucărie preferată data viitoare, îi va fi mai ușor.",
            timestamp: "2 ore în urmă",
        },
        {
            id: 8,
            author: "Mihai Vasile",
            content: "Bella este foarte frumoasă! Sper că totul a fost în regulă la control.",
            timestamp: "2 ore în urmă",
        },
        {
            id: 9,
            author: "Ioana Petre",
            content: "Veterinarul nostru recomandă să vii cu câteva recompense pentru a face experiența mai plăcută.",
            timestamp: "1 oră în urmă",
        },
        {
            id: 10,
            author: "Gabriel Radu",
            content: "Ce pisicuță frumoasă! Prima vizită este întotdeauna cea mai grea, dar se va obișnui.",
            timestamp: "45 min în urmă",
        },
        {
            id: 11,
            author: "Daniela Popescu",
            content: "Bella pare să fie o pisică foarte calmă. Sigur s-a comportat exemplar! 🐱",
            timestamp: "30 min în urmă",
        },
    ],
}

const initialPosts = [
    {
        id: "event-1",
        author: "PetPal Adoptions",
        content:
            "🎉 Târg de Adopții de Vară - 15 Iulie 2025! 🎉\n\nAlătură-te nouă la cel mai mare eveniment de adopție al anului! Vom avea:\n\n🐕 Peste 100 de câini și pisici care caută o casă\n🎪 Activități pentru copii și familii\n🏥 Consultații veterinare gratuite\n🎁 Premii și surprize pentru toți participanții\n\nLocația: Parcul Herăstrău, București\nOra: 10:00 - 18:00\n\nVino și găsește-ți cel mai bun prieten! Intrarea este gratuită pentru toată familia. #AdoptieDeVara #PetPalAdoptions",
        image: "/placeholder.svg?height=400&width=600&text=Targ+de+Adoptii+de+Vara",
        likes: 89,
        comments: 6,
        timestamp: "1 day ago",
        userId: "petpal_official",
        tag: "eveniment",
        likedBy: [], // Track users who liked this post
    },
    {
        id: "event-2",
        author: "PetPal Adoptions",
        content:
            "📢 Anunț Important - Nou Parteneriat! 📢\n\nSuntem încântați să anunțăm noul nostru parteneriat cu Clinica Veterinară Locală! 🏥\n\nCe înseamnă asta pentru tine:\n✅ Reduceri de 20% la toate consultațiile pentru animalele adoptate prin PetPal\n✅ Servicii de urgență 24/7 cu tarife preferențiale\n✅ Programe de vaccinare și deparazitare la prețuri speciale\n✅ Consiliere gratuită pentru îngrijirea animalelor de companie\n\nParteneriatul intră în vigoare din 1 August 2025. Pentru mai multe detalii, contactați-ne! #Parteneriat #IngrijireVeterinara",
        image: "/placeholder.svg?height=400&width=600&text=Parteneriat+Clinica+Veterinara",
        likes: 67,
        comments: 4,
        timestamp: "3 days ago",
        userId: "petpal_official",
        tag: "eveniment",
        likedBy: [],
    },
    {
        id: "event-3",
        author: "PetPal Adoptions",
        content:
            "🙋‍♀️ Orientare pentru Voluntari - 10 August 2025! 🙋‍♂️\n\nEști interesat să ajuți animalele? Participă la orientarea noastră pentru voluntari!\n\nCe vei învăța:\n🐾 Cum să îngrijești animalele din adăpost\n📋 Proceduri de adopție și documentație\n💝 Tehnici de socializare pentru animale traumatizate\n📸 Cum să faci fotografii atractive pentru anunțuri\n🏠 Programul de foster și găzduire temporară\n\nData: 10 August 2025\nOra: 14:00 - 17:00\nLocația: Sediul PetPal Adoptions\n\nÎnscrierea este gratuită! Trimite un email la voluntari@petpal.ro #Voluntariat #AjutaAnimalele",
        image: "/placeholder.svg?height=400&width=600&text=Orientare+Voluntari",
        likes: 45,
        comments: 5,
        timestamp: "5 days ago",
        userId: "petpal_official",
        tag: "eveniment",
        likedBy: [],
    },
    {
        id: 1,
        author: "John Doe",
        content: "Max este fericit cu noua lui jucarie.",
        image: "/placeholder.svg?height=300&width=500&text=Max+cu+jucaria",
        likes: 15,
        comments: 5,
        timestamp: "2 hours ago",
        userId: "user123",
        tag: "actualizare",
        likedBy: [],
    },
    {
        id: 2,
        author: "Jane Smith",
        content: "Bella, pentru prima data la veterinar. Nu e foarte incantata",
        image: "/placeholder.svg?height=300&width=500&text=Bella+la+veterinar",
        likes: 10,
        comments: 6,
        timestamp: "5 hours ago",
        userId: "user456",
        tag: "eveniment",
        likedBy: [],
    },
]

export default function PostUpdates() {
    const [posts, setPosts] = useState(() => {
        try {
            const savedPosts = localStorage.getItem("petpalPosts")
            const parsedPosts = savedPosts ? JSON.parse(savedPosts) : initialPosts
            // Ensure all posts have likedBy array
            return parsedPosts.map((post) => ({
                ...post,
                likedBy: post.likedBy || [],
            }))
        } catch (error) {
            console.error("Error loading posts from localStorage:", error)
            return initialPosts
        }
    })
    const [comments, setComments] = useState(() => {
        try {
            const savedComments = localStorage.getItem("petpalComments")
            return savedComments ? JSON.parse(savedComments) : mockComments
        } catch (error) {
            console.error("Error loading comments from localStorage:", error)
            return mockComments
        }
    })
    const [newPost, setNewPost] = useState({ content: "", image: "", tag: "actualizare" })
    const [imagePreview, setImagePreview] = useState(null)
    const [currentUserId, setCurrentUserId] = useState("user123")
    const [currentUserName, setCurrentUserName] = useState("Nume generic")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [editingPost, setEditingPost] = useState(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editedContent, setEditedContent] = useState("")
    const [editedImage, setEditedImage] = useState("")
    const [editedTag, setEditedTag] = useState("")
    const [editImagePreview, setEditImagePreview] = useState(null)
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
    const [reportReason, setReportReason] = useState("")
    const [reportedPostId, setReportedPostId] = useState(null)
    const [expandedImage, setExpandedImage] = useState(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const fileInputRef = useRef(null)
    const editFileInputRef = useRef(null)

    const API_BASE_URL = "http://localhost:8083"
    const availableTags = ["actualizare", "eveniment", "voluntariat"]

    useEffect(() => {
        try {
            localStorage.setItem("petpalPosts", JSON.stringify(posts))
        } catch (error) {
            console.error("Error saving posts to localStorage:", error)
        }
    }, [posts])

    useEffect(() => {
        try {
            localStorage.setItem("petpalComments", JSON.stringify(comments))
        } catch (error) {
            console.error("Error saving comments to localStorage:", error)
        }
    }, [comments])

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
                tag: newPost.tag,
                likedBy: [],
            }
            setPosts([post, ...posts])
            setComments((prev) => ({ ...prev, [post.id]: [] }))
            setNewPost({ content: "", image: "", tag: "actualizare" })
            setImagePreview(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleLike = (postId) => {
        setPosts(
            posts.map((post) => {
                if (post.id === postId) {
                    const likedBy = post.likedBy || []
                    const hasLiked = likedBy.includes(currentUserId)

                    if (hasLiked) {
                        return {
                            ...post,
                            likes: Math.max(0, post.likes - 1),
                            likedBy: likedBy.filter((id) => id !== currentUserId),
                        }
                    } else {
                        return {
                            ...post,
                            likes: post.likes + 1,
                            likedBy: [...likedBy, currentUserId],
                        }
                    }
                }
                return post
            }),
        )
    }

    const hasUserLiked = (post) => {
        return post.likedBy && post.likedBy.includes(currentUserId)
    }

    const handleAddComment = (postId, commentContent) => {
        const newComment = {
            id: Date.now(),
            author: currentUserName,
            content: commentContent,
            timestamp: "Chiar acum",
        }

        setComments((prev) => ({
            ...prev,
            [postId]: [...(prev[postId] || []), newComment],
        }))

        setPosts(
            posts.map((post) => (post.id === postId ? { ...post, comments: (comments[postId]?.length || 0) + 1 } : post)),
        )
    }

    const handleEditClick = (post) => {
        setEditingPost(post)
        setEditedContent(post.content)
        setEditedImage(post.image || "")
        setEditedTag(post.tag || "actualizare")
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
                            tag: editedTag,
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
            setComments((prev) => {
                const newComments = { ...prev }
                delete newComments[postId]
                return newComments
            })
        }
    }

    const handleReportClick = (postId) => {
        setReportedPostId(postId)
        setReportReason("")
        setIsReportDialogOpen(true)
    }

    const handleSubmitReport = () => {
        if (reportReason.trim()) {
            console.log(`Post ${reportedPostId} reported for: ${reportReason}`)
            alert("Mulțumim pentru raportare. O vom analiza cât mai curând.")
            setIsReportDialogOpen(false)
            setReportedPostId(null)
            setReportReason("")
        }
    }

    const isPostOwner = (post) => {
        return post.userId === currentUserId
    }

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const eventId = urlParams.get("event")

        if (eventId) {
            setTimeout(() => {
                const postElement = document.getElementById(`post-${eventId}`)
                if (postElement) {
                    postElement.scrollIntoView({ behavior: "smooth", block: "center" })
                    postElement.classList.add("ring-2", "ring-green-500", "ring-opacity-50")
                    setTimeout(() => {
                        postElement.classList.remove("ring-2", "ring-green-500", "ring-opacity-50")
                    }, 3000)
                }
            }, 500)
        }
    }, [])

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
            <main className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm sm:text-base">
                        {error}
                    </div>
                )}
                <div className="mb-6 sm:mb-8 bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-2">Adaugă o postare</h2>
                    <p className="text-sm text-gray-500 mb-4">Postezi ca: {currentUserName}</p>

                    <form onSubmit={handlePostSubmit}>
                        <Textarea
                            placeholder={getPlaceholderByTag(newPost.tag)}
                            value={newPost.content}
                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                            className="mb-4 text-sm sm:text-base"
                        />

                        <div className="mb-4">
                            <Label htmlFor="post-tag" className="block mb-2 text-sm sm:text-base">
                                Tip postare
                            </Label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {availableTags.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        className={`px-3 py-1 rounded-full text-xs sm:text-sm ${
                                            newPost.tag === tag ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                        }`}
                                        onClick={() => setNewPost({ ...newPost, tag })}
                                    >
                                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <Label htmlFor="image-upload" className="text-sm sm:text-base">
                                Imagine
                            </Label>
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                onChange={handleImageChange}
                                ref={fileInputRef}
                                className="block w-full text-sm border border-gray-300 rounded-lg p-2 mt-1"
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
                            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
                        >
                            {loading ? "Se încarcă..." : "Postează"}
                        </button>
                    </form>
                </div>
                {posts.map((post) => (
                    <div
                        key={post.id}
                        id={`post-${post.id}`}
                        className="mb-4 sm:mb-6 bg-white rounded-lg shadow overflow-hidden transition-all duration-300"
                    >
                        <div className="p-4 sm:p-6">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                        <h3 className="font-bold text-sm sm:text-base truncate">{post.author}</h3>
                                        {post.tag && <PostTag type={post.tag} />}
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        {post.timestamp} {post.edited && <span className="italic">(editat)</span>}
                                    </p>
                                </div>
                                <CustomDropdownMenu
                                    trigger={
                                        <button className="text-gray-500 hover:text-gray-700 p-1">
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                    }
                                >
                                    {isPostOwner(post) && (
                                        <>
                                            <DropdownMenuItem onClick={() => handleEditClick(post)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Editează</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeletePost(post.id)}>
                                                <Trash className="mr-2 h-4 w-4" />
                                                <span>Șterge</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuItem onClick={() => handleReportClick(post.id)}>
                                        <Flag className="mr-2 h-4 w-4" />
                                        <span>Raportează</span>
                                    </DropdownMenuItem>
                                </CustomDropdownMenu>
                            </div>
                            <p className="mb-3 whitespace-pre-line text-sm sm:text-base">{post.content}</p>
                            {post.image && (
                                <div className="mb-3 rounded-lg overflow-hidden" style={{ maxHeight: "350px" }}>
                                    <img
                                        src={post.image || "/placeholder.svg"}
                                        alt="Post"
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => setExpandedImage(post.image)}
                                    />
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-2 pt-2 border-t">
                                <button
                                    className={`flex items-center justify-center sm:justify-start text-gray-700 hover:text-green-600 transition-colors ${
                                        hasUserLiked(post) ? "text-red-500" : ""
                                    }`}
                                    onClick={() => handleLike(post.id)}
                                >
                                    <Heart className={`mr-1 h-4 w-4 sm:h-5 sm:w-5 ${hasUserLiked(post) ? "fill-current" : ""}`} />
                                    <span className="text-sm sm:text-base">
                    {post.likes} {hasUserLiked(post) ? "Îți place" : "Aprecieri"}
                  </span>
                                </button>
                                <div className="flex items-center justify-center sm:justify-start text-gray-700">
                                    <MessageCircle className="mr-1 h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-sm sm:text-base">{comments[post.id]?.length || 0} Comentarii</span>
                                </div>
                                <button className="flex items-center justify-center sm:justify-start text-gray-700 hover:text-green-600 transition-colors">
                                    <Share2 className="mr-1 h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-sm sm:text-base">Distribuie</span>
                                </button>
                            </div>
                            <CommentSection
                                postId={post.id}
                                comments={comments[post.id] || []}
                                onAddComment={handleAddComment}
                                currentUserName={currentUserName}
                            />
                        </div>
                    </div>
                ))}
            </main>
            <Dialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                title="Editează postarea"
                footer={
                    <>
                        <button
                            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 order-2 sm:order-1"
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            Anulează
                        </button>
                        <button
                            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 order-1 sm:order-2"
                            onClick={handleSaveEdit}
                        >
                            Salvează
                        </button>
                    </>
                }
            >
                <Textarea
                    placeholder={getPlaceholderByTag(editedTag)}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="mb-4 text-sm sm:text-base"
                />

                <div className="mb-4">
                    <Label htmlFor="edit-post-tag" className="block mb-2 text-sm sm:text-base">
                        Tip postare
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {availableTags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                className={`px-3 py-1 rounded-full text-xs sm:text-sm ${
                                    editedTag === tag ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                }`}
                                onClick={() => setEditedTag(tag)}
                            >
                                {tag.charAt(0).toUpperCase() + tag.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <Label htmlFor="edit-image-upload" className="text-sm sm:text-base">
                        Imagine
                    </Label>
                    <input
                        type="file"
                        id="edit-image-upload"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        ref={editFileInputRef}
                        className="block w-full text-sm border border-gray-300 rounded-lg p-2 mt-1"
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
            <Dialog
                isOpen={isReportDialogOpen}
                onClose={() => setIsReportDialogOpen(false)}
                title="Raportează postarea"
                footer={
                    <>
                        <button
                            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 order-2 sm:order-1"
                            onClick={() => setIsReportDialogOpen(false)}
                        >
                            Anulează
                        </button>
                        <button
                            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 order-1 sm:order-2"
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
                    className="mb-4 text-sm sm:text-base"
                />
            </Dialog>
            {expandedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                    onClick={() => setExpandedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-screen">
                        <button
                            onClick={() => setExpandedImage(null)}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 z-10"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={expandedImage || "/placeholder.svg"}
                            alt="Expanded view"
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
