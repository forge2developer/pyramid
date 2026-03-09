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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Check, ChevronsUpDown, Pencil, Trash2, XCircle } from "lucide-react"
import { getAuthCookie } from "@/lib/auth"
import { ScrapDialog } from "@/components/common/scrap-dialog"
import { Switch } from "@/components/ui/switch"
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


interface MobileWorkstation {
  id: number
  brand: string
  model: string
  processor_brand: string
  processor_model: string
  generation: string
  adapter: string
  ramCount: number | string
  ssdCount: number | string
  nvmeCount: number | string
  service_id: string
  phyramidID: string
  date_of_purchase: string
  inventoryID: string
  isAvailable: number | boolean | string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

const ITEMS_PER_PAGE = 20

export default function MobileWorkstationInventory() {
  const navigate = useNavigate()
  const [brandOpen, setBrandOpen] = useState(false)
  const [inventoryIDOpen, setInventoryIDOpen] = useState(false)

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    processor_brand: "",
    processor_model: "",
    generation: "",
    adapter: "",
    service_id: "",
    phyramidID: "",
    date_of_purchase: "",
    inventoryID: "",
    isAvailable: false,
  })

  // Filter Dropdown States
  const [modelOpen, setModelOpen] = useState(false)
  const [procBrandOpen, setProcBrandOpen] = useState(false)
  const [serviceIDOpen, setServiceIDOpen] = useState(false)
  const [pyramidIDOpen, setPyramidIDOpen] = useState(false)

  const [mobileWorkstations, setMobileWorkstations] = useState<MobileWorkstation[]>([])
  // Component Data
  const [ram, setRam] = useState<any[]>([])
  const [ssd, setSSD] = useState<any[]>([])
  const [Nvme, setNvme] = useState<any[]>([])
  const [m2, setM2] = useState<any[]>([])

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  })
  const [loading, setLoading] = useState(true)
  const [monitorFilters, setMonitorFilters] = useState<MobileWorkstation[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editingMobileWorkstation, setEditingMobileWorkstation] = useState<MobileWorkstation | null>(null)
  const [scrapItem, setScrapItem] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Component Management States (Edit Modal)
  const [availableRams, setAvailableRams] = useState<any[]>([])
  const [assignedRams, setAssignedRams] = useState<any[]>([])
  const [initialAssignedRams, setInitialAssignedRams] = useState<any[]>([])


  const [availableSSDs, setAvailableSSDs] = useState<any[]>([])
  const [assignedSSDs, setAssignedSSDs] = useState<any[]>([])
  const [initialAssignedSSDs, setInitialAssignedSSDs] = useState<any[]>([])


  const [availableNvmes, setAvailableNvmes] = useState<any[]>([])
  const [assignedNvmes, setAssignedNvmes] = useState<any[]>([])
  const [initialAssignedNvmes, setInitialAssignedNvmes] = useState<any[]>([])


  const [availableM2s, setAvailableM2s] = useState<any[]>([])
  const [assignedM2s, setAssignedM2s] = useState<any[]>([])
  const [initialAssignedM2s, setInitialAssignedM2s] = useState<any[]>([])


  const [openRam, setOpenRam] = useState(false)
  const [openSSD, setOpenSSD] = useState(false)
  const [openNvme, setOpenNvme] = useState(false)
  const [openM2, setOpenM2] = useState(false)

  // Helpers
  const getSafeId = (item: any) => item.id || item.ID || item.Id || item.iD || item.ramID || item.ssdID || item.nvmeID;
  const getValueIgnoreCase = (item: any, key: string) => {
    if (!item) return undefined;
    if (item[key] !== undefined && item[key] !== null) return item[key];
    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(item).find(k => k.toLowerCase() === lowerKey);
    if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) return item[foundKey];
    return undefined;
  };

  const fetchLaptops = async (_page: number = 1, searchData = formData) => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.post(`/inventory/getallMobileWorkstation?page=${_page}&limit=${ITEMS_PER_PAGE}`, searchData)

      // Fetch Components
      const ramPayload = { brand: "", size: "", type: "", service_id: "", pyramid_id: "", isAvailable: false }
      const ramData = await api.post("/inventory/getAllRam?limit=10000", ramPayload)
      setRam(ramData.data.data.ram || [])

      const ssdPayload = { brand: "", size: "", service_tag: "", SerialNumber: "", isAvailable: false }
      const ssdData = await api.post("/inventory/getAllSSD?limit=10000", ssdPayload)
      setSSD(ssdData.data.data.ssd || [])

      const nvmePayload = { brand: "", Size: "", serialNumber: "", serviceTag: "", isAvailable: false }
      const nvmeData = await api.post("/inventory/getAllnvme?limit=10000", nvmePayload)
      setNvme(nvmeData.data.data.nvme || [])

      const m2Payload = { brand: "", size: "", type: "", service_id: "", phyramidID: "", inventoryID: "", isAvailable: false }
      const m2Data = await api.post("/inventory/getAllM_2?limit=10000", m2Payload)
      setM2(m2Data.data.data.m_2 || m2Data.data.data.data || [])

      setMobileWorkstations(data.data.mobileworkstation)
      setMonitorFilters(data.data.data)
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
    fetchLaptops()
  }, [])

  const handlePageChange = (page: number) => {
    fetchLaptops(page)
  }

  const handleEditClick = (mobileWorkstation: any) => {
    setEditingMobileWorkstation(mobileWorkstation)
    const mwId = mobileWorkstation.id;

    // 1. RAMs
    const currentRams = ram.filter((r: any) => String(getValueIgnoreCase(r, 'MobileWorkstationID') || getValueIgnoreCase(r, 'mobileWorkstation_id')) === String(mwId));
    setAssignedRams(currentRams);
    setInitialAssignedRams(currentRams);

    const availableR = ram.filter((r: any) =>
      !getValueIgnoreCase(r, 'laptopID') && !getValueIgnoreCase(r, 'laptop_id') &&
      !getValueIgnoreCase(r, 'SystemID') && !getValueIgnoreCase(r, 'system_id') &&
      !getValueIgnoreCase(r, 'WorkstationID') && !getValueIgnoreCase(r, 'workstation_id') &&
      !getValueIgnoreCase(r, 'MobileWorkstationID') && !getValueIgnoreCase(r, 'mobileWorkstation_id')
    );
    setAvailableRams(availableR);

    // 2. SSDs
    const currentSSDs = ssd.filter((s: any) => String(getValueIgnoreCase(s, 'MobileWorkstationID') || getValueIgnoreCase(s, 'mobileWorkstation_id')) === String(mwId));
    setAssignedSSDs(currentSSDs);
    setInitialAssignedSSDs(currentSSDs);

    const availableS = ssd.filter((s: any) =>
      !getValueIgnoreCase(s, 'laptopID') && !getValueIgnoreCase(s, 'laptop_id') &&
      !getValueIgnoreCase(s, 'SystemID') && !getValueIgnoreCase(s, 'system_id') &&
      !getValueIgnoreCase(s, 'WorkstationID') && !getValueIgnoreCase(s, 'workstation_id') &&
      !getValueIgnoreCase(s, 'MobileWorkstationID') && !getValueIgnoreCase(s, 'mobileWorkstation_id')
    );
    setAvailableSSDs(availableS);

    // 3. NVMes
    const currentNvmes = Nvme.filter((n: any) => String(getValueIgnoreCase(n, 'MobileWorkstationID') || getValueIgnoreCase(n, 'mobileWorkstation_id')) === String(mwId));
    setAssignedNvmes(currentNvmes);
    setInitialAssignedNvmes(currentNvmes);

    const availableN = Nvme.filter((n: any) =>
      !getValueIgnoreCase(n, 'laptopID') && !getValueIgnoreCase(n, 'laptop_id') &&
      !getValueIgnoreCase(n, 'SystemID') && !getValueIgnoreCase(n, 'system_id') &&
      !getValueIgnoreCase(n, 'WorkstationID') && !getValueIgnoreCase(n, 'workstation_id') &&
      !getValueIgnoreCase(n, 'MobileWorkstationID') && !getValueIgnoreCase(n, 'mobileWorkstation_id')
    );
    setAvailableNvmes(availableN);

    // 4. M.2
    const currentM2s = m2.filter((m: any) => String(getValueIgnoreCase(m, 'MobileWorkstationID') || getValueIgnoreCase(m, 'mobileWorkstation_id')) === String(mwId));
    setAssignedM2s(currentM2s);
    setInitialAssignedM2s(currentM2s);

    const availableM = m2.filter((m: any) =>
      !getValueIgnoreCase(m, 'laptopID') && !getValueIgnoreCase(m, 'laptop_id') &&
      !getValueIgnoreCase(m, 'SystemID') && !getValueIgnoreCase(m, 'system_id') &&
      !getValueIgnoreCase(m, 'WorkstationID') && !getValueIgnoreCase(m, 'workstation_id') &&
      !getValueIgnoreCase(m, 'MobileWorkstationID') && !getValueIgnoreCase(m, 'mobileWorkstation_id')
    );
    setAvailableM2s(availableM);
  }

  // Component Add/Remove Handlers
  const handleAddRam = (id: string) => {
    const item = availableRams.find(r => String(getSafeId(r)) === id);
    if (item) { setAssignedRams(prev => [...prev, item]); setAvailableRams(prev => prev.filter(r => String(getSafeId(r)) !== id)); }
  }
  const handleRemoveRam = (item: any) => { setAssignedRams(prev => prev.filter(r => getSafeId(r) !== getSafeId(item))); setAvailableRams(prev => [...prev, item]); }

  const handleAddSSD = (id: string) => {
    const item = availableSSDs.find(s => String(getSafeId(s)) === id);
    if (item) { setAssignedSSDs(prev => [...prev, item]); setAvailableSSDs(prev => prev.filter(s => String(getSafeId(s)) !== id)); }
  }
  const handleRemoveSSD = (item: any) => { setAssignedSSDs(prev => prev.filter(s => getSafeId(s) !== getSafeId(item))); setAvailableSSDs(prev => [...prev, item]); }

  const handleAddNvme = (id: string) => {
    const item = availableNvmes.find(n => String(getSafeId(n)) === id);
    if (item) { setAssignedNvmes(prev => [...prev, item]); setAvailableNvmes(prev => prev.filter(n => String(getSafeId(n)) !== id)); }
  }
  const handleRemoveNvme = (item: any) => { setAssignedNvmes(prev => prev.filter(n => getSafeId(n) !== getSafeId(item))); setAvailableNvmes(prev => [...prev, item]); }

  const handleAddM2 = (id: string) => {
    const item = availableM2s.find(m => String(getSafeId(m)) === id);
    if (item) { setAssignedM2s(prev => [...prev, item]); setAvailableM2s(prev => prev.filter(m => String(getSafeId(m)) !== id)); }
  }
  const handleRemoveM2 = (item: any) => { setAssignedM2s(prev => prev.filter(m => getSafeId(m) !== getSafeId(item))); setAvailableM2s(prev => [...prev, item]); }

  const handleSaveEdit = async () => {
    if (!editingMobileWorkstation) return

    try {
      setIsSaving(true)

      const payload: any = {
        id: editingMobileWorkstation.id,
        brand: editingMobileWorkstation.brand,
        model: editingMobileWorkstation.model,
        processor_brand: editingMobileWorkstation.processor_brand,
        processor_model: editingMobileWorkstation.processor_model,
        generation: editingMobileWorkstation.generation,
        adapter: editingMobileWorkstation.adapter,
        ramCount: editingMobileWorkstation.ramCount,
        ssdCount: editingMobileWorkstation.ssdCount,
        nvmeCount: editingMobileWorkstation.nvmeCount,
        service_id: editingMobileWorkstation.service_id,
        phyramidID: editingMobileWorkstation.phyramidID,
        date_of_purchase: editingMobileWorkstation.date_of_purchase,
        inventoryID: editingMobileWorkstation.inventoryID,
        isAvailable: editingMobileWorkstation.isAvailable,
        product: 'mobileWorkstation'
      };

      // RAM Changes
      const addedRams = assignedRams.filter(r => !initialAssignedRams.find(ir => getSafeId(ir) === getSafeId(r)));
      const removedRams = initialAssignedRams.filter(ir => !assignedRams.find(r => getSafeId(r) === getSafeId(ir)));
      if (addedRams.length > 0) payload.addRam = addedRams;
      if (removedRams.length > 0) payload.removeRam = removedRams;

      // SSD Changes
      const addedSSDs = assignedSSDs.filter(s => !initialAssignedSSDs.find(is => getSafeId(is) === getSafeId(s)));
      const removedSSDs = initialAssignedSSDs.filter(is => !assignedSSDs.find(s => getSafeId(s) === getSafeId(is)));
      if (addedSSDs.length > 0) payload.addSSD = addedSSDs;
      if (removedSSDs.length > 0) payload.removeSSD = removedSSDs;

      // NVMe Changes
      const addedNvmes = assignedNvmes.filter(n => !initialAssignedNvmes.find(in_ => getSafeId(in_) === getSafeId(n)));
      const removedNvmes = initialAssignedNvmes.filter(in_ => !assignedNvmes.find(n => getSafeId(n) === getSafeId(in_)));
      if (addedNvmes.length > 0) payload.addNvme = addedNvmes;
      if (removedNvmes.length > 0) payload.removeNvme = removedNvmes;

      // M.2 Changes
      const addedM2s = assignedM2s.filter(m => !initialAssignedM2s.find(im => getSafeId(im) === getSafeId(m)));
      const removedM2s = initialAssignedM2s.filter(im => !assignedM2s.find(m => getSafeId(m) === getSafeId(im)));
      if (addedM2s.length > 0) payload.addM2 = addedM2s;
      if (removedM2s.length > 0) payload.removeM2 = removedM2s;

      console.log("Updating Mobile Workstation Payload:", payload);

      const { data } = await api.post("/inventory/updateMobileWorkStation", payload)
      if (data.success) {
        setEditingMobileWorkstation(null)
        fetchLaptops(pagination.currentPage)
      } else {
        toast.error("Failed to update Mobile Workstation")
      }
    } catch (err: any) {
      console.error("Failed to update Mobile Workstation:", err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || "Error updating Mobile Workstation")
    } finally {
      setIsSaving(false)
    }
  }

  const handleScrapClick = (mobileWorkstation: any) => {
    setScrapItem(mobileWorkstation)
  }

  const handleConfirmScrap = async (reason: string) => {
    if (!scrapItem) return
    const user = getAuthCookie()
    // @ts-ignore
    const userId = user?.id || null

    try {
      const payload = {
        producedID: scrapItem.id,
        produced: 'mobileWorkStation',
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
        fetchLaptops(pagination.currentPage)
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
    fetchLaptops(1, formData)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Unique Filters
  const uniqueBrands = [...new Set(monitorFilters?.map((m: any) => m.brand).filter(Boolean))]
  const uniqueModels = [...new Set(monitorFilters?.map((m: any) => m.model).filter(Boolean))]
  const uniqueProcBrands = [...new Set(monitorFilters?.map((m: any) => m.processor_brand).filter(Boolean))]
  const uniqueServiceIds = [...new Set(monitorFilters?.map((m: any) => m.service_id).filter(Boolean))]
  const uniquePhyramidIds = [...new Set(monitorFilters?.map((m: any) => m.phyramidID).filter(Boolean))]
  const uniqueInventoryIDs = [...new Set(monitorFilters?.map((m: any) => m.inventoryID).filter(Boolean))]

  const handleReset = async () => {
    const emptyState = {
      brand: "",
      model: "",
      processor_brand: "",
      processor_model: "",
      generation: "",
      adapter: "",
      service_id: "",
      phyramidID: "",
      date_of_purchase: "",
      inventoryID: "",
      isAvailable: false,
    }
    setFormData(emptyState);
    fetchLaptops(1, emptyState);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Filters */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={brandOpen} className="w-full justify-between font-normal">
                    {formData.brand || "Select Brand..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Brand..." />
                    <CommandList>
                      <CommandEmpty>No Brand found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="none" onSelect={() => { handleSelectChange("brand", ""); setBrandOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.brand === "" ? "opacity-100" : "opacity-0")} /> None
                        </CommandItem>
                        {uniqueBrands.map((brand: any) => (
                          <CommandItem key={brand} value={brand} onSelect={() => { handleSelectChange("brand", brand); setBrandOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.brand === brand ? "opacity-100" : "opacity-0")} /> {brand}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Popover open={modelOpen} onOpenChange={setModelOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={modelOpen} className="w-full justify-between font-normal">
                    {formData.model || "Select Model..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Model..." />
                    <CommandList>
                      <CommandEmpty>No Model found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="none" onSelect={() => { handleSelectChange("model", ""); setModelOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.model === "" ? "opacity-100" : "opacity-0")} /> None
                        </CommandItem>
                        {uniqueModels.map((model: any) => (
                          <CommandItem key={model} value={model} onSelect={() => { handleSelectChange("model", model); setModelOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.model === model ? "opacity-100" : "opacity-0")} /> {model}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="processor_brand">Processor Brand</Label>
              <Popover open={procBrandOpen} onOpenChange={setProcBrandOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={procBrandOpen} className="w-full justify-between font-normal">
                    {formData.processor_brand || "Select Processor Brand..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Processor Brand..." />
                    <CommandList>
                      <CommandEmpty>No Processor Brand found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="none" onSelect={() => { handleSelectChange("processor_brand", ""); setProcBrandOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.processor_brand === "" ? "opacity-100" : "opacity-0")} /> None
                        </CommandItem>
                        {uniqueProcBrands.map((pb: any) => (
                          <CommandItem key={pb} value={pb} onSelect={() => { handleSelectChange("processor_brand", pb); setProcBrandOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.processor_brand === pb ? "opacity-100" : "opacity-0")} /> {pb}
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
              <Popover open={serviceIDOpen} onOpenChange={setServiceIDOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={serviceIDOpen} className="w-full justify-between font-normal">
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
                        <CommandItem value="none" onSelect={() => { handleSelectChange("service_id", ""); setServiceIDOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.service_id === "" ? "opacity-100" : "opacity-0")} /> None
                        </CommandItem>
                        {uniqueServiceIds.map((id: any) => (
                          <CommandItem key={id} value={id} onSelect={() => { handleSelectChange("service_id", id); setServiceIDOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.service_id === id ? "opacity-100" : "opacity-0")} /> {id}
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
              <Popover open={pyramidIDOpen} onOpenChange={setPyramidIDOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={pyramidIDOpen} className="w-full justify-between font-normal">
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
                        <CommandItem value="none" onSelect={() => { handleSelectChange("phyramidID", ""); setPyramidIDOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.phyramidID === "" ? "opacity-100" : "opacity-0")} /> None
                        </CommandItem>
                        {uniquePhyramidIds.map((id: any) => (
                          <CommandItem key={id} value={id} onSelect={() => { handleSelectChange("phyramidID", id); setPyramidIDOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.phyramidID === id ? "opacity-100" : "opacity-0")} /> {id}
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

            <div className="space-y-4">
              <Label htmlFor="isAvailable">Availability</Label>
              <div className="flex items-center space-x-2 h-10">
                <Switch
                  id="isAvailable"
                  checked={Boolean(formData.isAvailable)}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ ...prev, isAvailable: checked }));
                    const newItem = { ...formData, isAvailable: checked };
                    api.post("/inventory/getallMobileWorkstation", newItem).then(({ data }) => {
                      setMobileWorkstations(data.data.mobileworkstation);
                      setMonitorFilters(data.data.data);
                      setPagination(data.data.pagination);
                    }).catch(err => console.error(err));
                  }}
                />
                <Label htmlFor="isAvailable" className="font-normal cursor-pointer text-muted-foreground">
                  {formData.isAvailable ? "Show Available Only" : "Show All"}
                </Label>
              </div>
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
              <Table className="min-w-[1400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Pyramid ID</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead>Generation</TableHead>
                    <TableHead>Adapter</TableHead>
                    <TableHead>RAM</TableHead>
                    <TableHead>SSD</TableHead>
                    <TableHead>NVMe</TableHead>
                    <TableHead>M.2</TableHead>
                    <TableHead>Service Tag</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mobileWorkstations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                        No Mobile Workstations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    mobileWorkstations.map((mw: any, index) => (
                      <TableRow key={mw.id}>
                        <TableCell className="font-medium">{(pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>{mw.phyramidID}</TableCell>
                        <TableCell>{mw.brand}</TableCell>
                        <TableCell
                          className="cursor-pointer hover:underline text-blue-600"
                          onClick={() => navigate(`/Inventory/mobileWorkstation/${mw.id}`)}
                        >
                          {mw.model}
                          <div className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2",
                            mw.isAvailable === "1" || mw.isAvailable === "true" || mw.isAvailable === "yes" || mw.isAvailable === true || mw.isAvailable === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                              : "bg-red-100 text-red-800 hover:bg-red-100/80"
                          )}>
                            {mw.isAvailable === "1" || mw.isAvailable === "true" || mw.isAvailable === "yes" || mw.isAvailable === true || mw.isAvailable === 1 ? "Available" : "Moving"}
                          </div>
                        </TableCell>
                        <TableCell>{mw.processor_brand} {mw.processor_model}</TableCell>
                        <TableCell>{mw.generation}</TableCell>
                        <TableCell>{mw.adapter}</TableCell>
                        <TableCell>
                          {ram?.filter((r: any) => String(getValueIgnoreCase(r, 'MobileWorkstationID') || getValueIgnoreCase(r, 'mobileWorkstation_id')) === String(mw.id))
                            .map((r: any) => r.size).join(' + ') || '-'}
                        </TableCell>
                        <TableCell>
                          {ssd?.filter((s: any) => String(getValueIgnoreCase(s, 'MobileWorkstationID') || getValueIgnoreCase(s, 'mobileWorkstation_id')) === String(mw.id))
                            .map((s: any) => s.ssdSize || s.size).join(' + ') || '-'}
                        </TableCell>
                        <TableCell>
                          {Nvme?.filter((n: any) => String(getValueIgnoreCase(n, 'MobileWorkstationID') || getValueIgnoreCase(n, 'mobileWorkstation_id')) === String(mw.id))
                            .map((n: any) => n.Size || n.size).join(' + ') || '-'}
                        </TableCell>
                        <TableCell>
                          {m2?.filter((m: any) => String(getValueIgnoreCase(m, 'MobileWorkstationID') || getValueIgnoreCase(m, 'mobileWorkstation_id')) === String(mw.id))
                            .map((m: any) => m.size || m.Size).join(' + ') || '-'}
                        </TableCell>
                        <TableCell>{mw.service_id}</TableCell>
                        <TableCell>
                          <ActionTooltip label="Edit">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(mw)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Scrap">
                            <Button variant="ghost" size="icon" onClick={() => handleScrapClick(mw)}>
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


      <Dialog open={!!editingMobileWorkstation} onOpenChange={(open) => !open && setEditingMobileWorkstation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Mobile Workstation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingMobileWorkstation && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Brand</Label>
                    <Input
                      id="edit-brand"
                      value={editingMobileWorkstation.brand || ""}
                      onChange={(e) => setEditingMobileWorkstation({ ...editingMobileWorkstation, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-model">Model</Label>
                    <Input
                      id="edit-model"
                      value={editingMobileWorkstation.model || ""}
                      onChange={(e) => setEditingMobileWorkstation({ ...editingMobileWorkstation, model: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-processor_brand">Processor Brand</Label>
                    <Input
                      id="edit-processor_brand"
                      value={editingMobileWorkstation.processor_brand || ""}
                      onChange={(e) => setEditingMobileWorkstation({ ...editingMobileWorkstation, processor_brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-processor_model">Processor Model</Label>
                    <Input
                      id="edit-processor_model"
                      value={editingMobileWorkstation.processor_model || ""}
                      onChange={(e) => setEditingMobileWorkstation({ ...editingMobileWorkstation, processor_model: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-generation">Generation</Label>
                    <Input
                      id="edit-generation"
                      value={editingMobileWorkstation.generation || ""}
                      onChange={(e) => setEditingMobileWorkstation({ ...editingMobileWorkstation, generation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-adapter">Adapter</Label>
                    <Input
                      id="edit-adapter"
                      value={editingMobileWorkstation.adapter || ""}
                      onChange={(e) => setEditingMobileWorkstation({ ...editingMobileWorkstation, adapter: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-service_id">Service Tag</Label>
                    <Input
                      id="edit-service_id"
                      value={editingMobileWorkstation.service_id || ""}
                      onChange={(e) => setEditingMobileWorkstation({ ...editingMobileWorkstation, service_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phyramidID">Pyramid ID</Label>
                    <Input
                      id="edit-phyramidID"
                      value={editingMobileWorkstation.phyramidID || ""}
                      onChange={(e) => setEditingMobileWorkstation({ ...editingMobileWorkstation, phyramidID: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-inventoryID">Inventory ID</Label>
                    <Input
                      id="edit-inventoryID"
                      value={editingMobileWorkstation.inventoryID || ""}
                      onChange={(e) => setEditingMobileWorkstation({ ...editingMobileWorkstation, inventoryID: e.target.value })}
                    />
                  </div>
                </div>

                {/* --- COMPONENT MANAGEMENT --- */}

                {/* RAM */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center uppercase tracking-tight">
                      RAM Components
                      <span className="text-[10px] font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border">{assignedRams.length} Assigned</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {assignedRams.map(item => (
                        <div key={getSafeId(item)} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'size')} ({getValueIgnoreCase(item, 'type')}) - <span className="text-muted-foreground font-mono">{getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveRam(item)} className="text-destructive h-7 w-7 opacity-70 group-hover:opacity-100 hover:bg-red-50 transition-all"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      ))}
                      {assignedRams.length === 0 && <p className="text-xs text-center p-4 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed italic">No RAM assigned</p>}
                    </div>
                    <div className="pt-2">
                      <Popover open={openRam} onOpenChange={setOpenRam}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openRam}
                            className="w-full justify-between font-normal h-9 text-xs border-slate-200 focus:ring-blue-500"
                          >
                            Add RAM...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search RAM..." />
                            <CommandList>
                              <CommandEmpty>No RAM available.</CommandEmpty>
                              <CommandGroup>
                                {availableRams.map((item) => {
                                  const label = `${getValueIgnoreCase(item, 'brand')} ${getValueIgnoreCase(item, 'size')} (${getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'})`;
                                  return (
                                    <CommandItem
                                      key={getSafeId(item)}
                                      value={label}
                                      onSelect={() => {
                                        const val = String(getSafeId(item));
                                        handleAddRam(val);
                                        setOpenRam(false);
                                      }}
                                    >
                                      {label}
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>

                {/* SSD */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center uppercase tracking-tight">
                      SSD Components
                      <span className="text-[10px] font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border">{assignedSSDs.length} Assigned</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {assignedSSDs.map(item => (
                        <div key={getSafeId(item)} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'ssdSize') || getValueIgnoreCase(item, 'size')} - <span className="text-muted-foreground font-mono">{getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveSSD(item)} className="text-destructive h-7 w-7 opacity-70 group-hover:opacity-100 hover:bg-red-50 transition-all"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      ))}
                      {assignedSSDs.length === 0 && <p className="text-xs text-center p-4 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed italic">No SSD assigned</p>}
                    </div>
                    <div className="pt-2">
                      <Popover open={openSSD} onOpenChange={setOpenSSD}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openSSD}
                            className="w-full justify-between font-normal h-9 text-xs border-slate-200 focus:ring-blue-500"
                          >
                            Add SSD...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search SSD..." />
                            <CommandList>
                              <CommandEmpty>No SSD available.</CommandEmpty>
                              <CommandGroup>
                                {availableSSDs.map((item) => {
                                  const label = `${getValueIgnoreCase(item, 'brand')} ${getValueIgnoreCase(item, 'ssdSize') || getValueIgnoreCase(item, 'size')} (${getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'})`;
                                  return (
                                    <CommandItem
                                      key={getSafeId(item)}
                                      value={label}
                                      onSelect={() => {
                                        const val = String(getSafeId(item));
                                        handleAddSSD(val);
                                        setOpenSSD(false);
                                      }}
                                    >
                                      {label}
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>

                {/* NVMe */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center uppercase tracking-tight">
                      NVMe Components
                      <span className="text-[10px] font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border">{assignedNvmes.length} Assigned</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {assignedNvmes.map(item => (
                        <div key={getSafeId(item)} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'Size') || getValueIgnoreCase(item, 'size')} - <span className="text-muted-foreground font-mono">{getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveNvme(item)} className="text-destructive h-7 w-7 opacity-70 group-hover:opacity-100 hover:bg-red-50 transition-all"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      ))}
                      {assignedNvmes.length === 0 && <p className="text-xs text-center p-4 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed italic">No NVMe assigned</p>}
                    </div>
                    <div className="pt-2">
                      <Popover open={openNvme} onOpenChange={setOpenNvme}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openNvme}
                            className="w-full justify-between font-normal h-9 text-xs border-slate-200 focus:ring-blue-500"
                          >
                            Add NVMe...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search NVMe..." />
                            <CommandList>
                              <CommandEmpty>No NVMe available.</CommandEmpty>
                              <CommandGroup>
                                {availableNvmes.map((item) => {
                                  const label = `${getValueIgnoreCase(item, 'brand')} ${getValueIgnoreCase(item, 'Size') || getValueIgnoreCase(item, 'size')} (${getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'})`;
                                  return (
                                    <CommandItem
                                      key={getSafeId(item)}
                                      value={label}
                                      onSelect={() => {
                                        const val = String(getSafeId(item));
                                        handleAddNvme(val);
                                        setOpenNvme(false);
                                      }}
                                    >
                                      {label}
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>

                {/* M.2 */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center uppercase tracking-tight">
                      M.2 Components
                      <span className="text-[10px] font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border">{assignedM2s.length} Assigned</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {assignedM2s.map(item => (
                        <div key={getSafeId(item)} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'size') || getValueIgnoreCase(item, 'Size')} ({getValueIgnoreCase(item, 'type')}) - <span className="text-muted-foreground font-mono">{getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveM2(item)} className="text-destructive h-7 w-7 opacity-70 group-hover:opacity-100 hover:bg-red-50 transition-all"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      ))}
                      {assignedM2s.length === 0 && <p className="text-xs text-center p-4 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed italic">No M.2 assigned</p>}
                    </div>
                    <div className="pt-2">
                      <Popover open={openM2} onOpenChange={setOpenM2}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openM2}
                            className="w-full justify-between font-normal h-9 text-xs border-slate-200 focus:ring-blue-500"
                          >
                            Add M.2...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search M.2..." />
                            <CommandList>
                              <CommandEmpty>No M.2 available.</CommandEmpty>
                              <CommandGroup>
                                {availableM2s.map((item) => {
                                  const label = `${getValueIgnoreCase(item, 'brand')} ${getValueIgnoreCase(item, 'size') || getValueIgnoreCase(item, 'Size')} (${getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'})`;
                                  return (
                                    <CommandItem
                                      key={getSafeId(item)}
                                      value={label}
                                      onSelect={() => {
                                        const val = String(getSafeId(item));
                                        handleAddM2(val);
                                        setOpenM2(false);
                                      }}
                                    >
                                      {label}
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>

              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMobileWorkstation(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScrapDialog
        isOpen={!!scrapItem}
        onClose={() => setScrapItem(null)}
        onConfirm={handleConfirmScrap}
        itemName={`Mobile Workstation ${scrapItem?.processor_brand || scrapItem?.model}`}
      />
    </div >
  )
}   