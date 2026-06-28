// Central navigation config for the studio. Modules marked `comingSoon` are
// scaffolded now and implemented in later build phases.

export type NavItem = {
  label: string;
  href: string;
  icon: string; // simple emoji/glyph placeholder until an icon set is added
  comingSoon?: boolean;
};

export const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "◎" },
  { label: "Image studio", href: "/dashboard/image", icon: "✦", comingSoon: true },
  { label: "Video studio", href: "/dashboard/video", icon: "▶", comingSoon: true },
  { label: "Characters", href: "/dashboard/characters", icon: "☻", comingSoon: true },
  { label: "Marketing", href: "/dashboard/marketing", icon: "◆", comingSoon: true },
  { label: "Voice & dubbing", href: "/dashboard/voice", icon: "♪", comingSoon: true },
  { label: "Gallery", href: "/dashboard/gallery", icon: "▦", comingSoon: true },
  { label: "Billing", href: "/dashboard/billing", icon: "$", comingSoon: true },
];
