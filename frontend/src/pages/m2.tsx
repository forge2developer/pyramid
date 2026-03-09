import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import api from "@/lib/axios"
import { Label } from "@/components/ui/label"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { ActionTooltip } from "@/components/common/action-tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Check, ChevronsUpDown, Pencil, XCircle } from "lucide-react"
import { getAuthCookie } from "@/lib/auth"
import { ScrapDialog } from "@/components/common/scrap-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface M2Item {
    id: number
    brand: string
    size: string
    type: string
    form_factor: string
    service_id: string
    phyramidID: string
    inventoryID: string
    date_of_purchase: string
    isAvailable?: string | boolean | number
}

interface PaginationInfo {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
}

const ITEMS_PER_PAGE = 20

const M2Inventory = () => {
    const navigate = useNavigate()

    const [brandOpen, setBrandOpen] = useState(false)
    const [sizeOpen, setSizeOpen] = useState(false)
    const [typeOpen, setTypeOpen] = useState(false)
    const [serviceIdOpen, setServiceIdOpen] = useState(false)
    const [pyramidIdOpen, setPyramidIdOpen] = useState(false)
    const [inventoryIDOpen, setInventoryIDOpen] = useState(false)
    const [form_factorOpen, setForm_factorOpen] = useState(false)

    const [formData, setFormData] = useState({
        brand: "",
        size: "",
        type: "",
        service_id: "",
        phyramidID: "",
        inventoryID: "",
        form_factor: "",
        isAvailable: false,
    })

    const [m2Items, setM2Items] = useState<M2Item[]>([])
    const [m2Filters, setM2Filters] = useState<M2Item[]>([])
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: ITEMS_PER_PAGE,
    })
    const [loading, setLoading] = useState(true)

    const [error, setError] = useState<string | null>(null)

    const [editingM2, setEditingM2] = useState<any | null>(null)
    const [scrapItem, setScrapItem] = useState<any | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const fetchM2 = async (_page: number = 1, searchData = formData) => {
        try {
            setLoading(true)
            setError(null)
            const { data } = await api.post(`/inventory/getAllM_2?page=${_page}&limit=${ITEMS_PER_PAGE}`, searchData)
            setM2Items(data.data.m_2)
            setM2Filters(data.data.data)
            setPagination(data.data.pagination)
            console.log(data);

        } catch (err) {
            setError("Failed to fetch inventory data")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchM2()
    }, [])

    const handlePageChange = (_page: number) => {
        fetchM2(_page)
    }

    const handleEditClick = (item: any) => {
        setEditingM2(item)
    }

    const handleSaveEdit = async () => {
        if (!editingM2) return

        try {
            setIsSaving(true)
            const { data } = await api.post("/inventory/updateM_2", editingM2)
            if (data.success) {
                toast.success("M.2 updated successfully")
                setEditingM2(null)
                fetchM2()
            } else {
                toast.error("Failed to update M.2")
            }
        } catch (err: any) {
            console.error("Failed to update M.2:", err)
            toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || "Error updating M.2")
        } finally {
            setIsSaving(false)
        }
    }

    const handleScrapClick = (item: any) => {
        setScrapItem(item)
    }

    const handleConfirmScrap = async (reason: string) => {
        if (!scrapItem) return
        const user = getAuthCookie()
        // @ts-ignore
        const userId = user?.id || null

        try {
            const payload = {
                producedID: scrapItem.id,
                produced: 'm_2',
                log: reason,
                CompanyID: scrapItem.company_id || null,
                inventoryID: null,
                // @ts-ignore
                userID: userId
            }
            // @ts-ignore
            if (scrapItem.inventoryID) payload.inventoryID = scrapItem.inventoryID;

            const { data } = await api.post('/Companies/AddScrap', payload)
            if (data.success) {
                toast.success("Item scrapped successfully")
                fetchM2()
            } else {
                throw new Error(data.message || "Failed to scrap item")
            }
        } catch (err: any) {
            console.error("Scrap failed", err)
            toast.error(err.response?.data?.message || err.message || "Failed to scrap item")
            throw err
        }
    }

    if (loading) {
        return <FullScreenLoader text="Loading inventory..." />
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        fetchM2(1, formData)
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Get unique values for filters
    const uniqueBrands = [...new Set(m2Filters?.map((item: any) => item.brand).filter(Boolean))]
    const uniqueSizes = [...new Set(m2Filters?.map((item: any) => item.size).filter(Boolean))]
    const uniqueTypes = [...new Set(m2Filters?.map((item: any) => item.type).filter(Boolean))]
    const uniqueServiceIds = [...new Set(m2Filters?.map((item: any) => item.service_id).filter(Boolean))]
    const uniquePyramidIds = [...new Set(m2Filters?.map((item: any) => item.phyramidID).filter(Boolean))]
    const uniqueInventoryIDs = [...new Set(m2Filters?.map((item: any) => item.inventoryID).filter(Boolean))]
    const uniqueFormFactors = [...new Set(m2Filters?.map((item: any) => item.form_factor).filter(Boolean))]

    const handleReset = async () => {
        const emptyForm = {
            brand: "",
            size: "",
            type: "",
            service_id: "",
            phyramidID: "",
            inventoryID: "",
            form_factor: "",
            isAvailable: false,
        }
        setFormData(emptyForm);
        fetchM2(1, emptyForm);
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={brandOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {formData.brand || "Select brand..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search brand..." />
                                        <CommandList>
                                            <CommandEmpty>No brand found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="none"
                                                    onSelect={() => {
                                                        handleSelectChange("brand", "")
                                                        setBrandOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.brand === "" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    None
                                                </CommandItem>
                                                {uniqueBrands.map((brand: any) => (
                                                    <CommandItem
                                                        key={brand}
                                                        value={brand}
                                                        onSelect={() => {
                                                            handleSelectChange("brand", brand)
                                                            setBrandOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.brand === brand ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {brand}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="size">Size</Label>
                            <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={sizeOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {formData.size || "Select size..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search size..." />
                                        <CommandList>
                                            <CommandEmpty>No Size found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="none"
                                                    onSelect={() => {
                                                        handleSelectChange("size", "")
                                                        setSizeOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.size === "" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    None
                                                </CommandItem>
                                                {uniqueSizes.map((size: any) => (
                                                    <CommandItem
                                                        key={size}
                                                        value={size}
                                                        onSelect={() => {
                                                            handleSelectChange("size", size)
                                                            setSizeOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.size === size ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {size}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="form_factor">Form Factor</Label>
                            <Popover open={form_factorOpen} onOpenChange={setForm_factorOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={form_factorOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {formData.form_factor || "Select Form Factor..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search Form Factor..." />
                                        <CommandList>
                                            <CommandEmpty>No Form Factor found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="none"
                                                    onSelect={() => {
                                                        handleSelectChange("form_factor", "")
                                                        setForm_factorOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.form_factor === "" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    None
                                                </CommandItem>
                                                {uniqueFormFactors.map((id: any) => (
                                                    <CommandItem
                                                        key={id}
                                                        value={id}
                                                        onSelect={() => {
                                                            handleSelectChange("form_factor", id)
                                                            setForm_factorOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.form_factor === id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {id}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={typeOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {formData.type || "Select Type..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search Type..." />
                                        <CommandList>
                                            <CommandEmpty>No Type found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="none"
                                                    onSelect={() => {
                                                        handleSelectChange("type", "")
                                                        setTypeOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.type === "" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    None
                                                </CommandItem>
                                                {uniqueTypes.map((type: any) => (
                                                    <CommandItem
                                                        key={type}
                                                        value={type}
                                                        onSelect={() => {
                                                            handleSelectChange("type", type)
                                                            setTypeOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.type === type ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {type}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="service_id">Service Tag</Label>
                            <Popover open={serviceIdOpen} onOpenChange={setServiceIdOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={serviceIdOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {formData.service_id || "Select Service Tag..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search Service Tag..." />
                                        <CommandList>
                                            <CommandEmpty>No Service Tag found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="none"
                                                    onSelect={() => {
                                                        handleSelectChange("service_id", "")
                                                        setServiceIdOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.service_id === "" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    None
                                                </CommandItem>
                                                {uniqueServiceIds.map((service_id: any) => (
                                                    <CommandItem
                                                        key={service_id}
                                                        value={service_id}
                                                        onSelect={() => {
                                                            handleSelectChange("service_id", service_id)
                                                            setServiceIdOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.service_id === service_id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {service_id}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phyramidID">Pyramid ID</Label>
                            <Popover open={pyramidIdOpen} onOpenChange={setPyramidIdOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={pyramidIdOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {formData.phyramidID || "Select Pyramid ID..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search Pyramid ID..." />
                                        <CommandList>
                                            <CommandEmpty>No Pyramid ID found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="none"
                                                    onSelect={() => {
                                                        handleSelectChange("phyramidID", "")
                                                        setPyramidIdOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.phyramidID === "" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    None
                                                </CommandItem>
                                                {uniquePyramidIds.map((phyramidID: any) => (
                                                    <CommandItem
                                                        key={phyramidID}
                                                        value={phyramidID}
                                                        onSelect={() => {
                                                            handleSelectChange("phyramidID", phyramidID)
                                                            setPyramidIdOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.phyramidID === phyramidID ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {phyramidID}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inventoryID">Inventory ID</Label>
                            <Popover open={inventoryIDOpen} onOpenChange={setInventoryIDOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={inventoryIDOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {formData.inventoryID || "Select Inventory ID..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search Inventory ID..." />
                                        <CommandList>
                                            <CommandEmpty>No Inventory ID found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="none"
                                                    onSelect={() => {
                                                        handleSelectChange("inventoryID", "")
                                                        setInventoryIDOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.inventoryID === "" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    None
                                                </CommandItem>
                                                {uniqueInventoryIDs.map((id: any) => (
                                                    <CommandItem
                                                        key={id}
                                                        value={id}
                                                        onSelect={() => {
                                                            handleSelectChange("inventoryID", id)
                                                            setInventoryIDOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.inventoryID === id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {id}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                    </div>
                    {/* Availability Switch */}
                    <div className="space-y-4 mt-4">
                        <Label htmlFor="isAvailable">Availability</Label>
                        <div className="flex items-center space-x-2 h-10">
                            <Switch
                                id="isAvailable"
                                checked={Boolean(formData.isAvailable)}
                                onCheckedChange={(checked) => {
                                    setFormData(prev => ({ ...prev, isAvailable: checked }));
                                    const newItem = { ...formData, isAvailable: checked };
                                    api.post("/inventory/getAllM_2", newItem).then(({ data }) => {
                                        setM2Items(data.data.m_2);
                                        setM2Filters(data.data.data);
                                        setPagination(data.data.pagination);
                                    }).catch(err => console.error(err));
                                }}
                            />
                            <Label htmlFor="isAvailable" className="font-normal cursor-pointer text-muted-foreground">
                                {formData.isAvailable ? "Show Available Only" : "Show All"}
                            </Label>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
                        <Button type="submit" className="w-full sm:w-auto">Submit</Button>
                        <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                            Reset
                        </Button>
                    </div>
                </form>
            </div>
            <div className="rounded-xl border bg-card shadow-sm">
                {error ? (
                    <div className="p-8 text-center text-destructive">{error}</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table className="min-w-[800px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>S.No</TableHead>
                                        <TableHead>Pyramid ID</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Form Factor</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Service Tag</TableHead>
                                        <TableHead>Inventory ID</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {m2Items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                                No M.2 found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        m2Items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{(pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                                                <TableCell>{item.phyramidID}</TableCell>
                                                <TableCell
                                                    className="cursor-pointer hover:underline text-blue-600"
                                                    onClick={() => navigate(`/Inventory/m2/${item.id}`)}
                                                >
                                                    {item.brand}
                                                    <div className={cn(
                                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2",
                                                        item.isAvailable === "1" || item.isAvailable === "true" || item.isAvailable === "yes" || item.isAvailable === true || item.isAvailable === 1
                                                            ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                                                            : "bg-red-100 text-red-800 hover:bg-red-100/80"
                                                    )}>
                                                        {item.isAvailable === "1" || item.isAvailable === "true" || item.isAvailable === "yes" || item.isAvailable === true || item.isAvailable === 1 ? "Available" : "Moving"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.size}</TableCell>
                                                <TableCell>{item.form_factor}</TableCell>
                                                <TableCell>{item.type}</TableCell>
                                                <TableCell>{item.service_id}</TableCell>
                                                <TableCell>{item.inventoryID}</TableCell>
                                                <TableCell>
                                                    <ActionTooltip label="Edit">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                                                            <Pencil className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    </ActionTooltip>
                                                    <ActionTooltip label="Scrap">
                                                        <Button variant="ghost" size="icon" onClick={() => handleScrapClick(item)}>
                                                            <XCircle className="h-4 w-4 text-orange-600" />
                                                        </Button>
                                                    </ActionTooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {pagination.totalPages > 0 && (
                                <div className="p-4 border-t">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        if (pagination.currentPage > 1) handlePageChange(pagination.currentPage - 1)
                                                    }}
                                                    className={pagination.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationLink
                                                        href="#"
                                                        isActive={pagination.currentPage === page}
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            handlePageChange(page)
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        if (pagination.currentPage < pagination.totalPages) handlePageChange(pagination.currentPage + 1)
                                                    }}
                                                    className={pagination.currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <Dialog open={!!editingM2} onOpenChange={(open) => !open && setEditingM2(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit M.2</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {editingM2 && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-brand">Brand</Label>
                                        <Input
                                            id="edit-brand"
                                            value={editingM2.brand || ""}
                                            onChange={(e) => setEditingM2({ ...editingM2, brand: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-size">Size</Label>
                                        <Input
                                            id="edit-size"
                                            value={editingM2.size || ""}
                                            onChange={(e) => setEditingM2({ ...editingM2, size: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-type">Type</Label>
                                        <Input
                                            id="edit-type"
                                            value={editingM2.type || ""}
                                            onChange={(e) => setEditingM2({ ...editingM2, type: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-form-factor">Form Factor</Label>
                                        <Input
                                            id="edit-form-factor"
                                            value={editingM2.form_factor || ""}
                                            onChange={(e) => setEditingM2({ ...editingM2, form_factor: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-service-id">Service Tag</Label>
                                        <Input
                                            id="edit-service-id"
                                            value={editingM2.service_id || ""}
                                            onChange={(e) => setEditingM2({ ...editingM2, service_id: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-pyramid-id">Pyramid ID</Label>
                                        <Input
                                            id="edit-pyramid-id"
                                            value={editingM2.phyramidID || ""}
                                            onChange={(e) => setEditingM2({ ...editingM2, phyramidID: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-inventory-id">Inventory ID</Label>
                                        <Input
                                            id="edit-inventory-id"
                                            value={editingM2.inventoryID || ""}
                                            onChange={(e) => setEditingM2({ ...editingM2, inventoryID: e.target.value })}
                                        />
                                    </div>
                                    {/* <div className="space-y-2">
                                        <Label htmlFor="edit-isAvailable">Availability</Label>
                                        <div className="flex items-center space-x-2 h-10">
                                            <Switch
                                                id="edit-isAvailable"
                                                checked={Boolean(editingM2.isAvailable)}
                                                onCheckedChange={(checked) => setEditingM2({ ...editingM2, isAvailable: checked })}
                                            />
                                            <Label htmlFor="edit-isAvailable">
                                                {editingM2.isAvailable ? "Available" : "Not Available"}
                                            </Label>
                                        </div>
                                    </div> */}
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingM2(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ScrapDialog
                isOpen={!!scrapItem}
                onClose={() => setScrapItem(null)}
                onConfirm={handleConfirmScrap}
                itemName={scrapItem ? `M.2 ${scrapItem.brand} ${scrapItem.size}` : ""}
            />
        </div>
    )
}

export default M2Inventory
