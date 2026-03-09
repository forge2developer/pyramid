import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, ShoppingCart, FileText } from "lucide-react";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ScrapRecord {
    id: number;
    date: string;
    reason: string;
    producedID: number;
    produced?: string;
    company_name: string;
    user_name: string;
    product_type?: string;
    product_detail?: string;
    sales?: string;
}


export default function ScrapHistory() {
    const [scraps, setScraps] = useState<ScrapRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [productType, setProductType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [salesStatus, setSalesStatus] = useState("");

    // Modal state
    const [salesStatusModalOpen, setSalesStatusModalOpen] = useState(false);
    const [selectedScrap, setSelectedScrap] = useState<ScrapRecord | null>(null);
    const [updatingSales, setUpdatingSales] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [pdfConfirmModalOpen, setPdfConfirmModalOpen] = useState(false);

    useEffect(() => {
        fetchScrapHistory();
    }, []);


    const fetchScrapHistory = async () => {
        setLoading(true);
        try {
            const { data } = await api.post("/Companies/getScrapHistory", {
                productType,
                startDate,
                endDate,
                salesStatus
            });

            if (data.success) {
                setScraps(data.data.scraps || []);
            } else {
                toast.error("Failed to fetch scrap history");
            }
        } catch (error) {
            console.error("Failed to fetch scrap history", error);
            toast.error("Failed to load scrap history");
        } finally {
            setLoading(false);
        }
    };

    const handleSalesUpdate = async () => {
        if (!selectedScrap) return;

        setUpdatingSales(true);
        try {
            const { data } = await api.post("/Companies/update-scrap-sales-status", {
                scrapId: selectedScrap.id,
                salesStatus: "Sales Batch",
                userID: 1 // TODO: Get actual userID from auth
            });

            if (data.success) {
                toast.success("Product moved to Sales Batch");
                setSalesStatusModalOpen(false);
                fetchScrapHistory();
            } else {
                toast.error(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("An error occurred while updating status");
        } finally {
            setUpdatingSales(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloadingPDF(true);
        try {
            const response = await api.post("/Companies/generateScrapHistoryPDF", {
                productType,
                startDate,
                endDate,
                salesStatus
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Scrap_History_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("PDF downloaded successfully");
            setPdfConfirmModalOpen(false); // Close modal on success
        } catch (error) {
            console.error("Failed to download PDF", error);
            toast.error("Failed to generate PDF");
        } finally {
            setDownloadingPDF(false);
        }
    };

    if (loading && scraps.length === 0) {
        return <FullScreenLoader text="Loading scrap history..." />;
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Scrap History</h1>
                    <p className="text-muted-foreground">
                        View history of all scrapped inventory items.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex flex-col space-y-2 flex-1 max-w-md">
                            <Label>Product Type</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                    >
                                        {productType ? productType.charAt(0).toUpperCase() + productType.slice(1) : "All Product Types"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search product type..." />
                                        <CommandList>
                                            <CommandEmpty>No product type found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => setProductType("")}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", productType === "" ? "opacity-100" : "opacity-0")} />
                                                    All Product Types
                                                </CommandItem>
                                                {["laptop", "system", "ram", "workstation", "hdd", "ssd", "nvme", "graphicscard", "mobileworkstation", "m_2"].map((type) => (
                                                    <CommandItem
                                                        key={type}
                                                        value={type}
                                                        onSelect={() => setProductType(type)}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", productType === type ? "opacity-100" : "opacity-0")} />
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col space-y-2 flex-1">
                            <Label>Sales Status</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                    >
                                        {salesStatus ? salesStatus : "All Status"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandList>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => setSalesStatus("")}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", salesStatus === "" ? "opacity-100" : "opacity-0")} />
                                                    All Status
                                                </CommandItem>
                                                {["Pending", "Sales Batch"].map((status) => (
                                                    <CommandItem
                                                        key={status}
                                                        value={status}
                                                        onSelect={() => setSalesStatus(status)}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", salesStatus === status ? "opacity-100" : "opacity-0")} />
                                                        {status}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full md:w-[180px]"
                            />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full md:w-[180px]"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                            <Button onClick={fetchScrapHistory} className="flex-1 sm:flex-none">
                                Submit
                            </Button>
                            <Button variant="outline" onClick={() => {
                                setProductType("");
                                setStartDate("");
                                setEndDate("");
                                setSalesStatus("");
                                // Optionally fetch all after reset
                                setTimeout(() => fetchScrapHistory(), 0);
                            }} className="flex-1 sm:flex-none">
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <div className="flex justify-end pe-4 pb-0">
                    <Button
                        variant="outline"
                        onClick={() => setPdfConfirmModalOpen(true)}
                        disabled={downloadingPDF}
                        className="w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9 px-4"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        {downloadingPDF ? "Downloading..." : "PDF Report"}
                    </Button>
                </div>
                <CardContent className="p-0 sm:p-6">
                    <div className="rounded-md border overflow-x-auto">
                        <Table className="min-w-[700px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">S.No</TableHead>
                                    <TableHead className="min-w-[150px]">Product Type</TableHead>
                                    <TableHead className="min-w-[200px]">Reason</TableHead>
                                    <TableHead className="min-w-[120px]">User</TableHead>
                                    <TableHead className="text-right min-w-[120px]">Date</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scraps.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No scrap records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    scraps.map((scrap, index) => (
                                        <TableRow key={scrap.id}>
                                            <TableCell className="font-medium">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="capitalize flex items-center gap-2">
                                                {scrap.produced || "Unknown Type"}
                                                {scrap.sales === "Sales Batch" && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200">
                                                        {scrap.sales}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate">
                                                {scrap.reason}
                                            </TableCell>
                                            <TableCell>{scrap.user_name || "Unknown"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="text-xs sm:text-sm">
                                                    {new Date(scrap.date).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(scrap.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={scrap.sales === "Sales Batch"}
                                                    onClick={() => {
                                                        setSelectedScrap(scrap);
                                                        setSalesStatusModalOpen(true);
                                                    }}
                                                    className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <ShoppingCart className="h-4 w-4 mr-1" />
                                                    Sales
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={salesStatusModalOpen} onOpenChange={setSalesStatusModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Sales Batch</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to move this item to the Sales Batch? This will mark the scrapped product specifically for sales.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedScrap && (
                        <div className="py-2 text-sm">
                            <div className="grid grid-cols-3 gap-2 py-1">
                                <span className="font-semibold text-muted-foreground">Product:</span>
                                <span className="col-span-2 capitalize">{selectedScrap.produced}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 py-1">
                                <span className="font-semibold text-muted-foreground">ID:</span>
                                <span className="col-span-2">{selectedScrap.producedID}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSalesStatusModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSalesUpdate}
                            disabled={updatingSales}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {updatingSales ? "Updating..." : "Confirm Sales Batch"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={pdfConfirmModalOpen} onOpenChange={setPdfConfirmModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm PDF Download</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to download the Scrap History report as a PDF?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPdfConfirmModalOpen(false)}>No</Button>
                        <Button
                            onClick={handleDownloadPDF}
                            disabled={downloadingPDF}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {downloadingPDF ? "Downloading..." : "Yes, Download PDF"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
