"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (loading) return

    setLoading(true)
    setMessage("")

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage("Check your email for the confirmation link!")
      }
    } catch (error) {
      console.error("Signup error:", error)
      setMessage("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (loading) return

    setLoading(true)
    setMessage("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      }
    } catch (error) {
      console.error("Signin error:", error)
      setMessage("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setter(e.target.value)
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-950 overflow-hidden">
      <MatrixRain />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-gray-900/95 backdrop-blur-sm border-2 border-green-400/50 rounded-2xl shadow-2xl shadow-green-500/30 transform hover:scale-[1.02] transition-all duration-300">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 opacity-30 blur-lg animate-pulse"></div>
        
        <div className="relative">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
              <div className="text-black font-bold text-xl font-mono">S</div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-green-400 font-mono text-3xl bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                Saytro
              </CardTitle>
              <CardDescription className="text-gray-400 text-base">
                Accede a tu cuenta o crea una nueva
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 border border-gray-700">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-8">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="signin-email" className="text-gray-300 font-medium">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={handleInputChange(setEmail)}
                      required
                      disabled={loading}
                      className="bg-gray-800/70 backdrop-blur-sm border-2 border-gray-600 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 rounded-xl h-12 px-4 transition-all duration-200 hover:border-gray-500"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signin-password" className="text-gray-300 font-medium">
                      Contraseña
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      required
                      disabled={loading}
                      className="bg-gray-800/70 backdrop-blur-sm border-2 border-gray-600 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 rounded-xl h-12 px-4 transition-all duration-200 hover:border-gray-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed h-12"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Iniciando...</span>
                      </div>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-8">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="signup-fullname" className="text-gray-300 font-medium">
                      Nombre Completo
                    </Label>
                    <Input
                      id="signup-fullname"
                      type="text"
                      value={fullName}
                      onChange={handleInputChange(setFullName)}
                      required
                      disabled={loading}
                      className="bg-gray-800/70 backdrop-blur-sm border-2 border-gray-600 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 rounded-xl h-12 px-4 transition-all duration-200 hover:border-gray-500"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-username" className="text-gray-300 font-medium">
                      Nombre de Usuario
                    </Label>
                    <Input
                      id="signup-username"
                      type="text"
                      value={username}
                      onChange={handleInputChange(setUsername)}
                      required
                      disabled={loading}
                      className="bg-gray-800/70 backdrop-blur-sm border-2 border-gray-600 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 rounded-xl h-12 px-4 transition-all duration-200 hover:border-gray-500"
                      placeholder="juanperez"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="text-gray-300 font-medium">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={handleInputChange(setEmail)}
                      required
                      disabled={loading}
                      className="bg-gray-800/70 backdrop-blur-sm border-2 border-gray-600 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 rounded-xl h-12 px-4 transition-all duration-200 hover:border-gray-500"
                      placeholder="juan@email.com"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="text-gray-300 font-medium">
                      Contraseña
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      required
                      disabled={loading}
                      className="bg-gray-800/70 backdrop-blur-sm border-2 border-gray-600 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 rounded-xl h-12 px-4 transition-all duration-200 hover:border-gray-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed h-12"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Registrando...</span>
                      </div>
                    ) : (
                      "Crear Cuenta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {message && (
              <div
                className={`mt-6 p-4 text-sm text-center rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                  message.includes("error") || message.includes("Error")
                    ? "bg-red-900/30 text-red-300 border-red-500/50 shadow-lg shadow-red-500/20"
                    : "bg-green-900/30 text-green-300 border-green-500/50 shadow-lg shadow-green-500/20"
                }`}
              >
                {message}
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

function MatrixRain() {
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '0';
    canvas.style.opacity = '0.3';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const latin = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';

    const alphabet = katakana + latin + nums;

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);

    const rainDrops: number[] = [];
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = Math.floor(Math.random() * canvas.height / fontSize);
    }

    const draw = () => {
      if (!ctx) return;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < rainDrops.length; i++) {
        if (Math.random() > 0.98) {
          ctx.fillStyle = '#00ff00';
        } else {
          const opacity = Math.max(0.1, 1 - (rainDrops[i] * fontSize) / canvas.height);
          ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
        }
        
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
        
        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };

    const interval = setInterval(draw, 100);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    };
  }, []);

  return null;
}