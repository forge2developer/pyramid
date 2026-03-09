import * as React from "react"
import { useEffect, useState } from "react"
import {
  Package,
  LayoutDashboard,
  GalleryVerticalEnd,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams: [
    {
      name: "Pyramid",
      logo: GalleryVerticalEnd,
      plan: "Inventory",
    },
  ],
  navMain: [

    {
      title: "Inventory",
      url: "#",
      icon: Package,
      isActive: true,
      items: [
        {
          title: "Laptop Inventory",
          url: "/Inventory/Laptop",
        },
        {
          title: "Monitor Inventory",
          url: "/Inventory/monitor",
        },
        {
          title: "Ram Inventory",
          url: "/Inventory/ram",
        },
        {
          title: "System Inventory",
          url: "/Inventory/system",
        },
        {
          title: "SSD Inventory",
          url: "/Inventory/SSD",
        },
        {
          title: "NVMe Inventory",
          url: "/Inventory/NVMe",
        },
        {
          title: "HDD Inventory",
          url: "/Inventory/HDD",
        },
        {
          title: "GraphicsCard Inventory",
          url: "/Inventory/graphicsCard",
        },
        {
          title: "Workstation",
          url: "/Inventory/workstation",
        },
        {
          title: "Mobile Workstation",
          url: "/Inventory/mobileWorkstation",
        },
        {
          title: "M.2 Inventory",
          url: "/Inventory/m2",
        },

      ],
    },
    {
      title: "Companies",
      url: "#",
      icon: Package,
      isActive: true,
      items: [
        {
          title: "Companies",
          url: "/Companies/Company",
        },
        {
          title: "Challan History",
          url: "/challan-history",
        },


      ],
    },
    {
      title: "Scrap",
      url: "#",
      icon: Package,
      isActive: true,
      items: [
        {
          title: "Scrap History",
          url: "/scrap-history",
        },

      ],
    },

  ],
  projects: [
    {
      name: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Add Products",
      url: "/Inventory/add-products",
      icon: Package,
    },
    {
      name: "User Management",
      url: "/user-management",
      icon: Package,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)

  useEffect(() => {
    // Get user from JWT token in localStorage
    const token = localStorage.getItem("token")
    if (token) {
      try {
        // Decode JWT token (base64)
        const payload = JSON.parse(atob(token.split(".")[1]))
        setUser({
          name: payload.name || "User",
          role: payload.role || "user",
        })
      } catch (e) {
        console.error("Failed to decode token", e)
      }
    }
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects.filter(p => p.name !== "User Management" || user?.role === "admin")} />
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
