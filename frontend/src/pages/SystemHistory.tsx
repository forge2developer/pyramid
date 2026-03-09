
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, History, Monitor, FileText, Loader2 } from "lucide-react";
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

interface SystemDetails {
    systemID: number;
    Name: string;
    Processor: string;
    configuration: string;
    pyramidsID: string;
    serviceID: string;
    inventoryID: string;
    isAvailable: number | boolean;
    generation: string;

    // Specs
    ramCount: string;
    ssdCount: string;
    nvmeCount: string;
    graphics: string;

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

export default function SystemHistory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [system, setSystem] = useState<SystemDetails | null>(null);
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
            const response = await api.get(`/inventory/history/system/${id}`);
            if (response.data.success) {
                setSystem(response.data.data.system);
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
        if (!system) return;
        try {
            setDownloadingPDF(true);
            const response = await api.post(
                `/inventory/history/system/${id}/pdf`,
                {
                    startDate: startDate || null,
                    endDate: endDate || null,
                    logType: logType !== "All" ? logType : null,
                    details: {
                        brand: system.Name,
                        processor: system.Processor,
                        pyramidID: system.pyramidsID,
                        serviceTag: system.serviceID,
                    },
                },
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `System_History_${new Date().toISOString().split("T")[0]}.pdf`);
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

    if (!system) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h1 className="text-2xl font-bold text-red-500">System Not Found</h1>
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
                <h1 className="text-2xl font-bold tracking-tight">System Details & History</h1>
            </div>

            {/* System Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        System Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* <div>
                            <p className="text-sm font-medium text-muted-foreground">System ID</p>
                            <p className="text-lg font-semibold">{system.systemID}</p>
                        </div> */}
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Brand</p>
                            <p className="text-lg font-semibold">{system.Name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Processor</p>
                            <p className="text-lg font-semibold">{system.Processor}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Generation</p>
                            <p className="text-lg font-semibold">{system.generation || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Service Tag</p>
                            <p className="text-lg font-semibold">{system.serviceID || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pyramid ID</p>
                            <p className="text-lg font-semibold">{system.pyramidsID || "N/A"}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Specs</p>
                            <div className="space-y-1 mt-1">
                                <p className="text-sm"><span className="font-semibold">RAM:</span> {system.ramCount}</p>
                                <p className="text-sm"><span className="font-semibold">Graphics:</span> {system.graphics || "None"}</p>
                                {(system.ssdCount || system.nvmeCount) && (
                                    <p className="text-sm text-muted-foreground">
                                        Storage: {[system.ssdCount, system.nvmeCount].filter(Boolean).join(" + ")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                            <div className="mt-1">
                                {(system.isAvailable === 1 || system.isAvailable === true) ? (
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

                        {system.company_name && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Current Company</p>
                                <p className="text-lg font-semibold">{system.company_name}</p>
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
                                <TableHead className="border border-slate-200">S.No</TableHead>
                                <TableHead className="border border-slate-200">Date</TableHead>
                                <TableHead className="border border-slate-200">Event</TableHead>
                                <TableHead className="border border-slate-200">Company</TableHead>
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
                                        <TableCell className="border border-slate-200">{log.company_name || "-"}</TableCell>
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
