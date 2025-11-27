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
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-4">
            Tournament Games
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compete in 7 exciting sports across different formats - singles, doubles, and team events
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.name} {...game} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GamesSection;
