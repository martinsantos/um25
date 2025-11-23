"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Calendar,
  DollarSign,
  Building2,
  User,
  FileText,
  Download,
  Share2,
  Heart,
  Eye,
  Star,
  ArrowLeft,
  ExternalLink,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Tag,
  Clock,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

// Datos de ejemplo
const projectData = {
  id: "PRJ-2024-001",
  status: "Completado",
  sort: 1,
  user_created: "María González",
  date_created: "2024-01-15",
  Imagen: "/placeholder.svg?height=800&width=1200",
  Archivo: "proyecto-completo.pdf",
  Fecha: "2024-03-20",
  Presupuesto: 85000,
  Area: "Desarrollo Web",
  Descripcion:
    "Desarrollo completo de plataforma e-commerce con integración de pagos, gestión de inventario y panel administrativo avanzado. Incluye diseño responsive, optimización SEO y sistema de analytics en tiempo real.",
  Unidad_de_negocio: "Digital Solutions",
  Palabras_clave: ["E-commerce", "React", "Node.js", "MongoDB", "Stripe", "Analytics"],
  Cliente: "TechCorp Industries",
  Titulo: "Plataforma E-commerce Avanzada con Analytics en Tiempo Real",
  Imagenes: [
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
  ],
}

export default function AntecedentesSingle() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(247)
  const [viewCount, setViewCount] = useState(1523)
  const [scrollY, setScrollY] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isAutoPlay) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % projectData.Imagenes.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isAutoPlay])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completado":
        return "bg-green-500"
      case "en progreso":
        return "bg-yellow-500"
      case "pendiente":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section with Parallax */}
      <div className="relative h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        />
        <Image
          src={projectData.Imagen || "/placeholder.svg"}
          alt={projectData.Titulo}
          fill
          className="object-cover"
          style={{
            transform: `scale(${1 + scrollY * 0.0005}) translateY(${scrollY * 0.3}px)`,
          }}
        />

        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-105"
                onClick={handleLike}
              >
                <Heart className={`w-4 h-4 mr-2 transition-colors ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                {likeCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-105"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <Badge
                className={`${getStatusColor(projectData.status)} text-white px-4 py-2 text-sm font-semibold animate-pulse`}
              >
                {projectData.status}
              </Badge>
              <Badge variant="outline" className="text-white border-white/30 backdrop-blur-sm">
                {projectData.Area}
              </Badge>
              <div className="flex items-center text-white/70 text-sm">
                <Eye className="w-4 h-4 mr-1" />
                {viewCount.toLocaleString()} vistas
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">{projectData.Titulo}</h1>

            <div className="flex flex-wrap items-center gap-6 text-white/80 mb-8">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">{projectData.Cliente}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date(projectData.Fecha).toLocaleDateString("es-ES")}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span className="font-bold text-green-400">{formatCurrency(projectData.Presupuesto)}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar Archivo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Ver Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Project Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Award, label: "Calificación", value: "4.9/5", color: "text-yellow-400" },
              { icon: Clock, label: "Duración", value: "3 meses", color: "text-blue-400" },
              { icon: TrendingUp, label: "ROI", value: "+340%", color: "text-green-400" },
              { icon: Zap, label: "Performance", value: "98%", color: "text-purple-400" },
            ].map((stat, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 group"
              >
                <CardContent className="p-6 text-center">
                  <stat.icon
                    className={`w-8 h-8 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`}
                  />
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Description Section */}
          <div className="grid lg:grid-cols-3 gap-12 mb-16">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <FileText className="w-8 h-8 mr-3 text-purple-400" />
                Descripción del Proyecto
              </h2>
              <div className="prose prose-lg prose-invert max-w-none">
                <p className="text-white/80 leading-relaxed text-lg mb-6">{projectData.Descripcion}</p>
                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-4">Características Principales:</h3>
                  <ul className="space-y-2 text-white/80">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>Diseño responsive y moderno
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>Integración de pagos segura
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>Panel administrativo completo
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>Analytics en tiempo real
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Project Details Card */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Detalles del Proyecto</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">ID:</span>
                      <span className="text-white font-mono">{projectData.id}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Creado por:</span>
                      <span className="text-white">{projectData.user_created}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Unidad:</span>
                      <span className="text-white">{projectData.Unidad_de_negocio}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Fecha creación:</span>
                      <span className="text-white">
                        {new Date(projectData.date_created).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Card */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Progreso del Proyecto</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Completado</span>
                        <span className="text-white">100%</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-400">✓ Proyecto finalizado</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Keywords Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Tag className="w-6 h-6 mr-3 text-purple-400" />
              Tecnologías Utilizadas
            </h2>
            <div className="flex flex-wrap gap-3">
              {projectData.Palabras_clave.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="px-4 py-2 text-white border-purple-400/50 hover:bg-purple-400/20 transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Image Gallery */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <Maximize2 className="w-8 h-8 mr-3 text-purple-400" />
                Galería del Proyecto
              </h2>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  {isAutoPlay ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isAutoPlay ? "Pausar" : "Reproducir"}
                </Button>
                <span className="text-white/60 text-sm">
                  {currentImageIndex + 1} / {projectData.Imagenes.length}
                </span>
              </div>
            </div>

            {/* Main Gallery Image */}
            <div className="relative mb-6 group">
              <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden">
                <Image
                  src={projectData.Imagenes[currentImageIndex] || "/placeholder.svg"}
                  alt={`Imagen ${currentImageIndex + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Navigation Arrows */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={() =>
                    setCurrentImageIndex(
                      (prev) => (prev - 1 + projectData.Imagenes.length) % projectData.Imagenes.length,
                    )
                  }
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % projectData.Imagenes.length)}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                {/* Expand Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 text-white hover:bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  <Maximize2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {projectData.Imagenes.map((image, index) => (
                <div
                  key={index}
                  className={`relative h-20 md:h-24 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${
                    index === currentImageIndex
                      ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900"
                      : "hover:ring-2 hover:ring-white/50"
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {index === currentImageIndex && <div className="absolute inset-0 bg-purple-400/20" />}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <Download className="w-5 h-5 mr-2" />
              Descargar Proyecto Completo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Ver Proyecto en Vivo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
            >
              <User className="w-5 h-5 mr-2" />
              Contactar Equipo
            </Button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setIsImageModalOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <Image
              src={projectData.Imagenes[currentImageIndex] || "/placeholder.svg"}
              alt={`Imagen ${currentImageIndex + 1}`}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full w-14 h-14 shadow-2xl hover:scale-110 transition-all duration-300"
          onClick={handleLike}
        >
          <Heart className={`w-6 h-6 transition-colors ${isLiked ? "fill-current" : ""}`} />
        </Button>
      </div>
    </div>
  )
}
