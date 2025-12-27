import { useState, useEffect } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchGames } from "@/services/firestore/games";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { Game, Tournament } from "@/types/tournament";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

type GameType = "SINGLE" | "PAIR" | "TEAM";

const GamesManagement = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    game_type: "SINGLE" as "SINGLE" | "PAIR" | "TEAM",
    players_per_team: 1,
    is_active: true,
    tournament_id: ""
  });
  const { toast } = useToast();
  const { setIsLoading } = useLoading();

  useEffect(() => {
    setIsLoading(true);
    loadTournaments();
  }, [setIsLoading]);

  useEffect(() => {
    if (selectedTournamentId) {
      loadGames();
    } else {
      setGames([]);
    }
  }, [selectedTournamentId]);

  const loadTournaments = async () => {
    try {
      const data = await fetchTournaments();
      setTournaments(data);
      if (data.length > 0 && !selectedTournamentId) {
        setSelectedTournamentId(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGames = async () => {
    if (!selectedTournamentId) return;

    try {
      setLoading(true);
      const data = await fetchGames(selectedTournamentId);
      setGames(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tournament_id) {
      toast({
        title: "Error",
        description: "Please select a tournament",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        await updateDoc(doc(db, "games", editingId), {
          ...formData,
          updated_at: serverTimestamp(),
        });
        toast({ title: "Game updated successfully" });
      } else {
        await addDoc(collection(db, "games"), {
          ...formData,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        toast({ title: "Game created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      const data = await fetchGames(selectedTournamentId);
      setGames(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (game: Game) => {
    setEditingId(game.id);
    setFormData({
      name: game.name,
      game_type: game.game_type,
      players_per_team: game.players_per_team,
      is_active: game.is_active,
      tournament_id: game.tournament_id || selectedTournamentId
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this game?")) return;

    try {
      setIsLoading(true);
      await deleteDoc(doc(db, "games", id));
      toast({ title: "Game deleted successfully" });
      const data = await fetchGames(selectedTournamentId);
      setGames(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      game_type: "SINGLE",
      players_per_team: 1,
      is_active: true,
      tournament_id: selectedTournamentId
    });
    setEditingId(null);
  };

  const getTournamentName = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    return tournament?.name || "Unknown Tournament";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Games</h1>
          <p className="text-muted-foreground mt-2">Configure sports and game settings</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-full md:w-64">
            <Label htmlFor="tournament-select" className="text-xs uppercase text-muted-foreground font-medium mb-1 block">
              Tournament
            </Label>
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger id="tournament-select">
                <SelectValue placeholder="Select tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (open && !editingId) {
              // Set tournament_id when opening dialog for new game
              setFormData(prev => ({ ...prev, tournament_id: selectedTournamentId }));
            }
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button disabled={!selectedTournamentId}>
                <Plus className="h-4 w-4 mr-2" />
                Add Game
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Create"} Game</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament_id">Tournament</Label>
                  <Select
                    value={formData.tournament_id}
                    onValueChange={(value) => setFormData({ ...formData, tournament_id: value })}
                    disabled={!!editingId}
                  >
                    <SelectTrigger id="tournament_id">
                      <SelectValue placeholder="Select tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((tournament) => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Game Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="game_type">Game Type</Label>
                  <Select
                    value={formData.game_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, game_type: value as GameType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single (1v1)</SelectItem>
                      <SelectItem value="PAIR">Pair (2v2)</SelectItem>
                      <SelectItem value="TEAM">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="players_per_team">Players Per Team</Label>
                  <Input
                    id="players_per_team"
                    type="number"
                    min="1"
                    value={formData.players_per_team}
                    onChange={(e) => setFormData({ ...formData, players_per_team: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Update" : "Create"} Game
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedTournamentId ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please select a tournament to view or create games.
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading games...
          </CardContent>
        </Card>
      ) : games.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No games found for this tournament. Click "Add Game" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Card key={game.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{game.name}</CardTitle>
                    {game.tournament_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTournamentName(game.tournament_id)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(game)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(game.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{game.game_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Players:</span>
                  <span className="font-medium">{game.players_per_team}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${game.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {game.is_active ? 'Active' : 'Inactive'}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GamesManagement;