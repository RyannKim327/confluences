export type SiteLink = {
  name: string
  href: string
  icon: "home" | "editor" | "projects" | "about"
}

export const site: SiteLink[] = [
  { name: "Home", href: "/", icon: "home" },
  { name: "Editor", href: "/editor", icon: "editor" },
  { name: "Projects", href: "/projects", icon: "projects" },
  { name: "About", href: "/about", icon: "about" },
]
