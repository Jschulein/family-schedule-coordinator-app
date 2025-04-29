
// Main re-export file for sidebar components
import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { SidebarTrigger } from "./SidebarTrigger";
import { SidebarRail } from "./SidebarRail";
import { SidebarInset } from "./SidebarInset";
import { SidebarContent, SidebarHeader, SidebarFooter, SidebarSeparator } from "./SidebarLayout";
import { SidebarGroup, SidebarGroupLabel, SidebarGroupAction, SidebarGroupContent } from "./SidebarGroup";
import { 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "./menu";
import { SidebarInput } from "./SidebarInput";

export {
  // Base sidebar components
  Sidebar,
  SidebarProvider,
  useSidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  
  // Layout components
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  
  // Group components
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  
  // Menu components
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  
  // Submenu components
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  
  // Input component
  SidebarInput
};

