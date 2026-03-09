
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, History, User, Cpu, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface GraphicsCardDetails {
    ID: number;
    brand: string;
    model: string;
    size: string;
    generation: string;
    serviceNumber: string;
    serviceTag: string;
    isAvailable: number | boolean;
    warrantyEndDate: string;
    dateOfPurchase: string;


    // Assignment Info
    laptop_brand: string | null;
    laptop_model: string | null;
    system_name: string | null;
    workstation_processor: string | null;
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

export default function GraphicsCardHistory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [card, setCard] = useState<GraphicsCardDetails | null>(null);
    const [history, setHistory] = useState<ActivityLog[]>([]);
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [logType, setLogType] = useState("All");

    useEffect(() => {
        fetchHistory();
    }, [id]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/inventory/history/graphicsCard/${id}`);
            if (response.data.success) {
                setCard(response.data.data.card);
                setHistory(response.data.data.history);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    const getAssignmentInfo = (item: GraphicsCardDetails) => {
        if (item.laptop_brand) return `Laptop: ${item.laptop_brand} ${item.laptop_model || ''}`;
        if (item.system_name) return `System: ${item.system_name}`;
        if (item.workstation_processor) return `Workstation: ${item.workstation_processor}`;
        return "Unassigned";
    };

    // Client-side filtering
    const filteredHistory = useMemo(() => {
        return history.filter((log) => {
            if (logType !== "All" && log.log !== logType) return false;
            if (startDate && log.data) {
                const logDate = new Date(log.data);
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (logDate < start) return false;
            }
            if (endDate && log.data) {
                const logDate = new Date(log.data);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (logDate > end) return false;
            }
            return true;
        });
    }, [history, startDate, endDate, logType]);

    const handleDownloadPDF = async () => {
        if (!card) return;
        try {
            setDownloadingPDF(true);
            const response = await api.post(
                `/inventory/history/graphicsCard/${id}/pdf`,
                {
                    startDate: startDate || null,
                    endDate: endDate || null,
                    logType: logType !== "All" ? logType : null,
                    cardDetails: {
                        brand: card.brand,
                        model: card.model,
                        size: card.size,
                        generation: card.generation,
                        serviceNumber: card.serviceNumber,
                        serviceTag: card.serviceTag,
                    },
                },
                { responseType: "blob" }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `GraphicsCard_History_${card.brand}_${card.model}_${new Date().toISOString().split("T")[0]}.pdf`);
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

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setLogType("All");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!card) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h1 className="text-2xl font-bold text-red-500">Graphics Card Not Found</h1>
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
                <h1 className="text-2xl font-bold tracking-tight">Graphics Card History</h1>
            </div>

            {/* Component Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        Component Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Brand / Model</p>
                            <p className="text-lg font-semibold">{card.brand} - {card.model}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Size / Generation</p>
                            <p className="text-lg font-semibold">{card.size} - {card.generation}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Service Number</p>
                            <p className="text-lg font-semibold">{card.serviceNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Service Tag</p>
                            <p className="text-lg font-semibold">{card.serviceTag || "N/A"}</p>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <p className="text-sm font-medium text-muted-foreground">Current Assignment</p>
                            <div className="mt-1 flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold text-primary">{getAssignmentInfo(card)}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                            <div className="mt-1">
                                {(card.isAvailable === 1 || card.isAvailable === true) ? (
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                        Available / In Stock
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                        In Use
                                    </span>
                                )}
                            </div>
                        </div>
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
                                <Label className="text-xs">Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-8 w-[140px] text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-8 w-[140px] text-xs"
                                />
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
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8">
                                Reset
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPDF}
                                disabled={downloadingPDF || filteredHistory.length === 0}
                                className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                {downloadingPDF ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <FileText className="h-4 w-4 mr-1" />
                                )}
                                PDF
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="border border-slate-200">S.No</TableHead>
                                <TableHead className="border border-slate-200">Date</TableHead>
                                <TableHead className="border border-slate-200">Event</TableHead>
                                <TableHead className="border border-slate-200">Company</TableHead>
                                <TableHead className="border border-slate-200">User</TableHead>
                                <TableHead className="border border-slate-200">Reason / Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="border border-slate-200 text-center py-8 text-muted-foreground">
                                        No history found for this item.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredHistory.map((log, index) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="border border-slate-200">{index + 1}</TableCell>
                                        <TableCell className="border border-slate-200 whitespace-nowrap font-medium">
                                            {log.data ? new Date(log.data).toLocaleDateString() : "N/A"}
                                        </TableCell>
                                        <TableCell className="border border-slate-200">
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {log.log}
                                            </span>
                                        </TableCell>
                                        <TableCell className="border border-slate-200">
                                            {log.company_name || "-"}
                                        </TableCell>
                                        <TableCell className="border border-slate-200 flex items-center gap-2">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            {log.user_name || "Unknown"}
                                        </TableCell>
                                        <TableCell className="border border-slate-200">{log.reason}</TableCell>
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
