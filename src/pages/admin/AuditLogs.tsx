import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchAuditLogs } from "@/services/firestore/audit";
import { format } from "date-fns";
import { Loader2, History, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const AuditLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadLogs = async () => {
            try {
                const data = await fetchAuditLogs(200);
                setLogs(data);
            } catch (error) {
                console.error("Error loading audit logs:", error);
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (action: string) => {
        if (action.includes("CREATE")) return "bg-green-500/10 text-green-600 border-green-200";
        if (action.includes("DELETE")) return "bg-red-500/10 text-red-600 border-red-200";
        if (action.includes("UPDATE")) return "bg-blue-500/10 text-blue-600 border-blue-200";
        return "bg-slate-500/10 text-slate-600 border-slate-200";
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, "MMM d, yyyy HH:mm:ss");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Activity Logs</h1>
                    <p className="text-muted-foreground italic">Track which admin changed what and when.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            className="pl-9 bg-card"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <History className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Activity Audit Trail</CardTitle>
                            <p className="text-slate-300 text-sm mt-1">Showing the most recent administrative actions</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Retrieving secure logs...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20">
                            <p className="text-muted-foreground">No activity logs found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="font-bold">Timestamp</TableHead>
                                        <TableHead className="font-bold">Admin</TableHead>
                                        <TableHead className="font-bold">Action</TableHead>
                                        <TableHead className="font-bold">Resource</TableHead>
                                        <TableHead className="font-bold">Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="whitespace-nowrap text-xs font-mono text-muted-foreground">
                                                {formatTimestamp(log.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                                                        {log.admin_name?.charAt(0).toUpperCase() || 'A'}
                                                    </div>
                                                    <span className="font-semibold text-sm">{log.admin_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getActionColor(log.action)}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                                                    {log.resource_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm max-w-md truncate" title={log.details}>
                                                {log.details}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AuditLogs;
