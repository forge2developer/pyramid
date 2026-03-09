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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, FileText, Check, ChevronsUpDown, Pencil, X, Loader2, Plus } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ChallanFile {
    challanNumber?: number;
    filename: string;
    size: number;
    createdAt: string;
    path: string;
    type: string;
    company: string;
    rawCompanyPart: string;
    date: string;
    // Edit fields
    companyId?: number;
    productsData?: Record<string, any[]>;
    challanRemarks?: string;
    customCompanyName?: string;
    customAddress?: string;
    challanDate?: string;
}

interface Company {
    id: number;
    company_name: string;
}

const ADD_PRODUCT_TYPES = [
    { value: "laptop", label: "Laptop", suffix: "Laptops" },
    { value: "system", label: "Desktop", suffix: "Systems" },
    { value: "monitor", label: "Monitor", suffix: "Monitor" },
    { value: "ram", label: "RAM", suffix: "Ram" },
    { value: "ssd", label: "SSD", suffix: "SSD" },
    { value: "hdd", label: "HDD", suffix: "HDD" },
    { value: "nvme", label: "NVMe", suffix: "NVMe" },
    { value: "workstation", label: "Workstation", suffix: "Workstation" },
    { value: "mobile_workstation", label: "Mobile Workstation", suffix: "MobileWorkstation" },
    { value: "graphicscard", label: "Graphics Card", suffix: "GraphicsCard" },
    { value: "m_2", label: "M.2", suffix: "M_2" },
];

const getProductLabel = (item: any, type: string) => {
    const pId = item.phyramidID || item.pyramidsID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || '-';
    switch (type) {
        case 'laptop': return `${item.brand} ${item.model} (${pId})`;
        case 'system': return `${item.Name} (${pId})`;
        case 'monitor': return `${item.name} - ${item.size} (${pId})`;
        case 'ram': return `${item.brand} ${item.size} (${pId})`;
        case 'ssd': case 'hdd': case 'nvme': return `${item.brand} ${item.size || item.ssdSize || item.Size} (${pId})`;
        case 'm_2': return `${item.brand} ${item.size} ${item.type} (${pId})`;
        case 'workstation': return `${item.Name || item.processor || item.Processor} (${pId})`;
        case 'mobile_workstation': return `${item.brand} ${item.model} (${pId})`;
        case 'graphicscard': return `${item.brand} ${item.model} (${pId})`;
        default: return item.name || item.brand || 'Item';
    }
};

