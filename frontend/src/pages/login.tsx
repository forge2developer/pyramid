import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import api from "@/lib/axios"
import { setAuthCookie } from "@/lib/auth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function Login() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data } = await api.post("/auth/login", {
        name,
        password,
      })

      // Store token if returned
      if (data.data?.token) {
        localStorage.setItem("token", data.data.token)
        // Store user in cookie for app protection
        console.log("Login Response Data:", data);
        const user = data.data?.user;
        console.log("User Object to Save:", user);
        toast.success("Login success! Saving user: " + JSON.stringify(user));
        setAuthCookie({
          id: user?.id,
          name: user?.name,
          role: user?.role
        })
      }

      navigate("/")
    } catch (err) {
      if (err instanceof Error) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || err.message || "Login failed")
      } else {
        setError("An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-[url(https://static.zohocdn.com/iam/v2/components/images/bg.49756b7c711696d95133fa95451f8e13.svg)] bg-cover bg-center">
      <Card className="w-full max-w-md space-y-8 p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative group">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300 p-1 rounded-full hover:bg-muted/50"
                tabIndex={-1}
              >
                <div className="relative w-5 h-5">
                  <EyeOff
                    className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${showPassword ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                      }`}
                  />
                  <Eye
                    className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${showPassword ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                      }`}
                  />
                </div>
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a href="#" className="text-primary hover:underline">
            Sign up
          </a>
        </p>
      </Card>
    </div>
  )
}
