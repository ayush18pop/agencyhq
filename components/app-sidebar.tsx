"use client"

import {
  // Import only icons that are actually used
  SquareTerminal,
  Frame,
  BookOpen,
  Bot,
  Settings2,
  ChevronRight,
  User,
  ChevronsUpDown,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
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

/**
 * App Sidebar Props Interface
 * 
 * @property {string} userRole - User role determines which navigation items are visible
 */


interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: 'SUPER_ADMIN' | 'MANAGER' | 'PROFESSIONAL' | 'CLIENT'
}

/**
 * App Sidebar Component Template
 * 
 * This component serves as a template for creating a sidebar with role-based navigation.
 * Developers should customize the navigation items according to their application needs.
 */
export function AppSidebar({ userRole, ...props }: AppSidebarProps) {
  const { data: session } = useSession();
  
  // Get user role from session if not provided as prop
  const currentUserRole = userRole || session?.user?.role || 'CLIENT';

  /**
   * Application Data Template
   * 
   * DEVELOPER NOTE:
   * Replace this data with your application's actual navigation structure.
   * Each main navigation item can have sub-items defined in the 'items' array.
   */
  const data = {
    user: {
      name: session?.user?.name || "User",
      email: session?.user?.email || "user@example.com",
      avatar: session?.user?.image || "/avatars/user.jpg",
    },
    // DEVELOPER NOTE: Define your application sections/pages here
    navMain: [ // Array of NavItem objects
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: SquareTerminal, // Use appropriate icon from lucide-react
        isActive: true, // Set to true for the default active section
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
          // Add more sub-items as needed
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
          // Add more sub-items as needed
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
          // Add more sub-items as needed
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
          // Add more sub-items as needed
        ],
      },
    ],
  };

  /**
   * Role-Based Navigation Filter
   * 
   * DEVELOPER NOTE:
   * Customize this function to determine which navigation items are available
   * for each user role in your application.
   */
  const getFilteredNavigation = () => {
    switch (currentUserRole) {
      case 'SUPER_ADMIN':
        return data.navMain // Admin sees everything
      case 'MANAGER':
        return data.navMain.filter(item => 
          ['Dashboard', 'Projects', 'Clients', 'Resources'].includes(item.title)
        )
      case 'PROFESSIONAL':
        return data.navMain.filter(item => 
          ['Dashboard', 'Projects', 'Resources'].includes(item.title)
        )
      case 'CLIENT':
        return data.navMain.filter(item => 
          ['Dashboard', 'Projects'].includes(item.title)
        )
      default:
        return data.navMain
    }
  }

  const filteredNav = getFilteredNavigation();
  
  // DEVELOPER NOTE: Define your app/company branding and logo here
  const appInfo = {
    name: "Agency HQ",
    logo: SquareTerminal // Use appropriate icon from lucide-react
  };


  return (
    <Sidebar collapsible="icon" {...props}>
      {/* 
      ===================================================
      HEADER SECTION
      ===================================================
      DEVELOPER NOTE: This section contains the app/company branding
      */}
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
                    <appInfo.logo className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{appInfo.name}</span>
                    <span className="truncate text-xs">Your platform</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              {/* 
              DEVELOPER NOTE: This dropdown menu can be used for workspace selection
              or other app-level navigation. Remove if not needed.
              */}
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                {/* Add your workspace options here if needed */}
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <SquareTerminal className="size-4 shrink-0" />
                  </div>
                  {appInfo.name}
                </DropdownMenuItem>
                {/* Add additional workspaces here if needed */}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 
      ===================================================
      MAIN NAVIGATION
      ===================================================
      DEVELOPER NOTE: This section contains the main navigation items
      */}
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
                      {item.items && (
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items && (
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
                  )}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* 
        ===================================================
        OPTIONAL SECTION - DEVELOPER CUSTOMIZATION
        ===================================================
        DEVELOPER NOTE: Add additional sidebar groups/sections here if needed
        Examples: Recent Items, Favorites, Pinned Items, etc.
        
        <SidebarGroup>
          <SidebarGroupLabel>Recent Items</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="flex flex-col items-start w-full">
                  <span className="truncate font-medium text-sm">Item Name</span>
                  <span className="text-xs text-muted-foreground">Additional info</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        */}
        
      </SidebarContent>

      {/* 
      ===================================================
      FOOTER SECTION - USER PROFILE
      ===================================================
      DEVELOPER NOTE: This section contains the user profile and sign out option
      */}
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
                {/* 
                DEVELOPER NOTE: Add user-related menu items here
                Examples: Profile, Settings, Help, etc.
                */}
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
           