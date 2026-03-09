import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import api from "@/lib/axios"
import { Label } from "@/components/ui/label"
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
import { Check, ChevronsUpDown, Pencil, Trash2, XCircle } from "lucide-react"
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


interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

const ITEMS_PER_PAGE = 20

export default function WorkstationInventory() {

  const [nameOpen, setNameOpen] = useState(false)
  const navigate = useNavigate()
  const [processorOpen, setProcessorOpen] = useState(false)
  const [generationOpen, setGenerationOpen] = useState(false)
  const [serviceIDOpen, setServiceIDOpen] = useState(false)
  const [serialNumberOpen, setserialNumberOpen] = useState(false)
  const [inventoryIDOpen, setInventoryIDOpen] = useState(false)

  const [formData, setFormData] = useState({
    Name: "",
    Processor: "",
    generation: "",
    serviceID: "",
    pyramidsID: "",
    inventoryID: "",
    isAvailable: false,
  })

  // Data
  const [workstations, setWorkstations] = useState<any[]>([])
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
  const [monitorFilters, setMonitorFilters] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editingWorkstation, setEditingWorkstation] = useState<any | null>(null)
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


  // M.2 Management State
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
    if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) {
      return item[foundKey];
    }
    return undefined;
  };

  const fetchWorkstations = async (_page: number = 1, searchData = formData) => {
    try {
      // setLoading(true)
      setError(null)
      const { data } = await api.post(`/inventory/getAllWorkstation?page=${_page}&limit=${ITEMS_PER_PAGE}`, searchData)

      // Fetch Components for Table Display
      const ramPayload = { brand: "", size: "", type: "", service_id: "", pyramid_id: "", isAvailable: false }
      const ramData = await api.post("/inventory/getAllRam?limit=10000", ramPayload)
      setRam(ramData.data.data.ram || [])

      const ssdPayload = { brand: "", size: "", service_tag: "", SerialNumber: "", isAvailable: false }
      const ssdData = await api.post("/inventory/getAllSSD?limit=10000", ssdPayload)
      setSSD(ssdData.data.data.ssd || [])

      const nvmePayload = { brand: "", Size: "", serialNumber: "", serviceTag: "", isAvailable: false }
      const nvmeData = await api.post("/inventory/getAllnvme?limit=10000", nvmePayload)
      setNvme(nvmeData.data.data.nvme || [])

      // Fetch M.2 data
      const m2Payload = { brand: "", size: "", type: "", service_id: "", phyramidID: "", inventoryID: "", isAvailable: false }
      const m2Data = await api.post("/inventory/getAllM_2?limit=10000", m2Payload)
      setM2(m2Data.data.data.m_2 || m2Data.data.data.data || [])

      setWorkstations(data.data.workstation)
      setMonitorFilters(data.data.data)
      setPagination(data.data.pagination)

    } catch (err) {
      setError("Failed to fetch inventory data")
      console.error(err)
    }
    // finally {
    //   setLoading(false)
    // }
  }

  useEffect(() => {
    fetchWorkstations()
  }, [])

  const handlePageChange = (page: number) => {
    fetchWorkstations(page)
  }

  const handleEditClick = (workstation: any) => {
    setEditingWorkstation(workstation)
    const workstationId = workstation.id; // Workstations use 'id', logic might need validation if db uses 'workstationID'

    // 1. RAMS
    const currentRams = ram.filter((r: any) => String(getValueIgnoreCase(r, 'WorkstationID') || getValueIgnoreCase(r, 'workstation_id')) === String(workstationId));
    setAssignedRams(currentRams);
    setInitialAssignedRams(currentRams);


    // Available RAMs
    const availableR = ram.filter((r: any) =>
      !getValueIgnoreCase(r, 'laptopID') && !getValueIgnoreCase(r, 'laptop_id') &&
      !getValueIgnoreCase(r, 'SystemID') && !getValueIgnoreCase(r, 'system_id') &&
      !getValueIgnoreCase(r, 'WorkstationID') && !getValueIgnoreCase(r, 'workstation_id')
    );
    setAvailableRams(availableR);

    // 2. SSDs
    const currentSSDs = ssd.filter((s: any) => String(getValueIgnoreCase(s, 'WorkstationID') || getValueIgnoreCase(s, 'workstation_id')) === String(workstationId));
    setAssignedSSDs(currentSSDs);
    setInitialAssignedSSDs(currentSSDs);


    const availableS = ssd.filter((s: any) =>
      !getValueIgnoreCase(s, 'laptopID') && !getValueIgnoreCase(s, 'laptop_id') &&
      !getValueIgnoreCase(s, 'SystemID') && !getValueIgnoreCase(s, 'system_id') &&
      !getValueIgnoreCase(s, 'WorkstationID') && !getValueIgnoreCase(s, 'workstation_id')
    );
    setAvailableSSDs(availableS);

    // 3. NVMEs
    const currentNvmes = Nvme.filter((n: any) => String(getValueIgnoreCase(n, 'WorkstationID') || getValueIgnoreCase(n, 'workstation_id')) === String(workstationId));
    setAssignedNvmes(currentNvmes);
    setInitialAssignedNvmes(currentNvmes);


    const availableN = Nvme.filter((n: any) =>
      !getValueIgnoreCase(n, 'laptopID') && !getValueIgnoreCase(n, 'laptop_id') &&
      !getValueIgnoreCase(n, 'SystemID') && !getValueIgnoreCase(n, 'system_id') &&
      !getValueIgnoreCase(n, 'WorkstationID') && !getValueIgnoreCase(n, 'workstation_id')
    );
    setAvailableNvmes(availableN);

    // 4. M.2
    const currentM2s = m2.filter((m: any) => String(getValueIgnoreCase(m, 'WorkstationID') || getValueIgnoreCase(m, 'workstation_id')) === String(workstationId));
    setAssignedM2s(currentM2s);
    setInitialAssignedM2s(currentM2s);


    const availableM = m2.filter((m: any) =>
      !getValueIgnoreCase(m, 'laptopID') && !getValueIgnoreCase(m, 'laptop_id') &&
      !getValueIgnoreCase(m, 'SystemID') && !getValueIgnoreCase(m, 'system_id') &&
      !getValueIgnoreCase(m, 'WorkstationID') && !getValueIgnoreCase(m, 'workstation_id')
    );
    setAvailableM2s(availableM);
  }

  // Component Add/Remove Handlers
  const handleAddRam = (id: string) => {
    const item = availableRams.find(r => String(getSafeId(r)) === id);
    if (item) {
      setAssignedRams(prev => [...prev, item]);
      setAvailableRams(prev => prev.filter(r => String(getSafeId(r)) !== id));

    }
  }
  const handleRemoveRam = (item: any) => {
    setAssignedRams(prev => prev.filter(r => getSafeId(r) !== getSafeId(item)));
    setAvailableRams(prev => [...prev, item]);
  }

  const handleAddSSD = (id: string) => {
    const item = availableSSDs.find(s => String(getSafeId(s)) === id);
    if (item) {
      setAssignedSSDs(prev => [...prev, item]);
      setAvailableSSDs(prev => prev.filter(s => String(getSafeId(s)) !== id));

    }
  }
  const handleRemoveSSD = (item: any) => {
    setAssignedSSDs(prev => prev.filter(s => getSafeId(s) !== getSafeId(item)));
    setAvailableSSDs(prev => [...prev, item]);
  }

  const handleAddNvme = (id: string) => {
    const item = availableNvmes.find(n => String(getSafeId(n)) === id);
    if (item) {
      setAssignedNvmes(prev => [...prev, item]);
      setAvailableNvmes(prev => prev.filter(n => String(getSafeId(n)) !== id));

    }
  }
  const handleRemoveNvme = (item: any) => {
    setAssignedNvmes(prev => prev.filter(n => getSafeId(n) !== getSafeId(item)));
    setAvailableNvmes(prev => [...prev, item]);
  }

  const handleAddM2 = (id: string) => {
    const item = availableM2s.find(m => String(getSafeId(m)) === id);
    if (item) {
      setAssignedM2s(prev => [...prev, item]);
      setAvailableM2s(prev => prev.filter(m => String(getSafeId(m)) !== id));

    }
  }
  const handleRemoveM2 = (item: any) => {
    setAssignedM2s(prev => prev.filter(m => getSafeId(m) !== getSafeId(item)));
    setAvailableM2s(prev => [...prev, item]);
  }


  const handleSaveEdit = async () => {
    if (!editingWorkstation) return

    try {
      setIsSaving(true)

      const payload: any = { ...editingWorkstation };
      payload.product = 'workstation';

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

      console.log("Updating Workstation Payload:", payload);

      const { data } = await api.post("/inventory/Fv", payload)
      if (data.success) {
        toast.success("Workstation updated successfully")
        setEditingWorkstation(null)
        fetchWorkstations(pagination.currentPage)
      } else {
        toast.error("Failed to update Workstation")
      }
    } catch (err: any) {
      console.error("Failed to update Workstation:", err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || "Error updating Workstation")
    } finally {
      setIsSaving(false)
    }
  }

  const handleScrapClick = (workstation: any) => {
    setScrapItem(workstation)
  }

  const handleConfirmScrap = async (reason: string) => {
    if (!scrapItem) return
    const user = getAuthCookie()
    // @ts-ignore
    const userId = user?.id || null

    try {
      const payload = {
        producedID: scrapItem.id,
        produced: 'workstation',
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
        fetchWorkstations(pagination.currentPage)
      } else {
        throw new Error(data.message || "Failed to scrap item")
      }
    } catch (err: any) {
      console.error("Scrap failed", err)
      toast.error(err.response?.data?.message || err.message || "Failed to scrap item")
      throw err
    }
  }

  // if (loading) {
  //   return <FullScreenLoader text="Loading inventory..." />
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // setLoading(true);
      await fetchWorkstations(1, formData);
    } catch (err) {
      console.error("Failed to fetch workstation:", err)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Get unique filters
  const uniqueName = [...new Set(monitorFilters?.map((monitor: any) => monitor.Name).filter(Boolean))]
  const uniqueProcessor = [...new Set(monitorFilters?.map((monitor: any) => monitor.Processor).filter(Boolean))]
  const uniqueGeneration = [...new Set(monitorFilters?.map((monitor: any) => monitor.generation).filter(Boolean))]
  const uniqueServiceID = [...new Set(monitorFilters?.map((monitor: any) => monitor.serviceID).filter(Boolean))]
  const uniquepyramidsID = [...new Set(monitorFilters?.map((monitor: any) => monitor.pyramidsID).filter(Boolean))]
  const uniqueInventoryID = [...new Set(monitorFilters?.map((monitor: any) => monitor.inventoryID).filter(Boolean))]

  const handleReset = async () => {
    const emptyForm = {
      Name: "",
      Processor: "",
      generation: "",
      serviceID: "",
      pyramidsID: "",
      inventoryID: "",
      isAvailable: false,
    }
    setFormData(emptyForm);
    fetchWorkstations(1, emptyForm);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Name">Brand</Label>
              <Popover open={nameOpen} onOpenChange={setNameOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={nameOpen} className="w-full justify-between font-normal">
                    {formData.Name || "Select Brand..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Name..." />
                    <CommandList>
                      <CommandEmpty>No Name found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="none" onSelect={() => { handleSelectChange("Name", ""); setNameOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.Name === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniqueName.map((name: any) => (
                          <CommandItem key={name} value={name} onSelect={() => { handleSelectChange("Name", name); setNameOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.Name === name ? "opacity-100" : "opacity-0")} />
                            {name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Processor">Processor</Label>
              <Popover open={processorOpen} onOpenChange={setProcessorOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={processorOpen} className="w-full justify-between font-normal">
                    {formData.Processor || "Select Processor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Processor..." />
                    <CommandList>
                      <CommandEmpty>No Processor found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="none" onSelect={() => { handleSelectChange("Processor", ""); setProcessorOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.Processor === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniqueProcessor.map((processor: any) => (
                          <CommandItem key={processor} value={processor} onSelect={() => { handleSelectChange("Processor", processor); setProcessorOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.Processor === processor ? "opacity-100" : "opacity-0")} />
                            {processor}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="generation">Generation</Label>
              <Popover open={generationOpen} onOpenChange={setGenerationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={generationOpen} className="w-full justify-between font-normal">
                    {formData.generation || "Select Generation..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Generation..." />
                    <CommandList>
                      <CommandEmpty>No Generation found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="none" onSelect={() => { handleSelectChange("generation", ""); setGenerationOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.generation === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniqueGeneration.map((gen: any) => (
                          <CommandItem key={gen} value={gen} onSelect={() => { handleSelectChange("generation", gen); setGenerationOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.generation === gen ? "opacity-100" : "opacity-0")} />
                            {gen}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceID">Service Tag</Label>
              <Popover open={serviceIDOpen} onOpenChange={setServiceIDOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={serviceIDOpen} className="w-full justify-between font-normal">
                    {formData.serviceID || "Select Service Tag..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Service Tag..." />
                    <CommandList>
                      <CommandEmpty>No Service Tag found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="none" onSelect={() => { handleSelectChange("serviceID", ""); setServiceIDOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.serviceID === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniqueServiceID.map((sid: any) => (
                          <CommandItem key={sid} value={sid} onSelect={() => { handleSelectChange("serviceID", sid); setServiceIDOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.serviceID === sid ? "opacity-100" : "opacity-0")} />
                            {sid}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pyramidsID">PyramidsID</Label>
              <Popover open={serialNumberOpen} onOpenChange={setserialNumberOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={serialNumberOpen} className="w-full justify-between font-normal">
                    {formData.pyramidsID || "Select pyramidsID..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search pyramidsID..." />
                    <CommandList>
                      <CommandEmpty>No pyramidsID found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="none" onSelect={() => { handleSelectChange("pyramidsID", ""); setserialNumberOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.pyramidsID === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniquepyramidsID.map((pyramidsID: any) => (
                          <CommandItem key={pyramidsID} value={pyramidsID} onSelect={() => { handleSelectChange("pyramidsID", pyramidsID); setserialNumberOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.pyramidsID === pyramidsID ? "opacity-100" : "opacity-0")} />
                            {pyramidsID}
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
                  <Button variant="outline" role="combobox" aria-expanded={inventoryIDOpen} className="w-full justify-between font-normal">
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
                        <CommandItem value="none" onSelect={() => { handleSelectChange("inventoryID", ""); setInventoryIDOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.inventoryID === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniqueInventoryID.map((id: any) => (
                          <CommandItem key={id} value={id} onSelect={() => { handleSelectChange("inventoryID", id); setInventoryIDOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.inventoryID === id ? "opacity-100" : "opacity-0")} />
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
          <div className="space-y-4">
            <Label htmlFor="isAvailable">Availability</Label>
            <div className="flex items-center space-x-2 h-10">
              <Switch
                id="isAvailable"
                checked={Boolean(formData.isAvailable)}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, isAvailable: checked }));
                  const newItem = { ...formData, isAvailable: checked };
                  // setLoading(true); // Prevent full screen loader causing shake
                  api.post("/inventory/getAllWorkstation", newItem).then(({ data }) => {
                    setWorkstations(data.data.workstation);
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
          <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
            <Button type="submit" className="w-full sm:w-auto">Submit</Button>
            <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto">
              Reset
            </Button>
          </div>
        </form>
      </div >
      <div className="rounded-xl border bg-card shadow-sm">
        {error ? (
          <div className="p-8 text-center text-destructive">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Pyramids ID</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead>generation</TableHead>
                    <TableHead>Service Tag</TableHead>
                    <TableHead>RAM</TableHead>
                    <TableHead>SSD</TableHead>
                    <TableHead>NVMe</TableHead>
                    <TableHead>M.2</TableHead>
                    <TableHead>Graphics Card</TableHead>
                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workstations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                        No Workstations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    workstations.map((workstation: any, index) => (
                      <TableRow key={workstation.id}>
                        <TableCell className="font-medium">{(pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>{workstation.pyramidsID}</TableCell>
                        <TableCell
                          className="cursor-pointer hover:underline text-blue-600"
                          onClick={() => navigate(`/Inventory/workstation/${workstation.id}`)}
                        >
                          {workstation.Name}
                          <div className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2",
                            workstation.available === "1" || workstation.available === "true" || workstation.available === "yes" || workstation.isAvailable
                              ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                              : "bg-red-100 text-red-800 hover:bg-red-100/80"
                          )}>
                            {workstation.available === "1" || workstation.available === "true" || workstation.available === "yes" || workstation.isAvailable ? "Available" : "Moving"}
                          </div>
                        </TableCell>
                        <TableCell>{workstation.Processor}</TableCell>
                        <TableCell>{workstation.generation}</TableCell>
                        <TableCell>{workstation.serviceID}</TableCell>

                        <TableCell>
                          {ram?.filter((r: any) => String(getValueIgnoreCase(r, 'WorkstationID') || getValueIgnoreCase(r, 'workstation_id')) === String(workstation.id))
                            .map((r: any) => r.size).join(' + ') || '-'}
                        </TableCell>
                        <TableCell>
                          {ssd?.filter((s: any) => String(getValueIgnoreCase(s, 'WorkstationID') || getValueIgnoreCase(s, 'workstation_id')) === String(workstation.id))
                            .map((s: any) => s.ssdSize || s.size).join(' + ') || '-'}
                        </TableCell>
                        <TableCell>
                          {Nvme?.filter((n: any) => String(getValueIgnoreCase(n, 'WorkstationID') || getValueIgnoreCase(n, 'workstation_id')) === String(workstation.id))
                            .map((n: any) => n.Size || n.size).join(' + ') || '-'}
                        </TableCell>
                        <TableCell>
                          {m2?.filter((m: any) => String(getValueIgnoreCase(m, 'WorkstationID') || getValueIgnoreCase(m, 'workstation_id')) === String(workstation.id))
                            .map((m: any) => m.size || m.Size).join(' + ') || '-'}
                        </TableCell>
                        <TableCell>{workstation.graphicscardID || '-'}</TableCell>

                        <TableCell>{workstation.inventoryID}</TableCell>
                        <TableCell>
                          <ActionTooltip label="Edit">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(workstation)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Scrap">
                            <Button variant="ghost" size="icon" onClick={() => handleScrapClick(workstation)}>
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


      <Dialog open={!!editingWorkstation} onOpenChange={(open) => !open && setEditingWorkstation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workstation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingWorkstation && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-Name">Brand</Label>
                    <Input
                      id="edit-Name"
                      value={editingWorkstation.Name || ""}
                      onChange={(e) => setEditingWorkstation({ ...editingWorkstation, Name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-Processor">Processor</Label>
                    <Input
                      id="edit-Processor"
                      value={editingWorkstation.Processor || ""}
                      onChange={(e) => setEditingWorkstation({ ...editingWorkstation, Processor: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-generation">generation</Label>
                    <Input
                      id="edit-generation"
                      value={editingWorkstation.generation || ""}
                      onChange={(e) => setEditingWorkstation({ ...editingWorkstation, generation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-serviceID">Service Tag</Label>
                    <Input
                      id="edit-serviceID"
                      value={editingWorkstation.serviceID || ""}
                      onChange={(e) => setEditingWorkstation({ ...editingWorkstation, serviceID: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pyramidsID">Pyramids ID</Label>
                    <Input
                      id="edit-pyramidsID"
                      value={editingWorkstation.pyramidsID || ""}
                      onChange={(e) => setEditingWorkstation({ ...editingWorkstation, pyramidsID: e.target.value })}
                    />
                  </div>
                </div>

                {/* --- COMPONENT MANAGEMENT --- */}

                {/* RAM */}
                <div className="border-t pt-4">
                  <Label className="mb-3 block text-lg font-medium">RAM ({assignedRams.length})</Label>
                  <div className="space-y-2 mb-4">
                    {assignedRams.map(item => (
                      <div key={getSafeId(item)} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border">
                        <div className="text-sm">
                          <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'size')} ({getValueIgnoreCase(item, 'type')}) - {getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRam(item)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Popover open={openRam} onOpenChange={setOpenRam}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openRam}
                          className="w-full justify-between font-normal"
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
                </div>

                {/* SSD */}
                <div className="border-t pt-4">
                  <Label className="mb-3 block text-lg font-medium">SSD ({assignedSSDs.length})</Label>
                  <div className="space-y-2 mb-4">
                    {assignedSSDs.map(item => (
                      <div key={getSafeId(item)} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border">
                        <div className="text-sm">
                          <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'ssdSize') || getValueIgnoreCase(item, 'size')} - {getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSSD(item)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Popover open={openSSD} onOpenChange={setOpenSSD}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openSSD}
                          className="w-full justify-between font-normal"
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
                </div>

                {/* NVMe */}
                <div className="border-t pt-4">
                  <Label className="mb-3 block text-lg font-medium">NVMe ({assignedNvmes.length})</Label>
                  <div className="space-y-2 mb-4">
                    {assignedNvmes.map(item => (
                      <div key={getSafeId(item)} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border">
                        <div className="text-sm">
                          <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'Size') || getValueIgnoreCase(item, 'size')} - {getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveNvme(item)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Popover open={openNvme} onOpenChange={setOpenNvme}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openNvme}
                          className="w-full justify-between font-normal"
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
                </div>

                {/* M.2 */}
                <div className="border-t pt-4">
                  <Label className="mb-3 block text-lg font-medium">M.2 ({assignedM2s.length})</Label>
                  <div className="space-y-2 mb-4">
                    {assignedM2s.map(item => (
                      <div key={getSafeId(item)} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border">
                        <div className="text-sm">
                          <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'size') || getValueIgnoreCase(item, 'Size')} ({getValueIgnoreCase(item, 'type')}) - {getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveM2(item)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Popover open={openM2} onOpenChange={setOpenM2}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openM2}
                          className="w-full justify-between font-normal"
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
                </div>

              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWorkstation(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScrapDialog
        isOpen={!!scrapItem}
        onClose={() => setScrapItem(null)}
        onConfirm={handleConfirmScrap}
        itemName={`Workstation ${scrapItem?.processor}`}
      />
    </div >
  )
}