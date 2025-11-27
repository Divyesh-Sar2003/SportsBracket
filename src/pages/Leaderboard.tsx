import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchLeaderboard } from "@/services/firestore/leaderboard";
import { LeaderboardEntry } from "@/types/tournament";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Medal } from "lucide-react";

const LeaderboardPage = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments().then((data) => {
      setTournaments(data);
      if (data.length > 0) {
        setTournamentId(data[0].id);
      }
    });
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

  const podium = entries.slice(0, 3);
  const tableEntries = entries.slice(3);

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase text-muted-foreground tracking-wide">Standings</p>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Track the top performers across all sports and divisions. Standings update automatically
              after each verified match result.
            </p>
          </div>
          <div className="w-full md:w-64">
            <p className="text-xs uppercase text-muted-foreground font-medium mb-1">Tournament</p>
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
            <CardTitle>Top Performers</CardTitle>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {podium.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leaderboard data yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {podium.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border bg-gradient-to-br from-background to-muted/50 p-5 flex flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground uppercase tracking-wide">
                        {entry.entity_type.toLowerCase()}
                      </span>
                      <Medal className={`h-5 w-5 ${index === 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
                    </div>
                    <h3 className="text-2xl font-bold mt-3">{entry.name}</h3>
                    <div className="mt-auto pt-6 flex items-center justify-between text-sm font-medium">
                      <span>{entry.points} pts</span>
                      <span>
                        {entry.wins}-{entry.losses}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {tableEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Full Standings</CardTitle>
            </CardHeader>
            <CardContent>
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
                    {tableEntries.map((entry, index) => (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{entry.rank ?? index + 4}</td>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;