export default function ChallanHistory() {
    const [challans, setChallans] = useState<ChallanFile[]>([]);
    const [filteredChallans, setFilteredChallans] = useState<ChallanFile[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [companyFilter, setCompanyFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [challanNumberFilter, setChallanNumberFilter] = useState("");
    const [openCompany, setOpenCompany] = useState(false);

    // Companies for Filter
    const [companies, setCompanies] = useState<Company[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Edit Challan State
    const [editChallanOpen, setEditChallanOpen] = useState(false);
    const [editingChallan, setEditingChallan] = useState<ChallanFile | null>(null);
    const [editProducts, setEditProducts] = useState<Record<string, any[]>>({});
    const [editRemarks, setEditRemarks] = useState("");
    const [editType, setEditType] = useState("");
    const [editCompanyId, setEditCompanyId] = useState<number>(0);
    const [editCompanyName, setEditCompanyName] = useState("");
    const [editAddress, setEditAddress] = useState("");
    const [editDate, setEditDate] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Add Product State
    const [addProductType, setAddProductType] = useState("");
    const [availableProducts, setAvailableProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [addProductOpen, setAddProductOpen] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const { data } = await api.get("/inventory/companies");
            setCompanies(data.data || []);
        } catch (error) {
            console.error("Failed to fetch companies", error);
        }
    }

    const handleSearch = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/pdf/challans", {
                params: {
                    company: companyFilter,
                    date: dateFilter,
                    type: typeFilter !== "all" ? typeFilter : undefined,
                    challanNumber: challanNumberFilter || undefined
                }
            });

            console.log("DB API Data:", data);
            setChallans(data);
            setFilteredChallans(data);
            setHasSearched(true);

        } catch (error) {
            console.error("Failed to fetch challans", error);
            toast.error("Failed to load challan history");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const response = await api.get(`/pdf/challans/${filename}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Failed to download file");
        }
    };

    const handleEditChallan = (challan: ChallanFile) => {
        setEditingChallan(challan);
        setEditProducts(challan.productsData || {});
        setEditRemarks(challan.challanRemarks || "");
        setEditType(challan.type);
        setEditCompanyId(challan.companyId || 0);
        setEditCompanyName(challan.customCompanyName || challan.company || "");
        setEditAddress(challan.customAddress || "");
        setEditDate(challan.challanDate || challan.date || "");
        setEditChallanOpen(true);
    };

    const handleSaveChallanEdit = async () => {
        if (!editingChallan) return;

        setIsSaving(true);
        try {
            const response = await api.put(`/pdf/challans/${editingChallan.challanNumber}`, {
                company_id: editCompanyId,
                challan_type: editType,
                products: editProducts,
                challan_remarks: editRemarks,
                custom_company_name: editCompanyName,
                custom_address: editAddress,
                challan_date: editDate
            }, {
                responseType: 'blob'
            });

            // Download the regenerated PDF
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `challan_${editingChallan.challanNumber}_updated.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Challan updated and PDF regenerated!");
            handleSearch(); // Refresh the list
            setEditChallanOpen(false);
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Failed to update challan");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveProductFromEdit = (type: string, index: number) => {
        setEditProducts(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const fetchAvailableForType = async (type: string) => {
        const typeConfig = ADD_PRODUCT_TYPES.find(t => t.value === type);
        if (!typeConfig) return;

        setLoadingProducts(true);
        try {
            const endpoint = `/inventory/getall${typeConfig.suffix}`;
            const response = await api.post(endpoint, {
                isAvailable: 1,
                page: 1,
                limit: 1000
            });

            if (response.data.success) {
                let items: any[] = [];
                const responseData = response.data.data;

                if (Array.isArray(responseData)) {
                    items = responseData;
                } else if (responseData && typeof responseData === 'object') {
                    const normalizedType = type.toLowerCase().replace(/_/g, '');
                    for (const [k, v] of Object.entries(responseData)) {
                        if (Array.isArray(v) && k.toLowerCase().replace(/_/g, '').includes(normalizedType)) {
                            items = v as any[];
                            break;
                        }
                        if (Array.isArray(v) && k.toLowerCase().includes('desktop') && type === 'system') {
                            items = v as any[];
                            break;
                        }
                    }
                    if (items.length === 0 && Array.isArray((responseData as any).data)) items = (responseData as any).data;
                }

                // Filter unassigned items
                const available = items.filter(item => {
                    const companyId = item.company_id || item.companyID || item.CompanyID;
                    return !companyId || companyId === 0 || companyId === "0";
                });

                // Remove items already in editProducts
                const existingIds = (editProducts[type] || []).map((p: any) => String(p.id || p.ID || p.ssdID || p.systemID || p.WorkstationID || p.GraphicsCardID || p.monitorID || p.ramID || p.hddID));
                const filtered = available.filter(item => {
                    const itemId = String(item.id || item.ID || item.ssdID || item.systemID || item.WorkstationID || item.GraphicsCardID || item.monitorID || item.ramID || item.hddID);
                    return !existingIds.includes(itemId);
                });

                setAvailableProducts(filtered);
            }
        } catch (error) {
            console.error(`Failed to fetch ${type}`, error);
            toast.error(`Failed to load ${type} products`);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleAddProductToEdit = (product: any) => {
        if (!addProductType) return;
        setEditProducts(prev => ({
            ...prev,
            [addProductType]: [...(prev[addProductType] || []), product]
        }));
        // Remove from available list
        setAvailableProducts(prev => prev.filter(p => p !== product));
        setAddProductOpen(false);
    };

    if (loading) {
        return <FullScreenLoader text="Loading challan history..." />;
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Challan History</h1>
                    <p className="text-muted-foreground">
                        Select a company to view their challan history.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                        <div className="flex-1">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Type (All)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="DELIVERY">Delivery</SelectItem>
                                    <SelectItem value="RETURN">Return</SelectItem>
                                    <SelectItem value="REPLACE_DELIVERY">Replace Delivery</SelectItem>
                                    <SelectItem value="REPLACE_RETURN">Replace Return</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Input
                                type="number"
                                placeholder="Challan Number..."
                                value={challanNumberFilter}
                                onChange={(e) => setChallanNumberFilter(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <Popover open={openCompany} onOpenChange={setOpenCompany}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCompany}
                                        className="w-full justify-between"
                                    >
                                        {companyFilter
                                            ? companies.find((company) => company.company_name === companyFilter)?.company_name
                                            : "Select Company..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search company..." />
                                        <CommandList>
                                            <CommandEmpty>No company found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => {
                                                        setCompanyFilter("")
                                                        setOpenCompany(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            companyFilter === "" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    All Companies
                                                </CommandItem>
                                                {companies.map((company) => (
                                                    <CommandItem
                                                        key={company.id}
                                                        value={company.company_name}
                                                        onSelect={() => {
                                                            setCompanyFilter(company.company_name)
                                                            setOpenCompany(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                companyFilter === company.company_name ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {company.company_name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex-1">
                            <Input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Submit
                        </Button>
                        <Button variant="ghost" onClick={() => {
                            setCompanyFilter("");
                            setDateFilter("");
                            setTypeFilter("all");
                            setChallanNumberFilter("");
                            setFilteredChallans([]);
                            setHasSearched(false);
                        }}>
                            Clear
                        </Button>
                    </div>

                    {hasSearched && (
                        <div className="rounded-md border mt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>S.No</TableHead>
                                        <TableHead>Challan No.</TableHead>
                                        <TableHead>Filename</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredChallans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <p className="font-medium">No company-matched results found.</p>
                                                    {challans.length > 0 && (
                                                        <p className="text-sm text-muted-foreground">
                                                            (Hidden: {challans.length} files that don't match "{companyFilter || dateFilter || 'filters'}". Older files without company names are treated as "N/A")
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredChallans.map((file, index) => (
                                            <TableRow key={file.filename}>
                                                <TableCell className="font-medium">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {file.challanNumber || 'N/A'}
                                                </TableCell>
                                                <TableCell className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    {file.filename}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${file.type.toLowerCase().includes('return')
                                                        ? 'bg-orange-100 text-orange-800'
                                                        : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {file.type.replace('_', ' ')}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{file.company}</TableCell>
                                                <TableCell>
                                                    {file.date || new Date(file.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {file.productsData && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => handleEditChallan(file)}
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDownload(file.filename)}
                                                        >
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Challan Dialog */}
            <Dialog open={editChallanOpen} onOpenChange={setEditChallanOpen}>
                <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-primary text-xl font-bold">
                            Edit Challan #{editingChallan?.challanNumber}
                        </DialogTitle>
                        <DialogDescription className="text-purple-600">
                            Modify challan details and regenerate PDF.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Company */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editCompanyName" className="text-right text-gray-500">
                                Company
                            </Label>
                            <Input
                                id="editCompanyName"
                                value={editCompanyName}
                                onChange={(e) => setEditCompanyName(e.target.value)}
                                className="col-span-3 border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        {/* Address */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="editAddress" className="text-right text-gray-500 pt-2">
                                Delivery At
                            </Label>
                            <Textarea
                                id="editAddress"
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                className="col-span-3 min-h-[80px] border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        {/* Date */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editDate" className="text-right text-gray-500">
                                Date
                            </Label>
                            <Input
                                id="editDate"
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="col-span-3 border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        {/* Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-gray-500">
                                Type
                            </Label>
                            <div className="col-span-3">
                                <Select value={editType} onValueChange={setEditType}>
                                    <SelectTrigger className="border-purple-300">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DELIVERY">Delivery</SelectItem>
                                        <SelectItem value="RETURN">Return</SelectItem>
                                        <SelectItem value="REPLACE_DELIVERY">Replace Delivery</SelectItem>
                                        <SelectItem value="REPLACE_RETURN">Replace Return</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="editRemarks" className="text-right text-gray-500 pt-2">
                                Remarks
                            </Label>
                            <Textarea
                                id="editRemarks"
                                value={editRemarks}
                                onChange={(e) => setEditRemarks(e.target.value)}
                                className="col-span-3 min-h-[80px] border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Optional remarks..."
                            />
                        </div>
                    </div>

                    {/* Products List */}
                    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm max-h-[300px] overflow-y-auto">
                        <h4 className="font-bold text-sm text-primary mb-2">Challan Items:</h4>
                        <div className="space-y-2">
                            {Object.keys(editProducts).length === 0 || Object.values(editProducts).every(arr => arr.length === 0) ? (
                                <div className="text-center py-4 text-sm text-muted-foreground border-dashed border-2 rounded-md">
                                    No products in this challan
                                </div>
                            ) : (
                                Object.entries(editProducts).map(([type, items]) =>
                                    items.length > 0 && items.map((item: any, idx: number) => (
                                        <div key={`${type}-${idx}`} className="flex items-center justify-between text-sm p-2 bg-muted/20 hover:bg-muted/40 rounded-md transition-colors border">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-primary capitalize flex items-center gap-2">
                                                    {type.replace('_', ' ')}
                                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-normal">
                                                        ID: {item.id || item.ID || item.ssdID || item.systemID || item.monitorID || item.ramID || item.hddID || idx + 1}
                                                    </span>
                                                </span>
                                                <span className="text-xs text-muted-foreground mt-0.5">
                                                    {getProductLabel(item, type)}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleRemoveProductFromEdit(type, idx)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>

                    {/* Add Product Section */}
                    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
                        <h4 className="font-bold text-sm text-primary mb-3">Add Product:</h4>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground mb-1 block">Product Type</Label>
                                <Select
                                    value={addProductType}
                                    onValueChange={(val) => {
                                        setAddProductType(val);
                                        setAvailableProducts([]);
                                        fetchAvailableForType(val);
                                    }}
                                >
                                    <SelectTrigger className="border-purple-300">
                                        <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ADD_PRODUCT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-[2]">
                                <Label className="text-xs text-muted-foreground mb-1 block">Select Product</Label>
                                <Popover open={addProductOpen} onOpenChange={setAddProductOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between font-normal border-purple-300"
                                            disabled={!addProductType || loadingProducts}
                                        >
                                            {loadingProducts ? "Loading..." : "Select product..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search product..." />
                                            <CommandList>
                                                <CommandEmpty>No products available.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-auto">
                                                    {availableProducts.map((product, idx) => (
                                                        <CommandItem
                                                            key={idx}
                                                            value={getProductLabel(product, addProductType)}
                                                            onSelect={() => handleAddProductToEdit(product)}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4 text-green-600" />
                                                            {getProductLabel(product, addProductType)}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditChallanOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveChallanEdit}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Regenerating PDF...
                                </>
                            ) : (
                                "Save & Regenerate PDF"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
