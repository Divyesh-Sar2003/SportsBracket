import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface GameCardProps {
  name: string;
  type: "SINGLE" | "PAIR" | "TEAM";
  playersPerTeam: number;
  icon: React.ReactNode;
}

const GameCard = ({ name, type, playersPerTeam, icon }: GameCardProps) => {
  const getTypeLabel = () => {
    switch (type) {
      case "SINGLE":
        return "1v1";
      case "PAIR":
        return "2v2";
      case "TEAM":
        return `${playersPerTeam}v${playersPerTeam}`;
    }
  };

  const getTypeBadgeVariant = () => {
    switch (type) {
      case "SINGLE":
        return "default";
      case "PAIR":
        return "secondary";
      case "TEAM":
        return "outline";
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            {icon}
          </div>
          <Badge variant={getTypeBadgeVariant()} className="text-xs">
            {getTypeLabel()}
          </Badge>
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">{name}</h3>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-1 h-4 w-4" />
          <span>{type === "SINGLE" ? "Individual" : type === "PAIR" ? "Doubles" : "Team"} Competition</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameCard;
