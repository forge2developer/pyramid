import { useState, useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { getAuthCookie, removeAuthCookie } from "@/lib/auth"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Calendar, Calculator, CreditCard, LogOut, Settings, Smile, User } from "lucide-react"

function App() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const user = getAuthCookie()
    if (!user) {
      navigate("/login")
    }
  }, [navigate])

  const handleLogout = () => {
    removeAuthCookie()
    localStorage.removeItem("token") // Also clear token
    navigate("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="rounded-t-xl z-50 bg-background  flex h-13 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 mb-1 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
          {/* <Button
            variant="outline"
            className="flex-1 max-w-[300px] bg-primary-900 text-gray-300 hover:bg-primary-900 hover:text-gray-400 rounded-xl transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-1 focus:ring-gray-300 flex justify-between px-3 md:px-4"
            onClick={() => setOpen(true)}
          >
            <span className="truncate">Search...</span>
          </Button> */}
          <CommandDialog open={open} onOpenChange={setOpen}>
            {/* ...existing command content... */}
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>
                  <Calendar />
                  <span>Calendar</span>
                </CommandItem>
                <CommandItem>
                  <Smile />
                  <span>Search Emoji</span>
                </CommandItem>
                <CommandItem>
                  <Calculator />
                  <span>Calculator</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem>
                  <User />
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <CreditCard />
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
          <div className="ml-auto flex items-center pr-2 md:pr-4">
            <Button
              variant="default"
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-3 md:px-4"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Log out</span>
            </Button>
          </div>
        </header>

        {/* Render nested app routes here */}
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}

export default App