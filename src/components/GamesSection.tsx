import GameCard from "./GameCard";
import { Circle, Square, Grid3x3, Dumbbell, Target, Waves, Zap } from "lucide-react";

const GamesSection = () => {
  const games = [
    {
      name: "Cricket",
      type: "TEAM" as const,
      playersPerTeam: 11,
      icon: <Target className="h-6 w-6" />,
    },
    {
      name: "Volleyball",
      type: "TEAM" as const,
      playersPerTeam: 6,
      icon: <Waves className="h-6 w-6" />,
    },
    {
      name: "Chess",
      type: "SINGLE" as const,
      playersPerTeam: 1,
      icon: <Grid3x3 className="h-6 w-6" />,
    },
    {
      name: "Table Tennis",
      type: "PAIR" as const,
      playersPerTeam: 2,
      icon: <Circle className="h-6 w-6" />,
    },
    {
      name: "Carrom",
      type: "PAIR" as const,
      playersPerTeam: 2,
      icon: <Square className="h-6 w-6" />,
    },
    {
      name: "8 Ball Pool",
      type: "PAIR" as const,
      playersPerTeam: 2,
      icon: <Circle className="h-6 w-6" />,
    },
    {
      name: "Pickleball",
      type: "PAIR" as const,
      playersPerTeam: 2,
      icon: <Zap className="h-6 w-6" />,
    },
  ];

  return (
    <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10 md:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 md:mb-6">
            <span className="gradient-text">Tournament Games</span>
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 md:px-0">
            Compete in 7 exciting sports across different formats - singles, doubles, and team events
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game, index) => (
            <div
              key={game.name}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <GameCard {...game} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GamesSection;
