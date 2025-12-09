import { Trophy, LogOut, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Navbar = () => {
  const { user, signOut, isAdmin, isPlayer } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/40 glass-card shadow-lg">
      <div className="container flex h-16 md:h-18 items-center justify-between px-4 md:px-6">
        <Link to="/" className="group flex items-center space-x-2 transition-transform hover:scale-105">
          <div className="relative">
            <Trophy className="h-6 w-6 md:h-7 md:w-7 text-primary transition-all group-hover:rotate-12 group-hover:text-accent" />
            <div className="absolute inset-0 blur-lg bg-primary/30 group-hover:bg-accent/40 transition-all" />
          </div>
          <span className="text-xl md:text-2xl font-bold gradient-text font-['Outfit']">SportsBracket</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/leaderboard" className="text-sm font-semibold text-foreground hover:text-primary transition-all hover:scale-105 relative group">
            Leaderboard
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full" />
          </Link>
          {isPlayer && (
            <Link to="/dashboard" className="text-sm font-semibold text-foreground hover:text-primary transition-all hover:scale-105 relative group">
              Player Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full" />
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" className="text-sm font-semibold text-foreground hover:text-primary transition-all hover:scale-105 relative group">
              Admin
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full" />
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <>
              <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">{user.displayName}</span>
              <Button variant="ghost" onClick={signOut} className="hover-lift">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="hover-lift">Login</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-105 transition-all">Register</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-all active:scale-95"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6 text-primary" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 glass animate-slide-down">
          <div className="container py-4 space-y-3 px-4">
            <Link
              to="/leaderboard"
              className="block py-3 px-4 text-sm font-semibold text-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              Leaderboard
            </Link>
            {isPlayer && (
              <Link
                to="/dashboard"
                className="block py-3 px-4 text-sm font-semibold text-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Player Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="block py-3 px-4 text-sm font-semibold text-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            <div className="flex flex-col space-y-3 pt-4 border-t border-border/40">
              {user ? (
                <>
                  <div className="px-4 py-2 bg-muted rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">{user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full hover-lift">Login</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
