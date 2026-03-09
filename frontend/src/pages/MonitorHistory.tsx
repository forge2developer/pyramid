
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Monitor, History, User, FileText, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface MonitorDetails {
    id: number;
    name: string; // Brand
    size: string;
    display: string;
    service_tag: string;
    pyramid_id: string;
    inventoryID: string;
    isAvailable: number | boolean;

    // Company Info
    CompanyID: number | null;
    company_name: string | null;
    customer_name: string | null;
    company_phone: string | null;
}

interface ActivityLog {
    id: number;
    reason: string;
    log: string;
    CompanyID: number;
    inventoryID: number;
    userID: number;
    productId: number;
    data: string; // Date
    user_name: string;
    company_name: string;
}

export default function MonitorHistory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [monitor, setMonitor] = useState<MonitorDetails | null>(null);
    const [history, setHistory] = useState<ActivityLog[]>([]);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [logType, setLogType] = useState("All");
    const [appliedStartDate, setAppliedStartDate] = useState("");
    const [appliedEndDate, setAppliedEndDate] = useState("");
    const [appliedLogType, setAppliedLogType] = useState("All");

    useEffect(() => {
        fetchHistory();
    }, [id]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/inventory/history/monitor/${id}`);
            if (response.data.success) {
                setMonitor(response.data.data.monitor);
                setHistory(response.data.data.history);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = useMemo(() => {
        return history.filter((log) => {
            if (appliedLogType !== "All" && log.log !== appliedLogType) return false;
            if (appliedStartDate && log.data) {
                const logDate = new Date(log.data);
                const start = new Date(appliedStartDate);
                start.setHours(0, 0, 0, 0);
                if (logDate < start) return false;
            }
            if (appliedEndDate && log.data) {
                const logDate = new Date(log.data);
                const end = new Date(appliedEndDate);
                end.setHours(23, 59, 59, 999);
                if (logDate > end) return false;
            }
            return true;
        });
    }, [history, appliedStartDate, appliedEndDate, appliedLogType]);

    const handleDownloadPDF = async () => {
        if (!monitor) return;
        try {
            setDownloadingPDF(true);
            const response = await api.post(
                `/inventory/history/monitor/${id}/pdf`,
                {
                    startDate: startDate || null,
                    endDate: endDate || null,
                    logType: logType !== "All" ? logType : null,
                    details: {
                        brand: monitor.name,
                        size: monitor.size,
                        display: monitor.display,
                        serviceTag: monitor.service_tag,
                        pyramidID: monitor.pyramid_id,
                    },
                },
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Monitor_History_${new Date().toISOString().split("T")[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("PDF downloaded successfully");
        } catch (error) {
            console.error("Failed to download PDF", error);
            toast.error("Failed to download PDF");
        } finally {
            setDownloadingPDF(false);
        }
    };

    const applyFilters = () => {
        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);
        setAppliedLogType(logType);
    };

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setLogType("All");
        setAppliedStartDate("");
        setAppliedEndDate("");
        setAppliedLogType("All");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!monitor) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h1 className="text-2xl font-bold text-red-500">Monitor Not Found</h1>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Monitor Details & History</h1>
            </div>

            {/* Monitor Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Product Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* <div>
                            <p className="text-sm font-medium text-muted-foreground">Monitor ID</p>
                            <p className="text-lg font-semibold">{monitor.id}</p>
                        </div> */}
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Brand & Display</p>
                            <p className="text-lg font-semibold">{monitor.name} - {monitor.display}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Size</p>
                            <p className="text-lg font-semibold">{monitor.size}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Service Tag</p>
                            <p className="text-lg font-semibold">{monitor.service_tag || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pyramid ID</p>
                            <p className="text-lg font-semibold">{monitor.pyramid_id || "N/A"}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                            <div className="mt-1">
                                {(monitor.isAvailable === 1 || monitor.isAvailable === true) ? (
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                        Available
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                        With Customer
                                    </span>
                                )}
                            </div>
                        </div>

                        {monitor.company_name && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Current Company</p>
                                <p className="text-lg font-semibold">{monitor.company_name}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* History Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Activity History
                        </CardTitle>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Start Date: </Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 w-[140px] text-xs" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">End Date: </Label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 w-[140px] text-xs" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Log Type</Label>
                                <Select value={logType} onValueChange={setLogType}>
                                    <SelectTrigger className="h-8 w-[180px] text-xs">
                                        <SelectValue placeholder="Log Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Types</SelectItem>
                                        <SelectItem value="Delivery">Delivery</SelectItem>
                                        <SelectItem value="Return">Return</SelectItem>
                                        <SelectItem value="Replacement Delivery">Replacement Delivery</SelectItem>
                                        <SelectItem value="Replacement Return">Replacement Return</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="default" size="sm" onClick={applyFilters} className="h-8">Submit</Button>
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8">Reset</Button>
                            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloadingPDF || filteredHistory.length === 0} className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                {downloadingPDF ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                                PDF
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Reason / Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No history found for this item.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredHistory.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap font-medium">
                                            {log.data ? new Date(log.data).toLocaleString() : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {log.log}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {log.company_name || "-"}
                                        </TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            {log.user_name || "Unknown"}
                                        </TableCell>
                                        <TableCell>{log.reason}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
