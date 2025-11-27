import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchLeaderboard } from "@/services/firestore/leaderboard";
import { LeaderboardEntry } from "@/types/tournament";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const LeaderboardManagement = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments().then(setTournaments);
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      setEntries([]);
      return;
    }
    setLoading(true);
    fetchLeaderboard(tournamentId)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [tournamentId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2 w-full sm:w-64">
          <p className="text-sm font-medium">Tournament</p>
          <Select value={tournamentId} onValueChange={setTournamentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((tournament) => (
                <SelectItem value={tournament.id} key={tournament.id}>
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Leaderboard</CardTitle>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          {!tournamentId ? (
            <p className="text-muted-foreground text-sm">Select a tournament to view standings.</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No leaderboard data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4">Rank</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Points</th>
                    <th className="py-2 pr-4">Wins</th>
                    <th className="py-2 pr-4">Losses</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{entry.rank ?? index + 1}</td>
                      <td className="py-2 pr-4 font-medium">{entry.name}</td>
                      <td className="py-2 pr-4 capitalize">{entry.entity_type.toLowerCase()}</td>
                      <td className="py-2 pr-4">{entry.points}</td>
                      <td className="py-2 pr-4">{entry.wins}</td>
                      <td className="py-2 pr-4">{entry.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardManagement;

