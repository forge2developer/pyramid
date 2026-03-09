import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import api from "@/lib/axios"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Pencil, XCircle, Trash2 } from "lucide-react"
import { getAuthCookie } from "@/lib/auth"
import { ScrapDialog } from "@/components/common/scrap-dialog"
import { Switch } from "@/components/ui/switch"

interface Laptop {
  id: number
  brand: string
  model: string
  processor_brand: string
  processor_model: string
  generation: string
  ramID: string
  service_id: string
  brand_id: number
  company_id: number | null
  date_of_purchase: string
  adapter: string
  available: string | null
  moving: string | null
  phyramidID: string | null
  inventoryID: string | null
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

const ITEMS_PER_PAGE = 20

export default function LaptopInventory() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    processor: "",
    service_id: "",
    inventoryID: "",
    pyramidID: "",
    generation: "",
    isAvailable: false,
  })
  const [laptops, setLaptops] = useState<Laptop[]>([])
  const [ram, setRam] = useState<Laptop[]>([])
  const [ssd, setSSD] = useState<Laptop[]>([])
  const [Nvme, setNvme] = useState<Laptop[]>([])
  const [m2, setM2] = useState<any[]>([])
  const [laptopFilters, setLaptopsFilters] = useState<Laptop[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [brandOpen, setBrandOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [serviceIDOpen, setServiceIDOpen] = useState(false)
  const [inventoryIDOpen, setInventoryIDOpen] = useState(false)
  const [generationOpen, setGenerationOpen] = useState(false)

  const [editingLaptop, setEditingLaptop] = useState<Laptop | null>(null)
  const [scrapItem, setScrapItem] = useState<Laptop | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // RAM Management State
  const [availableRams, setAvailableRams] = useState<any[]>([])
  const [assignedRams, setAssignedRams] = useState<any[]>([])
  const [initialAssignedRams, setInitialAssignedRams] = useState<any[]>([])


  // SSD Management State
  const [availableSSDs, setAvailableSSDs] = useState<any[]>([])
  const [assignedSSDs, setAssignedSSDs] = useState<any[]>([])
  const [initialAssignedSSDs, setInitialAssignedSSDs] = useState<any[]>([])


  // NVMe Management State
  const [availableNvmes, setAvailableNvmes] = useState<any[]>([])
  const [assignedNvmes, setAssignedNvmes] = useState<any[]>([])
  const [initialAssignedNvmes, setInitialAssignedNvmes] = useState<any[]>([])


  // M.2 Management State
  const [availableM2s, setAvailableM2s] = useState<any[]>([])
  const [assignedM2s, setAssignedM2s] = useState<any[]>([])
  const [initialAssignedM2s, setInitialAssignedM2s] = useState<any[]>([])


  // Graphics Card Management State
  const [availableGpus, setAvailableGpus] = useState<any[]>([])
  const [assignedGpus, setAssignedGpus] = useState<any[]>([])
  const [initialAssignedGpus, setInitialAssignedGpus] = useState<any[]>([])

  const [gpuOptions, setGpuOptions] = useState<any[]>([])

  const [openRam, setOpenRam] = useState(false)
  const [openSSD, setOpenSSD] = useState(false)
  const [openNvme, setOpenNvme] = useState(false)
  const [openM2, setOpenM2] = useState(false)
  const [openGpu, setOpenGpu] = useState(false)

  // Helper to safely get ID regardless of case
  const getSafeId = (item: any) => item.id || item.ID || item.Id || item.iD;

  // Helper to get value case-insensitively
  const getValueIgnoreCase = (item: any, key: string) => {
    if (item[key] !== undefined && item[key] !== null) return item[key];
    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(item).find(k => k.toLowerCase() === lowerKey);
    if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) {
      return item[foundKey];
    }
    return undefined;
  };

  // Get unique models from laptops

  const fetchLaptops = async (_page: number = 1, searchData = formData) => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.post(`/inventory/getallLaptops?page=${_page}&limit=${ITEMS_PER_PAGE}`, searchData)
      console.log(data);

      const payload = {
        brand: "",
        size: "",
        type: "",
        service_id: "",
        pyramid_id: "",
        generation: "",
        isAvailable: false,
      }
      const datas = await api.post("/inventory/getAllRam?limit=10000", payload)
      setRam(datas.data.data.ram)

      const payloadSSD = {
        brand: "",
        size: "",
        service_tag: "",
        SerialNumber: "",
        isAvailable: false,
      }
      const dataSSD = await api.post("/inventory/getAllSSD?limit=10000", payloadSSD)
      console.log(dataSSD);
      setSSD(dataSSD.data.data.ssd)

      const payloadNvme = {
        brand: "",
        Size: "",
        serialNumber: "",
        serviceTag: "",
        isAvailable: false,
      }
      const dataNvme = await api.post("/inventory/getAllnvme?limit=10000", payloadNvme)
      console.log(dataNvme);

      setNvme(dataNvme.data.data.nvme)

      // Fetch M.2 data
      const payloadM2 = {
        brand: "",
        size: "",
        serialNumber: "",
        serviceTag: "",
        isAvailable: false,
      }
      const dataM2 = await api.post("/inventory/getAllM_2?limit=10000", payloadM2)
      console.log(dataM2);
      setM2(dataM2.data.data.m_2 || [])

      const payloadGpu = {
        brand: "",
        model: "",
        size: "",
        isAvailable: false,
      }
      const dataGpu = await api.post("/inventory/getallGraphicsCard?limit=10000", payloadGpu)
      setGpuOptions(dataGpu.data.data.graphicsCard || [])

      setLaptops(data.data.laptops)
      setLaptopsFilters(data.data.data)
      setPagination(data.data.pagination)
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    fetchLaptops(1, formData)
  }

  const handleReset = async () => {
    const emptyForm = {
      brand: "",
      model: "",
      processor: "",
      service_id: "",
      inventoryID: "",
      pyramidID: "",
      generation: "",
      isAvailable: false,
    }
    setFormData(emptyForm);
    fetchLaptops(1, emptyForm);
  }

  const handlePageChange = (page: number) => {
    fetchLaptops(page)
  }

  const handleEditClick = async (laptop: Laptop) => {
    setEditingLaptop(laptop)

    // RAM Management Initialization
    const laptopId = laptop.id;
    // Filter currently assigned RAMs for this laptop from the fetched 'ram' state
    const currentRams = ram.filter((r: any) => String(getValueIgnoreCase(r, 'laptopID')) === String(laptopId));

    setAssignedRams(currentRams);
    setInitialAssignedRams(currentRams);


    // Fetch all available RAMs
    try {
      const response = await api.post("/inventory/getAllRam?limit=10000", {
        brand: "",
        size: "",
        type: "",
        service_id: "",
        pyramid_id: "",
      });

      if (response.data && response.data.data) {
        const allRams = response.data.data.ram || [];
        // Filter for RAMs that are NOT assigned to any device
        const available = allRams.filter((r: any) =>
          !getValueIgnoreCase(r, 'laptopID') &&
          !getValueIgnoreCase(r, 'DesktopID') &&
          !getValueIgnoreCase(r, 'WorkstationID') &&
          !getValueIgnoreCase(r, 'laptop_id') &&
          !getValueIgnoreCase(r, 'desktop_id') &&
          !getValueIgnoreCase(r, 'workstation_id')
        );
        setAvailableRams(available);
      }
    } catch (error) {
      console.error("Failed to fetch available RAMs", error);
    }

    // SSD Management Initialization
    const currentSSDs = ssd.filter((s: any) => String(getValueIgnoreCase(s, 'laptopID')) === String(laptopId));
    setAssignedSSDs(currentSSDs);
    setInitialAssignedSSDs(currentSSDs);


    try {
      const response = await api.post("/inventory/getAllSSD?limit=10000", {
        brand: "",
        size: "",
        service_tag: "",
        SerialNumber: "",
        // isAvailable: false, // Do not filter by available here, fetching all to filter locally
      });
      if (response.data && response.data.data) {
        const allSSDs = response.data.data.ssd || [];
        const available = allSSDs.filter((s: any) =>
          !getValueIgnoreCase(s, 'laptopID') &&
          !getValueIgnoreCase(s, 'DesktopID') &&
          !getValueIgnoreCase(s, 'WorkstationID') &&
          !getValueIgnoreCase(s, 'laptop_id') &&
          !getValueIgnoreCase(s, 'desktop_id') &&
          !getValueIgnoreCase(s, 'workstation_id')
        );
        setAvailableSSDs(available);
      }
    } catch (error) {
      console.error("Failed to fetch available SSDs", error);
    }

    // NVMe Management Initialization
    const currentNvmes = Nvme.filter((n: any) => String(getValueIgnoreCase(n, 'laptopID')) === String(laptopId));
    setAssignedNvmes(currentNvmes);
    setInitialAssignedNvmes(currentNvmes);


    try {
      const payloadNvme = {
        brand: "",
        Size: "",
        serialNumber: "",
        serviceTag: "",

        // isAvailable: false,
      }
      const response = await api.post("/inventory/getAllnvme?limit=10000", payloadNvme);
      if (response.data && response.data.data) {
        const allNvmes = response.data.data.nvme || [];
        const available = allNvmes.filter((n: any) =>
          !getValueIgnoreCase(n, 'laptopID') &&
          !getValueIgnoreCase(n, 'DesktopID') &&
          !getValueIgnoreCase(n, 'WorkstationID') &&
          !getValueIgnoreCase(n, 'laptop_id') &&
          !getValueIgnoreCase(n, 'desktop_id') &&
          !getValueIgnoreCase(n, 'workstation_id')
        );
        setAvailableNvmes(available);
      }
    } catch (error) {
      console.error("Failed to fetch available NVMe", error);
    }

    // M.2 Management Initialization
    const currentM2s = m2.filter((m: any) => String(getValueIgnoreCase(m, 'laptopID')) === String(laptopId));
    setAssignedM2s(currentM2s);
    setInitialAssignedM2s(currentM2s);


    try {
      const payloadM2 = {
        brand: "",
        size: "",
        type: "",
        service_id: "",
        phyramidID: "",
        inventoryID: "",
        isAvailable: false,
      }
      const response = await api.post("/inventory/getAllM_2?limit=10000", payloadM2);
      if (response.data && response.data.data) {
        const allM2s = response.data.data.m_2 || response.data.data.data || [];
        const available = allM2s.filter((m: any) =>
          !getValueIgnoreCase(m, 'laptopID') &&
          !getValueIgnoreCase(m, 'DesktopID') &&
          !getValueIgnoreCase(m, 'WorkstationID') &&
          !getValueIgnoreCase(m, 'laptop_id') &&
          !getValueIgnoreCase(m, 'desktop_id') &&
          !getValueIgnoreCase(m, 'workstation_id')
        );
        setAvailableM2s(available);
      }
    } catch (error) {
      console.error("Failed to fetch available M.2", error);
    }

    // Graphics Card Management Initialization
    const currentGpus = gpuOptions.filter((g: any) => String(getValueIgnoreCase(g, 'laptopID')) === String(laptopId));
    setAssignedGpus(currentGpus);
    setInitialAssignedGpus(currentGpus);


    try {
      const response = await api.post("/inventory/getallGraphicsCard?limit=10000", {
        brand: "",
        model: "",
        size: "",
      });
      if (response.data && response.data.data) {
        const allGpus = response.data.data.graphicsCard || [];
        const available = allGpus.filter((g: any) =>
          !getValueIgnoreCase(g, 'laptopID') &&
          !getValueIgnoreCase(g, 'DesktopID') &&
          !getValueIgnoreCase(g, 'WorkstationID') &&
          !getValueIgnoreCase(g, 'laptop_id') &&
          !getValueIgnoreCase(g, 'desktop_id') &&
          !getValueIgnoreCase(g, 'workstation_id')
        );
        setAvailableGpus(available);
      }
    } catch (error) {
      console.error("Failed to fetch available GPUs", error);
    }
  }

  const handleAddRam = (ramId: string) => {
    const ramToAdd = availableRams.find(r => String(getSafeId(r)) === ramId);
    if (ramToAdd) {
      setAssignedRams(prev => [...prev, ramToAdd]);
      setAvailableRams(prev => prev.filter(r => String(getSafeId(r)) !== ramId));

    }
  }

  const handleRemoveRam = (ramItem: any) => {
    setAssignedRams(prev => prev.filter(r => getSafeId(r) !== getSafeId(ramItem)));
    setAvailableRams(prev => [...prev, ramItem]);
  }

  const handleAddSSD = (ssdId: string) => {
    const ssdToAdd = availableSSDs.find(s => String(getSafeId(s)) === ssdId);
    if (ssdToAdd) {
      setAssignedSSDs(prev => [...prev, ssdToAdd]);
      setAvailableSSDs(prev => prev.filter(s => String(getSafeId(s)) !== ssdId));

    }
  }

  const handleRemoveSSD = (ssdItem: any) => {
    setAssignedSSDs(prev => prev.filter(s => getSafeId(s) !== getSafeId(ssdItem)));
    setAvailableSSDs(prev => [...prev, ssdItem]);
  }

  const handleAddNvme = (nvmeId: string) => {
    const nvmeToAdd = availableNvmes.find(n => String(getSafeId(n)) === nvmeId);
    if (nvmeToAdd) {
      setAssignedNvmes(prev => [...prev, nvmeToAdd]);
      setAvailableNvmes(prev => prev.filter(n => String(getSafeId(n)) !== nvmeId));

    }
  }

  const handleRemoveNvme = (nvmeItem: any) => {
    setAssignedNvmes(prev => prev.filter(n => getSafeId(n) !== getSafeId(nvmeItem)));
    setAvailableNvmes(prev => [...prev, nvmeItem]);
  }

  const handleAddM2 = (m2Id: string) => {
    const m2ToAdd = availableM2s.find(m => String(getSafeId(m)) === m2Id);
    if (m2ToAdd) {
      setAssignedM2s(prev => [...prev, m2ToAdd]);
      setAvailableM2s(prev => prev.filter(m => String(getSafeId(m)) !== m2Id));

    }
  }

  const handleRemoveM2 = (m2Item: any) => {
    setAssignedM2s(prev => prev.filter(m => getSafeId(m) !== getSafeId(m2Item)));
    setAvailableM2s(prev => [...prev, m2Item]);
  }

  const handleAddGpu = (gpuId: string) => {
    const gpuToAdd = availableGpus.find(g => String(getSafeId(g)) === gpuId);
    if (gpuToAdd) {
      setAssignedGpus(prev => [...prev, gpuToAdd]);
      setAvailableGpus(prev => prev.filter(g => String(getSafeId(g)) !== gpuId));

    }
  }

  const handleRemoveGpu = (gpuItem: any) => {
    setAssignedGpus(prev => prev.filter(g => getSafeId(g) !== getSafeId(gpuItem)));
    setAvailableGpus(prev => [...prev, gpuItem]);
  }


  const handleSaveEdit = async () => {
    if (!editingLaptop) return

    try {
      setIsSaving(true)

      // Find added RAMs
      const addedRams = assignedRams.filter(r =>
        !initialAssignedRams.find(ir => getSafeId(ir) === getSafeId(r))
      );

      // Find removed RAMs
      const removedRams = initialAssignedRams.filter(ir =>
        !assignedRams.find(r => getSafeId(r) === getSafeId(ir))
      );

      const payload: any = { ...editingLaptop };
      // Backend expects product type identifier if reusing same endpoint structure or specific payload
      // Based on companyDetails logic for 'laptop':
      payload.product = 'laptop';

      if (addedRams.length > 0) {
        payload.addRam = addedRams;
      }

      if (removedRams.length > 0) {
        payload.removeRam = removedRams;
      }

      // Process SSDs
      const addedSSDs = assignedSSDs.filter(s => !initialAssignedSSDs.find(is => getSafeId(is) === getSafeId(s)));
      const removedSSDs = initialAssignedSSDs.filter(is => !assignedSSDs.find(s => getSafeId(s) === getSafeId(is)));

      if (addedSSDs.length > 0) payload.addSSD = addedSSDs;
      if (removedSSDs.length > 0) payload.removeSSD = removedSSDs;

      // Process Nvmes
      const addedNvmes = assignedNvmes.filter(n => !initialAssignedNvmes.find(in_ => getSafeId(in_) === getSafeId(n)));
      const removedNvmes = initialAssignedNvmes.filter(in_ => !assignedNvmes.find(n => getSafeId(n) === getSafeId(in_)));

      if (addedNvmes.length > 0) payload.addNvme = addedNvmes;
      if (removedNvmes.length > 0) payload.removeNvme = removedNvmes;

      // Process M.2
      const addedM2s = assignedM2s.filter(m => !initialAssignedM2s.find(im => getSafeId(im) === getSafeId(m)));
      const removedM2s = initialAssignedM2s.filter(im => !assignedM2s.find(m => getSafeId(m) === getSafeId(im)));

      if (addedM2s.length > 0) payload.addM2 = addedM2s;
      if (removedM2s.length > 0) payload.removeM2 = removedM2s;

      // Process Graphics Cards
      const addedGpus = assignedGpus.filter(g => !initialAssignedGpus.find(ig => getSafeId(ig) === getSafeId(g)));
      const removedGpus = initialAssignedGpus.filter(ig => !assignedGpus.find(g => getSafeId(g) === getSafeId(ig)));

      if (addedGpus.length > 0) payload.addGraphicsCard = addedGpus;
      if (removedGpus.length > 0) payload.removeGraphicsCard = removedGpus;

      console.log("Saving Laptop", payload);
      // NOTE: verify endpoint name from companyDetails; it uses getApiUrl -> 'editLaptops'
      const { data } = await api.post("/inventory/editLaptops", payload)

      if (data.success || data.data?.success) { // adjust check based on actual response structure
        toast.success("Laptop updated successfully");
        setEditingLaptop(null)
        fetchLaptops(pagination.currentPage)

      } else {
        toast.error(data.message || "Failed to update laptop")
      }
    } catch (err: any) {
      console.error("Failed to update laptop:", err)
      toast.error(err.response?.data?.message || "Error updating laptop")
    } finally {
      setIsSaving(false)
    }
  }

  const handleScrapClick = (laptop: Laptop) => {
    setScrapItem(laptop)
  }

  const handleConfirmScrap = async (reason: string) => {
    if (!scrapItem) return
    const user = getAuthCookie()
    // @ts-ignore
    const userId = user?.id || null

    try {
      const payload = {
        producedID: scrapItem.id,
        produced: 'laptop',
        log: reason,
        CompanyID: scrapItem.company_id || null,
        // @ts-ignore
        inventoryID: scrapItem.inventoryID || null,
        userID: userId
      }

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

  // Get unique Brand from Monitor
  const uniquebrand = [...new Set(laptopFilters?.map((monitor: any) => monitor.brand).filter(Boolean))]

  // Get unique Model from Monitor
  const uniquemodel = [...new Set(laptopFilters?.map((monitor: any) => monitor.model).filter(Boolean))]

  // Get unique inventoryID from Monitor
  const uniqueinventoryID = [...new Set(laptopFilters?.map((monitor: any) => monitor.inventoryID).filter(Boolean))]



  // Get unique Service Tag from Monitor
  const uniqueserviceid = [...new Set(laptopFilters?.map((monitor: any) => monitor.service_id).filter(Boolean))]



  // Get unique Generation
  const uniqueGeneration = [...new Set(laptopFilters?.map((l: any) => l.generation).filter(Boolean))]

  return (
    <div className="flex flex-col gap-3">

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                        {uniquebrand.map((brand: any) => (
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
              <Label htmlFor="model">Model</Label>
              <Popover open={modelOpen} onOpenChange={setModelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={modelOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.model || "Select model..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search model..." />
                    <CommandList>
                      <CommandEmpty>No model found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            handleSelectChange("model", "")
                            setModelOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.model === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {uniquemodel.map((model: any) => (
                          <CommandItem
                            key={model}
                            value={model}
                            onSelect={() => {
                              handleSelectChange("model", model)
                              setModelOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.model === model ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {model}
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
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={generationOpen}
                    className="w-full justify-between font-normal"
                  >
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
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            handleSelectChange("generation", "")
                            setGenerationOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.generation === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {uniqueGeneration.map((gen: any) => (
                          <CommandItem
                            key={gen}
                            value={gen}
                            onSelect={() => {
                              handleSelectChange("generation", gen)
                              setGenerationOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.generation === gen ? "opacity-100" : "opacity-0"
                              )}
                            />
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
              <Label htmlFor="pyramidID">Pyramid ID</Label>
              <Input
                id="pyramidID"
                placeholder="Search Pyramid ID..."
                value={formData.pyramidID}
                onChange={(e) => handleSelectChange("pyramidID", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_id">ServiceId</Label>
              <Popover open={serviceIDOpen} onOpenChange={setServiceIDOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={serviceIDOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.service_id || "Select Delivery Company..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Delivery Company..." />
                    <CommandList>
                      <CommandEmpty>No Delivery Company found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            handleSelectChange("service_id", "")
                            setServiceIDOpen(false)
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
                        {uniqueserviceid.map((service_id: any) => (
                          <CommandItem
                            key={service_id}
                            value={service_id}
                            onSelect={() => {
                              handleSelectChange("service_id", service_id)
                              setServiceIDOpen(false)
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
              <Label htmlFor="inventoryID">Inventory ID</Label>
              <Popover open={inventoryIDOpen} onOpenChange={setInventoryIDOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={inventoryIDOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.inventoryID || "Select Delivery Company..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Delivery Company..." />
                    <CommandList>
                      <CommandEmpty>No Delivery Company found.</CommandEmpty>
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
                        {uniqueinventoryID.map((inventoryID: any) => (
                          <CommandItem
                            key={inventoryID}
                            value={inventoryID}
                            onSelect={() => {
                              handleSelectChange("inventoryID", inventoryID)
                              setInventoryIDOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.inventoryID === inventoryID ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {inventoryID}
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
                    const newFormData = { ...formData, isAvailable: checked };
                    setFormData(newFormData);
                    api.post("/inventory/getallLaptops", newFormData)
                      .then(({ data }) => {
                        setLaptops(data.data.laptops);
                        setLaptopsFilters(data.data.data);
                        setPagination(data.data.pagination);
                      })
                      .catch(err => {
                        setError("Failed to fetch inventory data");
                        console.error(err);
                      })
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

      {/* Inventory Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        {error ? (
          <div className="p-8 text-center text-destructive">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Pyramid ID</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead>Generation</TableHead>
                    <TableHead>Service Tag</TableHead>
                    <TableHead>RAM</TableHead>
                    <TableHead>SSD</TableHead>
                    <TableHead>NVMe</TableHead>
                    <TableHead>M.2</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laptops.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No laptops found
                      </TableCell>
                    </TableRow>
                  ) : (
                    laptops.map((laptop: any, index: number) => (
                      <TableRow key={laptop.id}>
                        <TableCell className="font-medium">{(pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>{laptop.phyramidID || '-'}</TableCell>
                        <TableCell
                          className="cursor-pointer hover:underline text-blue-600"
                          onClick={() => navigate(`/Inventory/Laptop/${laptop.id}`)}
                        >
                          {laptop.brand}
                          <div className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2",
                            laptop.available === "1" || laptop.available === "true" || laptop.available === "yes" || laptop.isAvailable
                              ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                              : "bg-red-100 text-red-800 hover:bg-red-100/80"
                          )}>
                            {laptop.available === "1" || laptop.available === "true" || laptop.available === "yes" || laptop.isAvailable ? "Available" : "Moving"}
                          </div></TableCell>

                        <TableCell>{laptop.model}</TableCell>
                        <TableCell>{laptop.processor_brand} {laptop.processor_model}</TableCell>
                        <TableCell>{laptop.generation}</TableCell>
                        <TableCell>{laptop.service_id}</TableCell>
                        <TableCell>
                          {ram?.some((ramItem: any) => ramItem.laptopID === laptop.id)
                            ? ram
                              .filter((ramItem: any) => ramItem.laptopID === laptop.id)
                              .map((ram: any) => ram.size)
                              .join(' + ')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {ssd?.some((ssdItem: any) => ssdItem.laptopID === laptop.id)
                            ? ssd
                              .filter((ssdItem: any) => ssdItem.laptopID === laptop.id)
                              .map((ssd: any) => ssd.ssdSize)
                              .join(' + ')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {Nvme?.some((nvmeItem: any) => nvmeItem.laptopID === laptop.id)
                            ? Nvme
                              .filter((nvmeItem: any) => nvmeItem.laptopID === laptop.id)
                              .map((nvme: any) => nvme.Size)
                              .join(' + ')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {m2?.some((m2Item: any) => m2Item.laptopID === laptop.id)
                            ? m2
                              .filter((m2Item: any) => m2Item.laptopID === laptop.id)
                              .map((item: any) => item.size || item.Size)
                              .join(' + ')
                            : '-'}
                        </TableCell>

                        <TableCell className="flex gap-2">
                          <ActionTooltip label="Edit">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(laptop)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Scrap">
                            <Button variant="ghost" size="icon" onClick={() => handleScrapClick(laptop)}>
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

      <Dialog open={!!editingLaptop} onOpenChange={(open) => !open && setEditingLaptop(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Laptop</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto px-1">
            {editingLaptop && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Brand</Label>
                    <Input
                      id="edit-brand"
                      value={editingLaptop.brand}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-model">Model</Label>
                    <Input
                      id="edit-model"
                      value={editingLaptop.model}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, model: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-proc-brand">Processor Brand</Label>
                    <Input
                      id="edit-proc-brand"
                      value={editingLaptop.processor_brand}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, processor_brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-proc-model">Processor Model</Label>
                    <Input
                      id="edit-proc-model"
                      value={editingLaptop.processor_model}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, processor_model: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-generation">Generation</Label>
                    <Input
                      id="edit-generation"
                      value={editingLaptop.generation}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, generation: e.target.value })}
                    />
                  </div>
                </div>
                {/* NEW FIELDS START */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pyramid-id">Pyramid ID</Label>
                    <Input
                      id="edit-pyramid-id"
                      value={editingLaptop.phyramidID || ''}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, phyramidID: e.target.value })}
                      placeholder="Enter Pyramid ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-service-id">Service Tag</Label>
                    <Input
                      id="edit-service-id"
                      value={editingLaptop.service_id || ''}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, service_id: e.target.value })}
                      placeholder="Enter Service Tag"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-inventory-id">Inventory ID</Label>
                    <Input
                      id="edit-inventory-id"
                      value={editingLaptop.inventoryID || ''}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, inventoryID: e.target.value })}
                      placeholder="Enter Inventory ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-adapter">Adapter</Label>
                    <Input
                      id="edit-adapter"
                      value={editingLaptop.adapter || ''}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, adapter: e.target.value })}
                      placeholder="Enter Adapter"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-dop">Date of Purchase</Label>
                    <Input
                      id="edit-dop"
                      type="date"
                      value={editingLaptop.date_of_purchase ? new Date(editingLaptop.date_of_purchase).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingLaptop({ ...editingLaptop, date_of_purchase: e.target.value })}
                    />
                  </div>
                </div>
                {/* NEW FIELDS END */}
                {/* RAM Management Section */}
                <Card className="border-slate-200 shadow-sm mt-4">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center uppercase tracking-tight">
                      RAM Components
                      <span className="text-[10px] font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border">{assignedRams.length} Assigned</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {assignedRams.map((ram) => (
                        <div key={getSafeId(ram)} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold">{getValueIgnoreCase(ram, 'brand')}</span> {getValueIgnoreCase(ram, 'size')} ({getValueIgnoreCase(ram, 'type')}) - <span className="text-muted-foreground font-mono">{getValueIgnoreCase(ram, 'phyramidID') || getValueIgnoreCase(ram, 'pyramidsID') || getValueIgnoreCase(ram, 'PyramidID') || getValueIgnoreCase(ram, 'pyramid_id') || getValueIgnoreCase(ram, 'service_id') || getValueIgnoreCase(ram, 'serviceTag') || getValueIgnoreCase(ram, 'serviceID') || getValueIgnoreCase(ram, 'service_tag') || 'N/A'}</span>
                          </div>
                          <ActionTooltip label="Remove RAM">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive opacity-70 group-hover:opacity-100 hover:bg-red-50 transition-all"
                              onClick={() => handleRemoveRam(ram)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      ))}
                      {assignedRams.length === 0 && (
                        <p className="text-xs text-center p-4 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed italic">
                          No RAM assigned to this Laptop
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block px-0.5">Add RAM</Label>
                      <Popover open={openRam} onOpenChange={setOpenRam}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openRam}
                            className="w-full justify-between h-9 text-xs border-slate-200 focus:ring-blue-500 font-normal"
                          >
                            Select RAM to add...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search RAM..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No available RAM found</CommandEmpty>
                              <CommandGroup>
                                {availableRams.map((ram) => {
                                  const label = `${getValueIgnoreCase(ram, 'brand')} ${getValueIgnoreCase(ram, 'size')} - ${getValueIgnoreCase(ram, 'type')} (ID: ${getValueIgnoreCase(ram, 'phyramidID') || getValueIgnoreCase(ram, 'pyramidsID') || getValueIgnoreCase(ram, 'PyramidID') || getValueIgnoreCase(ram, 'pyramid_id') || getValueIgnoreCase(ram, 'service_id') || getValueIgnoreCase(ram, 'serviceTag') || getValueIgnoreCase(ram, 'serviceID') || getValueIgnoreCase(ram, 'service_tag') || 'N/A'})`;
                                  return (
                                    <CommandItem
                                      key={getSafeId(ram)}
                                      value={label}
                                      onSelect={() => {
                                        const val = String(getSafeId(ram));

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

                {/* SSD Management Section */}
                <Card className="border-slate-200 shadow-sm mt-4">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center uppercase tracking-tight">
                      SSD Components
                      <span className="text-[10px] font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border">{assignedSSDs.length} Assigned</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {assignedSSDs.map((item) => (
                        <div key={getSafeId(item)} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'ssdSize') || getValueIgnoreCase(item, 'size') || getValueIgnoreCase(item, 'Size')} - <span className="text-muted-foreground font-mono">{getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}</span>
                          </div>
                          <ActionTooltip label="Remove SSD">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive opacity-70 group-hover:opacity-100 hover:bg-red-50 transition-all"
                              onClick={() => handleRemoveSSD(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      ))}
                      {assignedSSDs.length === 0 && (
                        <p className="text-xs text-center p-4 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed italic">
                          No SSD assigned to this Laptop
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block px-0.5">Add SSD</Label>
                      <Popover open={openSSD} onOpenChange={setOpenSSD}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openSSD}
                            className="w-full justify-between h-9 text-xs border-slate-200 focus:ring-blue-500 font-normal"
                          >
                            Select SSD to add...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search SSD..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No available SSD found</CommandEmpty>
                              <CommandGroup>
                                {availableSSDs.map((item) => {
                                  const label = `${getValueIgnoreCase(item, 'brand')} ${getValueIgnoreCase(item, 'ssdSize') || getValueIgnoreCase(item, 'size') || getValueIgnoreCase(item, 'Size')} (ID: ${getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'})`;
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

                {/* NVMe Management Section */}
                <Card className="border-slate-200 shadow-sm mt-4">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center uppercase tracking-tight">
                      NVMe Components
                      <span className="text-[10px] font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border">{assignedNvmes.length} Assigned</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {assignedNvmes.map((item) => (
                        <div key={getSafeId(item)} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'Size') || getValueIgnoreCase(item, 'size')} - <span className="text-muted-foreground font-mono">{getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}</span>
                          </div>
                          <ActionTooltip label="Remove NVMe">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive opacity-70 group-hover:opacity-100 hover:bg-red-50 transition-all"
                              onClick={() => handleRemoveNvme(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      ))}
                      {assignedNvmes.length === 0 && (
                        <p className="text-xs text-center p-4 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed italic">
                          No NVMe assigned to this Laptop
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block px-0.5">Add NVMe</Label>
                      <Popover open={openNvme} onOpenChange={setOpenNvme}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openNvme}
                            className="w-full justify-between h-9 text-xs border-slate-200 focus:ring-blue-500 font-normal"
                          >
                            Select NVMe to add...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search NVMe..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No available NVMe found</CommandEmpty>
                              <CommandGroup>
                                {availableNvmes.map((item) => {
                                  const label = `${getValueIgnoreCase(item, 'brand')} ${getValueIgnoreCase(item, 'Size') || getValueIgnoreCase(item, 'size')} (ID: ${getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'})`;
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

                {/* M.2 Management Section */}
                <Card className="border-slate-200 shadow-sm mt-4">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center uppercase tracking-tight">
                      M.2 Components
                      <span className="text-[10px] font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border">{assignedM2s.length} Assigned</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {assignedM2s.map((item) => (
                        <div key={getSafeId(item)} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'size') || getValueIgnoreCase(item, 'Size')} ({getValueIgnoreCase(item, 'type')}) - <span className="text-muted-foreground font-mono">{getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}</span>
                          </div>
                          <ActionTooltip label="Remove M.2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive opacity-70 group-hover:opacity-100 hover:bg-red-50 transition-all"
                              onClick={() => handleRemoveM2(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      ))}
                      {assignedM2s.length === 0 && (
                        <p className="text-xs text-center p-4 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed italic">
                          No M.2 assigned to this Laptop
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block px-0.5">Add M.2</Label>
                      <Popover open={openM2} onOpenChange={setOpenM2}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openM2}
                            className="w-full justify-between h-9 text-xs border-slate-200 focus:ring-blue-500 font-normal"
                          >
                            Select M.2 to add...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search M.2..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No available M.2 found</CommandEmpty>
                              <CommandGroup>
                                {availableM2s.map((item) => {
                                  const label = `${getValueIgnoreCase(item, 'brand')} ${getValueIgnoreCase(item, 'size') || getValueIgnoreCase(item, 'Size')} - ${getValueIgnoreCase(item, 'type')} (ID: ${getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'})`;
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

                {/* Graphics Card Management Section */}
                <Card className="border-slate-200 shadow-sm mt-4">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center uppercase tracking-tight">
                      Graphics Card Components
                      <span className="text-[10px] font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border">{assignedGpus.length} Assigned</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {assignedGpus.map((item) => (
                        <div key={getSafeId(item)} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span> {getValueIgnoreCase(item, 'model')} ({getValueIgnoreCase(item, 'size')}) - <span className="text-muted-foreground font-mono">{getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'}</span>
                          </div>
                          <ActionTooltip label="Remove Graphics Card">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive opacity-70 group-hover:opacity-100 hover:bg-red-50 transition-all"
                              onClick={() => handleRemoveGpu(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      ))}
                      {assignedGpus.length === 0 && (
                        <p className="text-xs text-center p-4 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed italic">
                          No Graphics Card assigned to this Laptop
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block px-0.5">Add Graphics Card</Label>
                      <Popover open={openGpu} onOpenChange={setOpenGpu}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openGpu}
                            className="w-full justify-between h-9 text-xs border-slate-200 focus:ring-blue-500 font-normal"
                          >
                            Select Graphics Card to add...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search Graphics Card..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No available Graphics Card found</CommandEmpty>
                              <CommandGroup>
                                {availableGpus.map((item) => {
                                  const label = `${getValueIgnoreCase(item, 'brand')} ${getValueIgnoreCase(item, 'model')} (${getValueIgnoreCase(item, 'size')}) (ID: ${getValueIgnoreCase(item, 'phyramidID') || getValueIgnoreCase(item, 'pyramidsID') || getValueIgnoreCase(item, 'PyramidID') || getValueIgnoreCase(item, 'pyramid_id') || getValueIgnoreCase(item, 'service_id') || getValueIgnoreCase(item, 'serviceTag') || getValueIgnoreCase(item, 'serviceID') || getValueIgnoreCase(item, 'service_tag') || 'N/A'})`;
                                  return (
                                    <CommandItem
                                      key={getSafeId(item)}
                                      value={label}
                                      onSelect={() => {
                                        const val = String(getSafeId(item));
                                        handleAddGpu(val);
                                        setOpenGpu(false);
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
            <Button variant="outline" onClick={() => setEditingLaptop(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScrapDialog
        isOpen={!!scrapItem}
        onClose={() => setScrapItem(null)}
        onConfirm={handleConfirmScrap}
        itemName={`Laptop ${scrapItem?.brand} ${scrapItem?.model}`}
      />
    </div>
  )
}   