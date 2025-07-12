"use client"

import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  ChevronRight,
  User,
  ChevronsUpDown,
} from "lucide-react"
import { signOut } from "next-auth/react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Sample data - you can replace this with role-based data
const data = {
  user: {
    name: "Agency User",
    email: "user@agency.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "Agency HQ",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Client Portal",
      logo: AudioWaveform,
      plan: "Professional",
    },
    {
      name: "Team Workspace",
      logo: Command,
      plan: "Team",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      
      
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Frame,
      items: [
        {
          title: "All Projects",
          url: "/projects",
        },
        {
          title: "Active Projects",
          url: "/projects/active",
        },
        {
          title: "Completed",
          url: "/projects/completed",
        },
        {
          title: "Templates",
          url: "/projects/templates",
        },
      ],
    },
    {
      title: "Clients",
      url: "/clients",
      icon: Bot,
      items: [
        {
          title: "All Clients",
          url: "/clients",
        },
        {
          title: "Active Clients",
          url: "/clients/active",
        },
        {
          title: "Prospects",
          url: "/clients/prospects",
        },
      ],
    },
    {
      title: "Resources",
      url: "/resources",
      icon: BookOpen,
      items: [
        {
          title: "Knowledge Base",
          url: "/resources/knowledge",
        },
        {
          title: "Templates",
          url: "/resources/templates",
        },
        {
          title: "Assets",
          url: "/resources/assets",
        },
        {
          title: "Brand Guidelines",
          url: "/resources/brand",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
        {
          title: "Integrations",
          url: "/settings/integrations",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Website Redesign",
      url: "/projects/website-redesign",
      icon: Frame,
    },
    {
      name: "Marketing Campaign",
      url: "/projects/marketing-campaign",
      icon: PieChart,
    },
    {
      name: "Brand Strategy",
      url: "/projects/brand-strategy",
      icon: Map,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: 'admin' | 'manager' | 'employee' | 'client'
}

export function AppSidebar({ userRole = 'admin', ...props }: AppSidebarProps) {
  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    switch (userRole) {
      case 'admin':
        return data.navMain // Admin sees everything
      case 'manager':
        return data.navMain.filter(item => 
          ['Dashboard', 'Projects', 'Clients', 'Resources'].includes(item.title)
        )
      case 'employee':
        return data.navMain.filter(item => 
          ['Dashboard', 'Projects', 'Resources'].includes(item.title)
        )
      case 'client':
        return data.navMain.filter(item => 
          ['Dashboard', 'Projects'].includes(item.title)
        )
      default:
        return data.navMain
    }
  }

  const filteredNav = getFilteredNavigation()
  const activeTeam = data.teams[0]
  const ActiveTeamLogo = activeTeam.logo

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <ActiveTeamLogo className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{activeTeam.name}</span>
                    <span className="truncate text-xs">{activeTeam.plan}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                {data.teams.map((team) => (
                  <DropdownMenuItem key={team.name} className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <team.logo className="size-4 shrink-0" />
                    </div>
                    {team.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNav.map((item) => (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        
        {userRole === 'admin' || userRole === 'manager' ? (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
              {data.projects.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <User className="size-4" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{data.user.name}</span>
                    <span className="truncate text-xs">{data.user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>Profile</DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
