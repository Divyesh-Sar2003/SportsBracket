import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 py-20 md:py-32">
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Trophy className="mr-2 h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-white">Sports Week 2025</span>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
            Tournament Management Made Simple
          </h1>
          
          <p className="mb-8 text-lg text-white/90 md:text-xl">
            Organize, track, and manage your sports tournaments with ease. From registration to final results, we've got you covered.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Register Now
              </Button>
            </Link>
            <Link to="/games">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                View Games
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Feature Cards */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm border border-white/20">
            <Trophy className="mb-4 h-10 w-10 text-accent" />
            <h3 className="mb-2 text-lg font-semibold text-white">7 Sports</h3>
            <p className="text-sm text-white/80">Cricket, Volleyball, Chess, Table Tennis, Carrom, Pool, Pickleball</p>
          </div>
          
          <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm border border-white/20">
            <Users className="mb-4 h-10 w-10 text-accent" />
            <h3 className="mb-2 text-lg font-semibold text-white">Team Management</h3>
            <p className="text-sm text-white/80">Create teams, pairs, and track individual players seamlessly</p>
          </div>
          
          <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm border border-white/20">
            <Calendar className="mb-4 h-10 w-10 text-accent" />
            <h3 className="mb-2 text-lg font-semibold text-white">Live Brackets</h3>
            <p className="text-sm text-white/80">Real-time tournament brackets with instant result updates</p>
          </div>
        </div>
      </div>
      
      {/* Background decorations */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
    </section>
  );
};

export default Hero;
