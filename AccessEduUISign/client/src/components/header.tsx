import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme } from "@/lib/theme-provider";
import { useAccessibility } from "@/lib/accessibility-context";
import { useAuth } from "@/lib/auth-context";
import {
  Sun,
  Moon,
  Monitor,
  Accessibility,
  Menu,
  LogOut,
  User,
  History,
  Hand,
  Home,
  Type,
  Eye,
  Keyboard,
  Gauge,
  Star,
  GraduationCap,
  Camera,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { settings, setFontSize, toggleHighContrast, toggleReducedMotion } = useAccessibility();
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNavItems = () => {
    return [
      { href: "/", label: "Home", icon: Home },
    ];
  };

  const currentNavItems = getNavItems();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6 gap-4">
        <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground shadow-lg transform hover:scale-110 transition-transform">
            <Hand className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="font-bold text-2xl hidden sm:inline-block tracking-tight">AccessEdu</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {currentNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className="gap-2"
                data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <Link href="/auth">
              <Button variant="default" className="hidden sm:flex" data-testid="button-sign-in">
                Sign In
              </Button>
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-theme-toggle" aria-label="Toggle theme">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")} data-testid="menu-theme-light">
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} data-testid="menu-theme-dark">
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} data-testid="menu-theme-system">
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-accessibility" aria-label="Accessibility settings">
                <Accessibility className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                Accessibility Settings
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="p-3 space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Type className="h-4 w-4" />
                    Font Size
                  </Label>
                  <div className="flex gap-2">
                    {(["100", "125", "150"] as const).map((size) => (
                      <Button
                        key={size}
                        variant={settings.fontSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFontSize(size)}
                        data-testid={`button-font-${size}`}
                        aria-pressed={settings.fontSize === size}
                      >
                        {size}%
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="high-contrast" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Eye className="h-4 w-4" />
                    High Contrast
                  </Label>
                  <Switch
                    id="high-contrast"
                    checked={settings.highContrast}
                    onCheckedChange={toggleHighContrast}
                    data-testid="switch-high-contrast"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="reduced-motion" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Gauge className="h-4 w-4" />
                    Reduced Motion
                  </Label>
                  <Switch
                    id="reduced-motion"
                    checked={settings.reducedMotion}
                    onCheckedChange={toggleReducedMotion}
                    data-testid="switch-reduced-motion"
                  />
                </div>

                <DropdownMenuSeparator />
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Keyboard className="h-3 w-3" />
                  Press Tab to navigate, Enter to select
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-user-menu" aria-label="User menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.userType?.replace("_", " ")}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-6" role="navigation" aria-label="Mobile navigation">
                {currentNavItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={location === item.href ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                      data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
