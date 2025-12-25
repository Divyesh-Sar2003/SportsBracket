import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

type TournamentRecord = {
  name: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
};

type Tournament = TournamentRecord & {
  id: string;
};

const TournamentsManagement = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: true
  });
  const { toast } = useToast();

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    let d: Date;
    if (typeof date === 'object' && date.toDate) {
      d = date.toDate();
    } else if (typeof date === 'object' && date.seconds) {
      d = new Date(date.seconds * 1000);
    } else {
      d = new Date(date);
    }
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const tournamentsQuery = query(collection(db, "tournaments"), orderBy("created_at", "desc"));
      const snapshot = await getDocs(tournamentsQuery);
      const formattedTournaments = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Partial<TournamentRecord>;
        return {
          id: docSnap.id,
          name: data.name ?? "",
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          is_active: data.is_active ?? true,
        };
      });
      setTournaments(formattedTournaments);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateDoc(doc(db, "tournaments", editingId), {
          ...formData,
          updated_at: serverTimestamp(),
        });
        toast({ title: "Tournament updated successfully" });
      } else {
        await addDoc(collection(db, "tournaments"), {
          ...formData,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        toast({ title: "Tournament created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchTournaments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (tournament: any) => {
    setEditingId(tournament.id);
    setFormData({
      name: tournament.name,
      start_date: tournament.start_date || "",
      end_date: tournament.end_date || "",
      is_active: tournament.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tournament?")) return;

    try {
      await deleteDoc(doc(db, "tournaments", id));
      toast({ title: "Tournament deleted successfully" });
      fetchTournaments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", start_date: "", end_date: "", is_active: true });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground mt-2">Manage tournament configurations</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tournament
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Create"} Tournament</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Create"} Tournament
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((tournament) => (
            <Card key={tournament.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{tournament.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tournament.start_date && tournament.end_date &&
                        `${formatDate(tournament.start_date)} - ${formatDate(tournament.end_date)}`
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tournament)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(tournament.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tournament.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {tournament.is_active ? 'Active' : 'Inactive'}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentsManagement;