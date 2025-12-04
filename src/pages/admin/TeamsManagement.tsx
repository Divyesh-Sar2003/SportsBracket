 import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchTeams, createTeam, updateTeam, deleteTeam, addPlayerToTeam } from "@/services/firestore/teams";
import { fetchGames } from "@/services/firestore/games";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchUsers, User } from "@/services/firestore/users";
import { addParticipant } from "@/services/firestore/participants";
import { Team, Tournament, Game } from "@/types/tournament";
import { updateDoc, doc, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

const TeamsManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [playersDialogOpen, setPlayersDialogOpen] = useState(false);
  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    is_pair: false,
    status: "pending" as "pending" | "confirmed",
    tournament_id: "",
    game_id: ""
  });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedPairPlayers, setSelectedPairPlayers] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const { toast } = useToast();

  const selectedGame = games.find(g => g.id === selectedGameId);
  const isTeamGame = selectedGame?.game_type === "TEAM";
  const isPairGame = selectedGame?.game_type === "PAIR";
  const isSingleGame = selectedGame?.game_type === "SINGLE";

  useEffect(() => {
    loadTournaments();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      loadGames();
    } else {
      setGames([]);
      setSelectedGameId("");
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    if (selectedTournamentId && selectedGameId) {
      loadTeams();
    } else {
      setTeams([]);
    }
  }, [selectedTournamentId, selectedGameId]);

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
    }
  };

  const loadGames = async () => {
    if (!selectedTournamentId) return;

    try {
      const data = await fetchGames(selectedTournamentId);
      setGames(data);
      if (data.length > 0 && !selectedGameId) {
        setSelectedGameId(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadTeams = async () => {
    if (!selectedTournamentId || !selectedGameId) return;

    try {
      setLoading(true);
      const data = await fetchTeams({ tournamentId: selectedTournamentId, gameId: selectedGameId });
      setTeams(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tournament_id || !formData.game_id) {
      toast({
        title: "Error",
        description: "Please select a tournament and game",
        variant: "destructive"
      });
      return;
    }

    // For pair games, don't require a name
    if (!isPairGame && !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingId) {
        await updateTeam(editingId, {
          name: formData.name,
          is_pair: formData.is_pair,
          status: formData.status
        });
        toast({ title: `${isPairGame ? "Pair" : "Team"} updated successfully` });
      } else {
        await createTeam({
          ...formData,
          name: isPairGame ? `Pair ${Date.now()}` : formData.name, // Auto-generate name for pairs
          player_ids: []
        });
        toast({ title: `${isPairGame ? "Pair" : "Team"} created successfully` });
      }

      setDialogOpen(false);
      resetForm();
      loadTeams();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (team: Team) => {
    setEditingId(team.id);
    setFormData({
      name: team.name,
      is_pair: team.is_pair,
      status: team.status,
      tournament_id: team.tournament_id,
      game_id: team.game_id
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      await deleteTeam(id);
      toast({ title: "Team deleted successfully" });
      loadTeams();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleManagePlayers = (team: Team) => {
    setSelectedTeamForPlayers(team);
    setSelectedPlayers(team.player_ids);
    setPlayersDialogOpen(true);
  };

  const handleCreatePair = async () => {
    if (selectedPairPlayers.length !== 2) return;

    try {
      const teamId = await createTeam({
        tournament_id: selectedTournamentId,
        game_id: selectedGameId,
        name: `Pair ${Date.now()}`,
        is_pair: true,
        player_ids: selectedPairPlayers,
        status: "pending"
      });

      // Create participant for the pair
      await addParticipant({
        tournament_id: selectedTournamentId,
        game_id: selectedGameId,
        type: "TEAM",
        team_id: teamId,
      });

      toast({ title: "Pair created successfully" });
      setPairDialogOpen(false);
      setSelectedPairPlayers([]);
      loadTeams();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdatePlayers = async () => {
    if (!selectedTeamForPlayers) return;

    try {
      // Remove players not in selectedPlayers
      const playersToRemove = selectedTeamForPlayers.player_ids.filter(id => !selectedPlayers.includes(id));
      for (const playerId of playersToRemove) {
        await updateDoc(doc(db, "teams", selectedTeamForPlayers.id), {
          player_ids: arrayRemove(playerId),
          updated_at: serverTimestamp()
        });
      }

      // Add new players
      const playersToAdd = selectedPlayers.filter(id => !selectedTeamForPlayers.player_ids.includes(id));
      for (const playerId of playersToAdd) {
        await addPlayerToTeam(selectedTeamForPlayers.id, playerId);
      }

      toast({ title: "Team players updated successfully" });
      setPlayersDialogOpen(false);
      setSelectedTeamForPlayers(null);
      loadTeams();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      is_pair: false,
      status: "pending",
      tournament_id: selectedTournamentId,
      game_id: selectedGameId
    });
    setEditingId(null);
  };

  const getTournamentName = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    return tournament?.name || "Unknown Tournament";
  };

  const getGameName = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    return game?.name || "Unknown Game";
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || "Unknown User";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-2">Create and manage teams for tournaments</p>
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

          <div className="w-full md:w-64">
            <Label htmlFor="game-select" className="text-xs uppercase text-muted-foreground font-medium mb-1 block">
              Game
            </Label>
            <Select value={selectedGameId} onValueChange={setSelectedGameId} disabled={!selectedTournamentId}>
              <SelectTrigger id="game-select">
                <SelectValue placeholder="Select game" />
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isTeamGame && (
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (open && !editingId) {
                setFormData(prev => ({
                  ...prev,
                  tournament_id: selectedTournamentId,
                  game_id: selectedGameId,
                  is_pair: false
                }));
              }
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button disabled={!selectedTournamentId || !selectedGameId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit" : "Create"} Team</DialogTitle>
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
                    <Label htmlFor="game_id">Game</Label>
                    <Select
                      value={formData.game_id}
                      onValueChange={(value) => setFormData({ ...formData, game_id: value })}
                      disabled={!!editingId}
                    >
                      <SelectTrigger id="game_id">
                        <SelectValue placeholder="Select game" />
                      </SelectTrigger>
                      <SelectContent>
                        {games.map((game) => (
                          <SelectItem key={game.id} value={game.id}>
                            {game.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as "pending" | "confirmed" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingId ? "Update" : "Create"} Team
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {isPairGame && (
            <Button disabled={!selectedTournamentId || !selectedGameId} onClick={() => setPairDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pair
            </Button>
          )}
        </div>
      </div>

      {!selectedTournamentId || !selectedGameId ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please select a tournament and game to view or create teams.
          </CardContent>
        </Card>
      ) : isSingleGame ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Single player games don't require team management. Players are managed through registrations.
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading {isPairGame ? "pairs" : "teams"}...
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No {isPairGame ? "pairs" : "teams"} found for this tournament and game. Click "Add {isPairGame ? "Pair" : "Team"}" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {team.is_pair
                        ? team.player_ids.length === 2
                          ? `${getUserName(team.player_ids[0])} & ${getUserName(team.player_ids[1])}`
                          : `Pair ${team.id.slice(-4)}`
                        : team.name
                      }
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTournamentName(team.tournament_id)} - {getGameName(team.game_id)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleManagePlayers(team)}>
                      <Users className="h-4 w-4" />
                    </Button>
                    {!team.is_pair && (
                      <Button variant="outline" size="sm" onClick={() => handleEdit(team)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleDelete(team.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{team.is_pair ? "Pair" : "Team"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Players:</span>
                  <span className="font-medium">{team.player_ids.length}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${team.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {team.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Pair Dialog */}
      <Dialog open={pairDialogOpen} onOpenChange={(open) => {
        setPairDialogOpen(open);
        if (!open) {
          setSelectedPairPlayers([]);
          setUserSearchTerm("");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Pair</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Select exactly 2 players for this pair
              {selectedPairPlayers.length > 0 && (
                <span className="font-medium"> ({selectedPairPlayers.length} selected)</span>
              )}
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Search users by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {users
                .filter((user) =>
                  user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                )
                .map((user) => (
                <div key={user.id} className="flex items-center space-x-2 p-2 border-b">
                  <Checkbox
                    id={`pair-user-${user.id}`}
                    checked={selectedPairPlayers.includes(user.id)}
                    disabled={!selectedPairPlayers.includes(user.id) && selectedPairPlayers.length >= 2}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPairPlayers(prev => [...prev, user.id]);
                      } else {
                        setSelectedPairPlayers(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <Label htmlFor={`pair-user-${user.id}`} className="flex-1">
                    {user.name} ({user.email})
                  </Label>
                </div>
                ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPairDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePair} disabled={selectedPairPlayers.length !== 2}>
                Create Pair
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Players Dialog */}
      <Dialog open={playersDialogOpen} onOpenChange={(open) => {
        setPlayersDialogOpen(open);
        if (!open) {
          setUserSearchTerm("");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Players - {selectedTeamForPlayers?.is_pair
                ? (selectedTeamForPlayers.player_ids.length === 2
                  ? `${getUserName(selectedTeamForPlayers.player_ids[0])} & ${getUserName(selectedTeamForPlayers.player_ids[1])}`
                  : `Pair ${selectedTeamForPlayers.id.slice(-4)}`)
                : selectedTeamForPlayers?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {selectedTeamForPlayers?.is_pair
                ? "Select exactly 2 players for this pair"
                : `Select up to ${selectedGame?.players_per_team || 1} players for this team`}
              {selectedPlayers.length > 0 && (
                <span className="font-medium"> ({selectedPlayers.length} selected)</span>
              )}
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Search users by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {users
                .filter((user) =>
                  user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                )
                .map((user) => (
                <div key={user.id} className="flex items-center space-x-2 p-2 border-b">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedPlayers.includes(user.id)}
                    disabled={!selectedPlayers.includes(user.id) &&
                      selectedPlayers.length >= (selectedTeamForPlayers?.is_pair ? 2 : (selectedGame?.players_per_team || 1))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPlayers(prev => [...prev, user.id]);
                      } else {
                        setSelectedPlayers(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <Label htmlFor={`user-${user.id}`} className="flex-1">
                    {user.name} ({user.email})
                  </Label>
                </div>
                ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPlayersDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePlayers}>
                Update Players
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsManagement;
