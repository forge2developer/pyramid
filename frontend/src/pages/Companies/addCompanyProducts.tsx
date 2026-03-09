import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/axios"
import { MultiSelect, type Option } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PRODUCT_TYPES = [
    { value: "laptop", label: "Laptop" },
    { value: "system", label: "Desktop" },
    { value: "monitor", label: "Monitor" },
    { value: "ram", label: "RAM" },
    { value: "ssd", label: "SSD" },
    { value: "hdd", label: "HDD" },
    { value: "nvme", label: "NVMe" },
    { value: "workstation", label: "Workstation" },
    { value: "mobile_workstation", label: "Mobile Workstation" },
    { value: "graphicscard", label: "Graphics Card" },
    { value: "m_2", label: "M.2" },
]

export default function AddCompanyProducts() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)

    // Store available items options
    const [availableOptions, setAvailableOptions] = useState<Record<string, Option[]>>({})
    // Store full product objects for submission: Record<type, Record<id, object>>
    const [productMap, setProductMap] = useState<Record<string, Record<string, any>>>({})

    // Store selected Ids
    // Structure: { laptop: ["id1", "id2"], monitor: [], ... }
    const [selectedIds, setSelectedIds] = useState<Record<string, string[]>>({})

    // Delivery type: Delivery or Replacement
    const [storageType, setStorageType] = useState("Delivery")
    const [replacementReason, setReplacementReason] = useState("")
    const [companyProducts, setCompanyProducts] = useState<Record<string, any[]>>({})

    // Extra Accessories
    const [accessories, setAccessories] = useState<{ name: string; quantity: string }[]>([])

    const addAccessoryRow = () => {
        setAccessories(prev => [...prev, { name: "", quantity: "1" }])
    }

    const removeAccessoryRow = (index: number) => {
        setAccessories(prev => prev.filter((_, i) => i !== index))
    }

    const updateAccessory = (index: number, field: "name" | "quantity", value: string) => {
        setAccessories(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
    }

    // Check if company has any assigned products (for Replacement validation)
    useEffect(() => {
        const fetchCompanyProducts = async () => {
            if (!id) return
            try {
                const response = await api.post(`/Companies/getCompanyDetails`, {
                    companyID: id
                }, {
                    params: { page: 1, limit: 1000 }
                })
                if (response.data.success) {
                    setCompanyProducts(response.data.data.products || {})
                }
            } catch (error) {
                console.error("Failed to fetch company products", error)
            }
        }
        fetchCompanyProducts()
    }, [id])

    const hasAssignedProducts = () => {
        return Object.values(companyProducts).some(arr => arr.length > 0)
    }

    useEffect(() => {
        fetchAllProducts()
    }, [])

    const getSafeId = (item: any) => {
        return String(item.id || item.ID || item.ssdID || item.systemID || item.WorkstationID || item.GraphicsCardID || item.monitorID || item.ramID || item.hddID)
    }

    const getProductLabel = (item: any, type: string) => {
        const pId = item.phyramidID || item.pyramidsID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
        switch (type) {
            case 'laptop':
                return `${item.brand} ${item.model} (${pId})`;
            case 'system':
                return `${item.Name} (${pId})`;
            case 'monitor':
                return `${item.name} - ${item.size} (${pId})`;
            case 'ram':
                return `${item.brand} ${item.size} (${pId})`;
            case 'ssd':
            case 'hdd':
            case 'nvme':
                return `${item.brand} ${item.size || item.ssdSize} (${pId})`;
            case 'm_2':
                return `${item.brand} ${item.size} ${item.type} (${pId})`;
            case 'workstation':
                return `${item.processor || item.Processor} (${pId})`;
            case 'mobile_workstation':
                return `${item.brand} ${item.model} (${pId})`;
            case 'graphicscard':
                return `${item.brand} ${item.model} (${pId})`;
            default:
                return item.name || item.brand || 'Item';
        }
    }

    const fetchAllProducts = async () => {
        try {
            setInitialLoading(true)
            const promises = PRODUCT_TYPES.map(type => fetchAvailableProductsForType(type.value))
            await Promise.all(promises)
        } catch (error) {
            console.error("Failed to fetch initial products", error)
            toast.error("Failed to load some products")
        } finally {
            setInitialLoading(false)
        }
    }

    const fetchAvailableProductsForType = async (type: string) => {
        try {
            const suffix = type === 'laptop' ? 'Laptops' :
                type === 'system' ? 'Systems' :
                    type === 'ram' ? 'Ram' :
                        type === 'ssd' ? 'SSD' :
                            type === 'nvme' ? 'NVMe' :
                                type === 'hdd' ? 'HDD' :
                                    type === 'monitor' ? 'Monitor' :
                                        type === 'workstation' ? 'Workstation' :
                                            type === 'mobile_workstation' ? 'MobileWorkstation' :
                                                type === 'graphicscard' ? 'GraphicsCard' :
                                                    type === 'm_2' ? 'M_2' :
                                                        type.charAt(0).toUpperCase() + type.slice(1)

            const endpoint = `/inventory/getall${suffix}`

            const response = await api.post(endpoint, {
                isAvailable: 1 // Fetch unassigned items
            }, {
                params: {
                    page: 1,
                    limit: 1000 // Get many for selection
                }
            })

            if (response.data.success) {
                let items: any[] = []
                const responseData = response.data.data

                // Handle various response structures
                if (Array.isArray(responseData)) {
                    items = responseData
                } else if (responseData && typeof responseData === 'object') {
                    const entries = Object.entries(responseData)
                    const normalizedType = type.toLowerCase().replace(/_/g, '')
                    for (const [k, v] of entries) {
                        if (Array.isArray(v) && k.toLowerCase().replace(/_/g, '').includes(normalizedType)) {
                            items = v as any[]
                            break
                        }
                        // Special case for system -> desktop
                        if (Array.isArray(v) && k.toLowerCase().includes('desktop') && type.toLowerCase() === 'system') {
                            items = v as any[]
                            break
                        }
                    }
                    // Fallbacks
                    // @ts-ignore
                    if (items.length === 0 && Array.isArray(responseData.data)) items = responseData.data
                    // @ts-ignore
                    if (items.length === 0 && Array.isArray(responseData[type.toLowerCase() + 's'])) items = responseData[type.toLowerCase() + 's']
                }

                const options: Option[] = []
                const map: Record<string, any> = {}

                // Filter items where company_id is null/0/undefined
                const available = items.filter(item => {
                    const companyId = item.company_id || item.companyID || item.CompanyID;
                    return !companyId || companyId === 0 || companyId === "0";
                });

                available.forEach((item: any) => {
                    const id = getSafeId(item)
                    map[id] = item
                    options.push({
                        label: getProductLabel(item, type),
                        value: id
                    })
                })

                setAvailableOptions(prev => ({ ...prev, [type]: options }))
                setProductMap(prev => ({ ...prev, [type]: map }))
            }
        } catch (error) {
            console.error(`Failed to fetch ${type}`, error)
            // Don't toast here to avoid spamming 9 toasts on failure, handled in parent
        }
    }

    const handleSelectionChange = (type: string, newSelected: string[]) => {
        setSelectedIds(prev => ({
            ...prev,
            [type]: newSelected
        }))
    }

    const [isSubmitted, setIsSubmitted] = useState(false)

    // ... (existing code)

    const handleSubmit = async () => {
        const hasItems = Object.values(selectedIds).some(arr => arr.length > 0)
        if (!hasItems) {
            toast.error("Please add at least one item")
            return
        }

        try {
            setLoading(true)
            // Reconstruct the payload with full product objects
            const productsPayload: Record<string, any[]> = {}

            Object.entries(selectedIds).forEach(([type, ids]) => {
                if (ids.length > 0) {
                    productsPayload[type] = ids.map(id => productMap[type][id])
                }
            })

            const payload = {
                companyId: id,
                products: productsPayload,
                isAvailable: true,
                deliveryType: storageType,
                replacementReason: storageType === "Replacement" ? replacementReason : undefined
            }

            const response = await api.post('/inventory/addBulkProducts', payload)

            if (response.data.success) {
                navigate(-1);
                toast.success(storageType === "Replacement" ? "Replacement products delivered successfully" : "Products added successfully")
                setIsSubmitted(true)
                // Auto download DC
                await handleDownloadDC()
            } else {
                toast.error("Failed to add products")
            }

        } catch (error) {
            console.error("Failed to add products", error)
            toast.error("Failed to add products")
        } finally {
            setLoading(false)
        }
    }

    const handleViewDC = async () => {
        const hasItems = Object.values(selectedIds).some(arr => arr.length > 0)
        if (!hasItems) {
            toast.error("Please add at least one item")
            return
        }

        try {
            setLoading(true)
            const productsPayload: Record<string, any[]> = {}

            // Reconstruct full product objects
            Object.entries(selectedIds).forEach(([type, ids]) => {
                if (ids.length > 0) {
                    productsPayload[type] = ids.map(id => productMap[type][id])
                }
            })

            const validAccessories = accessories.filter(a => a.name.trim() !== "")

            const payload = {
                companyId: id,
                products: productsPayload,
                companyDetails: companyDetails,
                accessories: validAccessories,
                challanType: storageType === "Replacement" ? 'REPLACE_DELIVERY' : 'DELIVERY',
                challanRemark: storageType === "Replacement" ? `Replacement Delivery - ${replacementReason}` : undefined
            }

            const response = await api.post('/inventory/generate-challan', payload, {
                responseType: 'blob'
            })

            // Open in new tab
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');

        } catch (error) {
            console.error("Failed to view DC", error)
            toast.error("Failed to generate Delivery Challan")
        } finally {
            setLoading(false)
        }
    }

    const [companyDetails, setCompanyDetails] = useState<any>(null)

    useEffect(() => {
        const fetchCompanyDetails = async () => {
            if (!id) return
            try {
                const response = await api.post(`/Companies/getCompanyDetails`, {
                    companyID: id
                }, {
                    params: { page: 1, limit: 1 }
                })
                if (response.data.success) {
                    setCompanyDetails(response.data.data.company)
                }
            } catch (error) {
                console.error("Failed to fetch company details", error)
            }
        }
        fetchCompanyDetails()
    }, [id])

    const handleDownloadDC = async () => {
        const hasItems = Object.values(selectedIds).some(arr => arr.length > 0)
        if (!hasItems) {
            toast.error("Please add at least one item")
            return
        }

        try {
            setLoading(true)
            const productsPayload: Record<string, any[]> = {}

            // Reconstruct full product objects
            Object.entries(selectedIds).forEach(([type, ids]) => {
                if (ids.length > 0) {
                    productsPayload[type] = ids.map(id => productMap[type][id])
                }
            })

            const validAccessories = accessories.filter(a => a.name.trim() !== "")

            const payload = {
                companyId: id,
                products: productsPayload,
                companyDetails: companyDetails,
                accessories: validAccessories,
                challanType: storageType === "Replacement" ? 'REPLACE_DELIVERY' : 'DELIVERY',
                challanRemark: storageType === "Replacement" ? `Replacement Delivery - ${replacementReason}` : undefined
            }

            const response = await api.post('/inventory/generate-challan', payload, {
                responseType: 'blob' // Important for PDF download
            })

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `delivery_challan_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Failed to download DC", error)
            toast.error("Failed to generate Delivery Challan")
        } finally {
            setLoading(false)
        }
    }

    const getTotalItems = () => {
        return Object.values(selectedIds).reduce((acc, curr) => acc + curr.length, 0)
    }

    if (initialLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading inventory...</span>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Add Products</h1>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{storageType === "Replacement" ? "Replacement Delivery" : "Select Products to Add"}</CardTitle>
                    <div className="flex items-center gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                                value={storageType}
                                onValueChange={(val) => {
                                    if (val === "Replacement" && !hasAssignedProducts()) {
                                        toast.error("Replacement not allowed. No existing products assigned to this company.")
                                        return
                                    }
                                    setStorageType(val)
                                }}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Delivery">Delivery</SelectItem>
                                    <SelectItem value="Replacement">Replacement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 items-end">
                            {!isSubmitted ? (
                                <Button variant="outline" onClick={handleDownloadDC} disabled={loading || getTotalItems() === 0}>
                                    Download DC
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={handleViewDC} disabled={loading}>
                                    View DC
                                </Button>
                            )}

                            {!isSubmitted ? (
                                <Button onClick={handleSubmit} disabled={loading || getTotalItems() === 0 || (storageType === "Replacement" && !replacementReason.trim())}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {storageType === "Replacement" ? `Submit Replacement (${getTotalItems()} items)` : `Submit All (${getTotalItems()} items)`}
                                </Button>
                            ) : (
                                <Button onClick={() => navigate(-1)}>
                                    Done
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PRODUCT_TYPES.map((type) => (
                            <div key={type.value} className="space-y-2">
                                <Label className="uppercase text-xs font-bold text-muted-foreground">{type.label}</Label>
                                <MultiSelect
                                    options={availableOptions[type.value] || []}
                                    selected={selectedIds[type.value] || []}
                                    onChange={(val) => handleSelectionChange(type.value, val)}
                                    placeholder={`Select ${type.label}s...`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Reason field for Replacement mode */}
                    {storageType === "Replacement" && (
                        <div className="mt-4 space-y-2">
                            <Label htmlFor="replacement-reason" className="text-sm font-medium">Replacement Reason <span className="text-red-500">*</span></Label>
                            <Input
                                id="replacement-reason"
                                placeholder="Enter reason for replacement delivery..."
                                value={replacementReason}
                                onChange={(e) => setReplacementReason(e.target.value)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Extra Accessories */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Extra Accessories</CardTitle>
                    <Button variant="outline" size="sm" onClick={addAccessoryRow}>
                        <Plus className="h-4 w-4 mr-1" /> Add Accessory
                    </Button>
                </CardHeader>
                <CardContent>
                    {accessories.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No accessories added. Click "Add Accessory" to add items like Keyboard, Mouse, Bag, etc.</p>
                    ) : (
                        <div className="space-y-3">
                            {accessories.map((acc, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Accessory Name</Label>
                                        <Input
                                            placeholder="e.g. Keyboard, Mouse, Bag, Cable..."
                                            value={acc.name}
                                            onChange={(e) => updateAccessory(index, "name", e.target.value)}
                                        />
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <Label className="text-xs">Qty</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={acc.quantity}
                                            onChange={(e) => updateAccessory(index, "quantity", e.target.value)}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" className="mt-5 text-red-500 hover:text-red-700" onClick={() => removeAccessoryRow(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
