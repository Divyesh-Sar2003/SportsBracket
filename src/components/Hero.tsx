import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar, Zap, ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent py-16 md:py-24 lg:py-32">
      <div className="container relative z-10 px-4 md:px-6">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 md:mb-8 inline-flex items-center rounded-full bg-white/10 px-4 md:px-6 py-2 md:py-2.5 backdrop-blur-sm border border-white/20 animate-slide-down hover:scale-105 transition-transform">
            <Trophy className="mr-2 h-4 w-4 md:h-5 md:w-5 text-accent animate-pulse" />
            <span className="text-xs md:text-sm font-semibold text-white">Sports Week 2025</span>
            <Zap className="ml-2 h-4 w-4 md:h-5 md:w-5 text-warning" />
          </div>

          <h1 className="mb-6 md:mb-8 text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-white leading-tight animate-slide-up">
            Tournament Management
            <br />
            <span className="bg-gradient-to-r from-accent via-warning to-accent bg-clip-text text-transparent animate-pulse">
              Made Simple
            </span>
          </h1>

          <p className="mb-8 md:mb-10 text-base md:text-lg lg:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed px-4 md:px-0 animate-fade-in">
            Organize, track, and manage your sports tournaments with ease. From registration to final results, we've got you covered with cutting-edge technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in px-4 md:px-0">
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-accent to-warning hover:from-warning hover:to-accent text-white font-bold shadow-2xl hover:shadow-accent/50 hover:scale-110 transition-all group"
              >
                Register Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/leaderboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto glass-card border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all font-semibold"
              >
                View Leaderboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards - Enhanced with Glassmorphism */}
        <div className="mt-12 md:mt-20 grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4 md:px-0">
          <div className="group rounded-2xl p-6 md:p-8 bg-white/15 backdrop-blur-md border border-white/30 hover:border-white/50 hover:bg-white/20 transition-all hover:scale-105 hover:-translate-y-2 animate-slide-up shadow-xl">
            <div className="relative inline-block mb-4 md:mb-6">
              <Trophy className="h-10 w-10 md:h-12 md:w-12 text-white drop-shadow-lg group-hover:rotate-12 transition-transform" />
              <div className="absolute inset-0 blur-xl bg-accent/40 group-hover:bg-accent/60 transition-all" />
            </div>
            <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-bold text-white drop-shadow-md">7 Sports</h3>
            <p className="text-sm md:text-base text-white drop-shadow-sm leading-relaxed">Cricket, Volleyball, Chess, Table Tennis, Carrom, Pool, Pickleball</p>
          </div>

          <div className="group rounded-2xl p-6 md:p-8 bg-white/15 backdrop-blur-md border border-white/30 hover:border-white/50 hover:bg-white/20 transition-all hover:scale-105 hover:-translate-y-2 animate-slide-up shadow-xl" style={{ animationDelay: '0.1s' }}>
            <div className="relative inline-block mb-4 md:mb-6">
              <Users className="h-10 w-10 md:h-12 md:w-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 blur-xl bg-warning/40 group-hover:bg-warning/60 transition-all" />
            </div>
            <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-bold text-white drop-shadow-md">Team Management</h3>
            <p className="text-sm md:text-base text-white drop-shadow-sm leading-relaxed">Create teams, pairs, and track individual players seamlessly</p>
          </div>

          <div className="group rounded-2xl p-6 md:p-8 bg-white/15 backdrop-blur-md border border-white/30 hover:border-white/50 hover:bg-white/20 transition-all hover:scale-105 hover:-translate-y-2 sm:col-span-2 lg:col-span-1 animate-slide-up shadow-xl" style={{ animationDelay: '0.2s' }}>
            <div className="relative inline-block mb-4 md:mb-6">
              <Calendar className="h-10 w-10 md:h-12 md:w-12 text-white drop-shadow-lg group-hover:rotate-6 transition-transform" />
              <div className="absolute inset-0 blur-xl bg-info/40 group-hover:bg-info/60 transition-all" />
            </div>
            <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-bold text-white drop-shadow-md">Live Brackets</h3>
            <p className="text-sm md:text-base text-white drop-shadow-sm leading-relaxed">Real-time tournament brackets with instant result updates</p>
          </div>
        </div>
      </div>

      {/* Enhanced Background Decorations with Animation */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-accent/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-warning/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[600px] md:h-[600px] bg-white/5 rounded-full blur-3xl" />

      {/* Animated Particles */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-white/40 rounded-full animate-ping" />
      <div className="absolute top-20 right-20 w-3 h-3 bg-accent/60 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-20 left-20 w-2 h-2 bg-warning/60 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default Hero;
