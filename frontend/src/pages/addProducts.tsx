import { useState } from "react"
import { toast } from "sonner"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Check, ChevronsUpDown, Plus, Minus, MemoryStick, HardDrive } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { BulkUpload, type ProductCategory } from "@/components/inventory/BulkUpload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"



export default function AddProducts() {
  const [activeTab, setActiveTab] = useState<ProductCategory>("laptop");
  // Laptop form data
  const [laptopFormData, setLaptopFormData] = useState({
    brand: "",
    model: "",
    processor_brand: "",
    processor_model: "",
    generation: "",
    ramIDs: [] as string[],
    ssdIDs: [] as string[],
    nvmeIDs: [] as string[],
    m2IDs: [] as string[],
    graphicscardIDs: [] as string[],
    service_id: "",
    company_id: "",
    date_of_purchase: "",
    adapter: "",
    phyramidID: "",
    moving: "",
    count: "1"
  })

  const [ramOptions, setRamOptions] = useState<any[]>([]);
  const [ssdOptions, setSsdOptions] = useState<any[]>([])
  const [nvmeOptions, setNvmeOptions] = useState<any[]>([])
  const [m2Options, setM2Options] = useState<any[]>([]);
  // Popover open states

  // Storage & Other Popovers (kept for non-component dropdowns)
  const [gpuOptions, setGpuOptions] = useState<any[]>([])
  const [componentRefreshKey, setComponentRefreshKey] = useState(0)

  // Fetch component options
  useEffect(() => {
    if (activeTab === 'laptop' || activeTab === 'desktop' || activeTab === 'workstation' || activeTab === 'mobile_workstation') {
      const fetchComponents = async () => {
        try {
          // Fetch RAM
          const ramPayload: any = { isAvailable: 1 };
          if (activeTab === 'laptop' || activeTab === 'mobile_workstation') ramPayload.form_factor = 'Laptop';
          if (activeTab === 'desktop' || activeTab === 'workstation') ramPayload.form_factor = 'Desktop';

          const resRam = await api.post('/inventory/getAllRam?limit=10000', ramPayload);
          if (resRam.data.success) {
            setRamOptions(resRam.data.data.ram);
          }
        } catch (e) { console.error("Failed to fetch RAM", e); }


        if (activeTab === 'laptop' || activeTab === 'desktop' || activeTab === 'workstation' || activeTab === 'mobile_workstation') {
          try {
            // Fetch SSD
            const resSSD = await api.post('/inventory/getAllSSD?limit=10000', { isAvailable: 1 });
            if (resSSD.data.success) setSsdOptions(resSSD.data.data.ssd);

            // Fetch NVMe
            const resNVMe = await api.post('/inventory/getAllNVMe?limit=10000', { isAvailable: 1 });
            if (resNVMe.data.success) setNvmeOptions(resNVMe.data.data.nvme);

            // Fetch M.2
            const resM2 = await api.post('/inventory/getAllM_2?limit=10000', { isAvailable: 1 });
            if (resM2.data.success) setM2Options(resM2.data.data.m_2);

            // Fetch Graphics Cards
            const resGpu = await api.post('/inventory/getallGraphicsCard?limit=10000', { isAvailable: 1 });
            if (resGpu.data.success) setGpuOptions(resGpu.data.data.graphicsCard);
          } catch (e) { console.error("Failed to fetch storage components", e); }
        }
      };
      fetchComponents();
    }
  }, [activeTab, componentRefreshKey]);



  const [isBulk, setIsBulk] = useState(false)

  // RAM form data
  const [ramFormData, setRamFormData] = useState({
    brand: "",
    size: "",
    type: "",
    form_factor: "",
    service_id: "",
    pyramid_id: "",
    date_of_purchase: "",
    count: "1"
  })

  // SSD form data
  const [ssdFormData, setssdFormData] = useState({
    brand: "",
    ssdSize: "",
    speed: "",
    SerialNumber: "",
    serviceTag: "",
    warrantyEndDate: "",
    dateOfPurchase: "",
    phyramidID: "",
    count: "1"
  })

  // NVMe form data
  const [nvmeFormData, setNvmeFormData] = useState({
    brand: "",
    Size: "",
    speed: "",
    serialNumber: "",
    serviceTag: "",
    warrantyEndDate: "",
    dateOfPurchase: "",
    phyramidID: "",
    inventoryID: "",
    count: "1"
  })

  // Monitor form data
  const [monitorFormData, setMonitorFormData] = useState({
    name: "",
    size: "",
    display: "",
    service_tag: "",
    pyramid_id: "",
    date_of_purchase: "",
    warranty_date: "",
    count: "1"
  })

  // HDD form data
  const [hddFormData, setHddFormData] = useState({
    brand: "",
    size: "",
    speed: "",
    serialNumber: "",
    serviceTag: "",
    warrantyEndDate: "",
    dateOfPurchase: "",
    phyramidID: "",
    inventoryID: "",
    count: "1"
  })

  // System form data
  const [systemFormData, setSystemFormData] = useState({
    Name: "",
    Processor: "",
    Generation: "",
    ramIDs: [] as string[],
    ssdIDs: [] as string[],
    nvmeIDs: [] as string[],
    m2IDs: [] as string[],
    graphicscardIDs: [] as string[],
    serviceID: "",
    pyramidsID: "",
    dateOfPurchase: "",
    count: "1"
  })

  // Workstation form data
  const [workstationFormData, setWorkstationFormData] = useState({
    Name: "",
    Processor: "",
    Generation: "",
    ramIDs: [] as string[],
    ssdIDs: [] as string[],
    nvmeIDs: [] as string[],
    m2IDs: [] as string[],
    graphicscardIDs: [] as string[],
    serviceID: "",
    pyramidsID: "",
    dateOfPurchase: "",
    count: "1"
  })

  // Workstation Form Component Popover States
  const [formFactorOpen, setFormFactorOpen] = useState(false)
  const [graphicsCardFormData, setGraphicsCardFormData] = useState({
    brand: "",
    model: "",
    size: "",
    generation: "",
    serviceNumber: "",
    serviceTag: "",
    phyramidID: "",
    warrantyEndDate: "",
    dateOfPurchase: "",
    count: "1"
  })

  // Mobile Workstation form data
  // Mobile Workstation form data
  const [mobileWorkstationFormData, setMobileWorkstationFormData] = useState({
    brand: "",
    model: "",
    processor_brand: "",
    processor_model: "",
    generation: "",
    ramIDs: [] as string[],
    ssdIDs: [] as string[],
    nvmeIDs: [] as string[],
    m2IDs: [] as string[],
    graphicscardID: "",
    adapter: "",
    serviceTag: "", // Mapped to service_id in backend
    pyramidsID: "", // Mapped to phyramidID in backend
    warrantyEndDate: "",
    dateOfPurchase: "",
    count: "1"
  })

  // M.2 form data
  const [m2FormData, setM2FormData] = useState({
    brand: "",
    size: "",
    type: "",
    formFactor: "Laptop",
    service_id: "",
    phyramidID: "",
    dateOfPurchase: "",
    inventoryID: "",
    count: "1"
  })

  // Inventory Selection state
  const [inventories, setInventories] = useState<{ id: number; name: string }[]>([])
  const [selectedInventory, setSelectedInventory] = useState<string>("")

  // Fetch inventories on mount
  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const response = await api.get('/inventory/inventories');
        if (response.data.success) {
          setInventories(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch inventories:", error);
        toast.error("Failed to fetch inventories");
      }
    };
    fetchInventories();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false)



  const [error, setError] = useState<string | null>(null)



  // Handle laptop input change
  const handleLaptopInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLaptopFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle RAM input change
  const handleRamInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRamFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle SSD input change
  const handleSsdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setssdFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle SSD input change
  const handleNvmeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNvmeFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle SSD input change
  const handleMonitorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setMonitorFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle HDD input change
  const handleHddInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setHddFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Desktop input change
  const handleSystemInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSystemFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Workstation input change
  const handleWorkstationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setWorkstationFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Workstation input change
  const handleGraphicsCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGraphicsCardFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Mobile Workstation input change
  const handleMobileWorkstationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setMobileWorkstationFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle M.2 input change
  const handleM2InputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setM2FormData((prev) => ({ ...prev, [name]: value }))
  }



  const handleLaptopSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!selectedInventory) {
        toast.error("Please select an inventory");
        setIsSubmitting(false);
        return;
      }
      if (isBulk) {
        // Bulk Mode Logic
        const serviceIds = laptopFormData.service_id.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const phyramidIds = laptopFormData.phyramidID ? laptopFormData.phyramidID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (serviceIds.length === 0) {
          throw new Error("Please enter at least one Service Tag");
        }

        const expectedCount = parseInt(laptopFormData.count || "0", 10);
        if (serviceIds.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${serviceIds.length} Service Tag(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        if (phyramidIds.length > 0 && serviceIds.length !== phyramidIds.length) {
          throw new Error(`Count mismatch: ${serviceIds.length} Service Tags vs ${phyramidIds.length} Phyramid IDs`);
        }

        const bulkPayload = serviceIds.map((id, index) => ({
          ...laptopFormData,
          service_id: id,
          phyramidID: phyramidIds[index] || "", // Use corresponding ID or empty if none provided/needed logic
          count: "1", // Force count to 1 for individual item creation
          inventoryID: selectedInventory || null
        }));

        await api.post("/inventory/addLaptops", bulkPayload);
        toast.success(`Successfully added all ${serviceIds.length} laptops`);
        handleLaptopReset();

      } else {
        // Single Mode Logic
        const payload = {
          ...laptopFormData,
          count: laptopFormData.count || "1",
          inventoryID: selectedInventory || null
        }
        await api.post("/inventory/addLaptops", payload)
        toast.success("Laptop added successfully");
        handleLaptopReset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to add laptop")
      // setError(`Failed to add laptop. ${err.message || err}`) // Removed in favor of toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const serviceIds = systemFormData.serviceID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const pyramidIds = systemFormData.pyramidsID ? systemFormData.pyramidsID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (serviceIds.length === 0) {
          throw new Error("Please enter at least one Service Tag");
        }

        const expectedCount = parseInt(systemFormData.count || "0", 10);
        if (serviceIds.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${serviceIds.length} Service Tag(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        // System PyramidsID is required
        if (serviceIds.length !== pyramidIds.length) {
          throw new Error(`Count mismatch: Quantity ${expectedCount} requires ${expectedCount} Pyramid IDs, but found ${pyramidIds.length}.`);
        }

        const bulkPayload = serviceIds.map((id, index) => ({
          ...systemFormData,
          serviceID: id,
          pyramidsID: pyramidIds[index],
          count: "1",
          inventoryID: selectedInventory || null
        }));

        await api.post("/inventory/addDesktop", bulkPayload);
        toast.success(`Successfully added all ${serviceIds.length} systems`);
        handleSystemReset();
      } else {
        await api.post("/inventory/addDesktop", { ...systemFormData, inventoryID: selectedInventory || null })
        toast.success("System added successfully")
        handleSystemReset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.message || `Failed to add Desktop. ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const serviceIds = ramFormData.service_id.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const pyramidIds = ramFormData.pyramid_id ? ramFormData.pyramid_id.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (serviceIds.length === 0) {
          throw new Error("Please enter at least one Service Tag");
        }

        const expectedCount = parseInt(ramFormData.count || "0", 10);
        if (serviceIds.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${serviceIds.length} Service Tag(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        // RAM Pyramid ID is required
        if (serviceIds.length !== pyramidIds.length) {
          throw new Error(`Count mismatch: Quantity ${expectedCount} requires ${expectedCount} Pyramid IDs, but found ${pyramidIds.length}.`);
        }

        const bulkPayload = serviceIds.map((id, index) => ({
          ...ramFormData,
          service_id: id,
          pyramid_id: pyramidIds[index],
          count: "1",
          inventoryID: selectedInventory || null
        }));

        await api.post("/inventory/addRam", bulkPayload);
        toast.success(`Successfully added all ${serviceIds.length} RAM sticks`);
        handleRamReset();
      } else {
        await api.post("/inventory/addRam", { ...ramFormData, inventoryID: selectedInventory || null })
        toast.success("RAM added successfully")
        handleRamReset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.message || `Failed to add RAM. ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSsdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const serials = ssdFormData.SerialNumber.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const tags = ssdFormData.serviceTag ? ssdFormData.serviceTag.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];
        const pyramidIds = ssdFormData.phyramidID ? ssdFormData.phyramidID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        // Note: Serial Numbers are not explicitly marked as required in the form (<Input required> is missing for SerialNumber in original),
        // but typically at least one unique identifier is needed. Assuming SerialNumber is the key.
        if (serials.length === 0) {
          throw new Error("Please enter at least one Serial Number");
        }

        const expectedCount = parseInt(ssdFormData.count || "0", 10);
        if (serials.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${serials.length} Serial Number(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        if (tags.length > 0 && serials.length !== tags.length) {
          throw new Error(`Count mismatch: ${serials.length} Serial Numbers vs ${tags.length} Service Tags`);
        }

        if (pyramidIds.length > 0 && serials.length !== pyramidIds.length) {
          throw new Error(`Count mismatch: ${serials.length} Serial Numbers vs ${pyramidIds.length} Pyramid IDs`);
        }

        const bulkPayload = serials.map((sn, index) => ({
          ...ssdFormData,
          SerialNumber: sn,
          serviceTag: tags[index] || "",
          phyramidID: pyramidIds[index] || "",
          count: "1",
          inventoryID: selectedInventory || null
        }));

        await api.post("/inventory/addSSD", bulkPayload);
        toast.success(`Successfully added all ${serials.length} SSDs`);
        handleSSDReset();
      } else {
        await api.post("/inventory/addSSD", { ...ssdFormData, inventoryID: selectedInventory || null })
        toast.success("SSD added successfully")
        handleSSDReset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to add SSD")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNvmeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const serials = nvmeFormData.serialNumber.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const tags = nvmeFormData.serviceTag ? nvmeFormData.serviceTag.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];
        const pyramidIds = nvmeFormData.phyramidID ? nvmeFormData.phyramidID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (serials.length === 0) {
          throw new Error("Please enter at least one Serial Number");
        }

        const expectedCount = parseInt(nvmeFormData.count || "0", 10);
        if (serials.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${serials.length} Serial Number(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        if (tags.length > 0 && serials.length !== tags.length) {
          throw new Error(`Count mismatch: ${serials.length} Serial Numbers vs ${tags.length} Service Tags`);
        }

        if (pyramidIds.length > 0 && serials.length !== pyramidIds.length) {
          throw new Error(`Count mismatch: ${serials.length} Serial Numbers vs ${pyramidIds.length} Pyramid IDs`);
        }

        const bulkPayload = serials.map((sn, index) => ({
          ...nvmeFormData,
          serialNumber: sn,
          serviceTag: tags[index] || "",
          phyramidID: pyramidIds[index] || "",
          count: "1",
          inventoryID: nvmeFormData.inventoryID || selectedInventory || null
        }));

        await api.post("/inventory/addNVMe", bulkPayload);
        toast.success(`Successfully added all ${serials.length} NVMes`);
        handleNvmeReset();
      } else {
        await api.post("/inventory/addNVMe", { ...nvmeFormData, inventoryID: nvmeFormData.inventoryID || selectedInventory || null })
        toast.success("NVMe added successfully")
        handleNvmeReset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to add NVMe")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMonitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const serviceTags = monitorFormData.service_tag.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const pyramidIds = monitorFormData.pyramid_id ? monitorFormData.pyramid_id.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (serviceTags.length === 0) {
          throw new Error("Please enter at least one Service Tag");
        }

        const expectedCount = parseInt(monitorFormData.count || "0", 10);
        if (serviceTags.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${serviceTags.length} Service Tag(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        if (pyramidIds.length > 0 && serviceTags.length !== pyramidIds.length) {
          throw new Error(`Count mismatch: ${serviceTags.length} Service Tags vs ${pyramidIds.length} Pyramid IDs`);
        }

        const bulkPayload = serviceTags.map((tag, index) => ({
          ...monitorFormData,
          service_tag: tag,
          pyramid_id: pyramidIds[index] || "",
          count: "1",
          inventoryID: selectedInventory || null
        }));

        await api.post("/inventory/addMonitor", bulkPayload);
        toast.success(`Successfully added all ${serviceTags.length} Monitors`);
        handleMonitorReset();
      } else {
        await api.post("/inventory/addMonitor", { ...monitorFormData, inventoryID: selectedInventory || null })
        toast.success("Monitor added successfully")
        handleMonitorReset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.message || `Failed to add Monitor. ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const serials = hddFormData.serialNumber.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const tags = hddFormData.serviceTag ? hddFormData.serviceTag.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];
        const pyramidIds = hddFormData.phyramidID ? hddFormData.phyramidID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (serials.length === 0) {
          throw new Error("Please enter at least one Serial Number");
        }

        const expectedCount = parseInt(hddFormData.count || "0", 10);
        if (serials.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${serials.length} Serial Number(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        if (tags.length > 0 && serials.length !== tags.length) {
          throw new Error(`Count mismatch: ${serials.length} Serial Numbers vs ${tags.length} Service Tags`);
        }

        if (pyramidIds.length > 0 && serials.length !== pyramidIds.length) {
          throw new Error(`Count mismatch: ${serials.length} Serial Numbers vs ${pyramidIds.length} Pyramid IDs`);
        }

        const bulkPayload = serials.map((sn, index) => ({
          ...hddFormData,
          serialNumber: sn,
          serviceTag: tags[index] || "",
          phyramidID: pyramidIds[index] || "",
          count: "1",
          inventoryID: hddFormData.inventoryID || selectedInventory || null
        }));

        await api.post("/inventory/addHDD", bulkPayload);
        toast.success(`Successfully added all ${serials.length} HDDs`);
        handleHddReset();
      } else {
        await api.post("/inventory/addHDD", { ...hddFormData, inventoryID: hddFormData.inventoryID || selectedInventory || null })
        toast.success("HDD added successfully")
        handleHddReset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.message || `Failed to add HDD. ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWorkstationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const serviceIDs = workstationFormData.serviceID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const pyramids = workstationFormData.pyramidsID ? workstationFormData.pyramidsID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (serviceIDs.length === 0) {
          throw new Error("Please enter at least one Service Tag");
        }

        const expectedCount = parseInt(workstationFormData.count || "0", 10);
        if (serviceIDs.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${serviceIDs.length} Service Tag(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        if (pyramids.length > 0 && serviceIDs.length !== pyramids.length) {
          throw new Error(`Count mismatch: ${serviceIDs.length} Service Tags vs ${pyramids.length} Pyramid IDs`);
        }

        const bulkPayload = serviceIDs.map((sid, index) => ({
          ...workstationFormData,
          serviceID: sid,
          pyramidsID: pyramids[index] || "",
          count: "1",
          inventoryID: selectedInventory || null
        }));

        await api.post("/inventory/addWorkstation", bulkPayload);
        toast.success(`Successfully added all ${serviceIDs.length} Workstations`);
        handleWorkstationReset();
        setComponentRefreshKey(prev => prev + 1);
      } else {
        await api.post("/inventory/addWorkstation", { ...workstationFormData, inventoryID: selectedInventory || null })
        toast.success("Workstation added successfully")
        handleWorkstationReset()
        setComponentRefreshKey(prev => prev + 1)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.message || `Failed to add Workstation. ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGraphicsCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const numbers = graphicsCardFormData.serviceNumber.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const tags = graphicsCardFormData.serviceTag ? graphicsCardFormData.serviceTag.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];
        const pyramidIds = graphicsCardFormData.phyramidID ? graphicsCardFormData.phyramidID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (numbers.length === 0) {
          throw new Error("Please enter at least one Service Number");
        }

        const expectedCount = parseInt(graphicsCardFormData.count || "0", 10);
        if (numbers.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${numbers.length} Service Number(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        if (tags.length > 0 && numbers.length !== tags.length) {
          throw new Error(`Count mismatch: ${numbers.length} Service Numbers vs ${tags.length} Service Tags`);
        }

        if (pyramidIds.length > 0 && numbers.length !== pyramidIds.length) {
          throw new Error(`Count mismatch: ${numbers.length} Service Numbers vs ${pyramidIds.length} Pyramid IDs`);
        }

        const bulkPayload = numbers.map((num, index) => ({
          ...graphicsCardFormData,
          serviceNumber: num,
          serviceTag: tags[index] || "",
          phyramidID: pyramidIds[index] || "",
          count: "1",
          inventoryID: selectedInventory || null
        }));

        await api.post("/inventory/addGraphicsCard", bulkPayload);
        toast.success(`Successfully added all ${numbers.length} Graphics Cards`);
        handleGraphicsCardReset();
      } else {
        await api.post("/inventory/addGraphicsCard", { ...graphicsCardFormData, inventoryID: selectedInventory || null })
        toast.success("Graphics Card added successfully")
        handleGraphicsCardReset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.message || `Failed to add Graphics Card. ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMobileWorkstationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const tags = mobileWorkstationFormData.serviceTag.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const pyramids = mobileWorkstationFormData.pyramidsID ? mobileWorkstationFormData.pyramidsID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (tags.length === 0) {
          throw new Error("Please enter at least one Service Tag");
        }

        const expectedCount = parseInt(mobileWorkstationFormData.count || "0", 10);
        if (tags.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${tags.length} Service Tag(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        if (pyramids.length > 0 && tags.length !== pyramids.length) {
          throw new Error(`Count mismatch: ${tags.length} Service Tags vs ${pyramids.length} Pyramid IDs`);
        }

        const bulkPayload = tags.map((tag, index) => ({
          ...mobileWorkstationFormData,
          service_id: tag,
          phyramidID: pyramids[index] || "",
          // Ensure arrays are passed
          ramIDs: mobileWorkstationFormData.ramIDs,
          ssdIDs: mobileWorkstationFormData.ssdIDs,
          nvmeIDs: mobileWorkstationFormData.nvmeIDs,
          m2IDs: mobileWorkstationFormData.m2IDs,
          count: "1",
          inventoryID: selectedInventory || null,
          processor_brand: mobileWorkstationFormData.processor_brand,
          processor_model: mobileWorkstationFormData.processor_model,
          generation: mobileWorkstationFormData.generation,
          adapter: mobileWorkstationFormData.adapter,
          graphicscardID: mobileWorkstationFormData.graphicscardID,
          // Remove legacy props by overwritting with undefined if needed, or rely on ...spread being overwritten
          serviceTag: undefined,
          pyramidsID: undefined
        }));

        await api.post("/inventory/addMobileWorkstation", bulkPayload);
        toast.success(`Successfully added all ${tags.length} Mobile Workstations`);
        handleMobileWorkstationReset();
      } else {
        const payload = {
          ...mobileWorkstationFormData,
          service_id: mobileWorkstationFormData.serviceTag,
          phyramidID: mobileWorkstationFormData.pyramidsID,
          inventoryID: selectedInventory || null,
          serviceTag: undefined,
          pyramidsID: undefined
        };
        await api.post("/inventory/addMobileWorkstation", payload)
        toast.success("Mobile Workstation added successfully")
        handleMobileWorkstationReset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.message || `Failed to add Mobile Workstation. ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleM2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedInventory) {
      toast.error("Please select an inventory");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isBulk) {
        // Bulk Mode Logic
        const serviceIds = m2FormData.service_id.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const pyramidIds = m2FormData.phyramidID ? m2FormData.phyramidID.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

        if (serviceIds.length === 0) {
          throw new Error("Please enter at least one Service Tag");
        }

        const expectedCount = parseInt(m2FormData.count || "0", 10);
        if (serviceIds.length !== expectedCount) {
          throw new Error(`Quantity mismatch: Quantity is set to ${expectedCount}, but found ${serviceIds.length} Service Tag(s). Please provide IDs for all entries or adjust the quantity.`);
        }

        if (pyramidIds.length > 0 && serviceIds.length !== pyramidIds.length) {
          throw new Error(`Count mismatch: ${serviceIds.length} Service Tags vs ${pyramidIds.length} Pyramid IDs`);
        }

        const bulkPayload = serviceIds.map((id, index) => ({
          ...m2FormData,
          service_id: id,
          phyramidID: pyramidIds[index] || "",
          count: "1",
          inventoryID: m2FormData.inventoryID || selectedInventory || null
        }));

        await api.post("/inventory/addM_2", bulkPayload);
        toast.success(`Successfully added all ${serviceIds.length} M.2s`);
        handleM2Reset();
      } else {
        await api.post("/inventory/addM_2", { ...m2FormData, inventoryID: m2FormData.inventoryID || selectedInventory || null })
        toast.success("M.2 added successfully")
        handleM2Reset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to add M.2")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkExcelParsed = async (data: any[], endpoint: string, resetFn: () => void, itemName: string) => {
    try {
      if (!selectedInventory) {
        toast.error("Please select an inventory");
        return;
      }

      if (!data || data.length === 0) {
        toast.error("No data found in file");
        return;
      }

      // Ensure count is set to "1" for individual items if not present, though backend might ignore it or expect it.
      // The current bulk add logic (e.g. handleLaptopSubmit with isBulk) constructs an array where each item has count "1".
      // We should mirror that structure.

      const payload = data.map(item => ({
        ...item,
        count: "1",
        inventoryID: selectedInventory || null
      }));

      await api.post(endpoint, payload);
      toast.success(`Successfully added all ${data.length} ${itemName}s`);
      resetFn();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || `Failed to upload ${itemName}s`);
    }
  };

  const handleLaptopReset = () => {
    setLaptopFormData({
      brand: "",
      model: "",
      processor_brand: "",
      processor_model: "",
      generation: "",
      ramIDs: [],
      ssdIDs: [],
      nvmeIDs: [],
      m2IDs: [],
      graphicscardIDs: [],
      service_id: "",
      company_id: "",
      date_of_purchase: "",
      adapter: "",
      phyramidID: "",
      moving: "",
      count: "1"
    })
    setError(null)
  }

  const handleRamReset = () => {
    setRamFormData({
      brand: "",
      size: "",
      type: "",
      form_factor: "",
      service_id: "",
      pyramid_id: "",
      date_of_purchase: "",
      count: "1"
    })
    setError(null)
  }

  const handleSSDReset = () => {
    setssdFormData({
      brand: "",
      ssdSize: "",
      speed: "",
      SerialNumber: "",
      serviceTag: "",
      warrantyEndDate: "",
      phyramidID: "",
      dateOfPurchase: "",
      count: "1"
    })

    setError(null)
  }

  const handleNvmeReset = () => {
    setNvmeFormData({
      brand: "",
      Size: "",
      speed: "",
      serialNumber: "",
      serviceTag: "",
      warrantyEndDate: "",
      dateOfPurchase: "",
      phyramidID: "",
      inventoryID: "",
      count: "1"
    })

    setError(null)
  }

  const handleHddReset = () => {
    setHddFormData({
      brand: "",
      size: "",
      speed: "",
      serialNumber: "",
      serviceTag: "",
      warrantyEndDate: "",
      dateOfPurchase: "",
      phyramidID: "",
      inventoryID: "",
      count: "1"
    })

    setError(null)
  }

  const handleMonitorReset = () => {
    setMonitorFormData({
      name: "",
      size: "",
      display: "",
      service_tag: "",
      pyramid_id: "",
      date_of_purchase: "",
      warranty_date: "",
      count: "1"
    })

    setError(null)
  }

  const handleSystemReset = () => {
    setSystemFormData({
      Name: "",
      Processor: "",
      Generation: "",
      ramIDs: [],
      ssdIDs: [],
      nvmeIDs: [],
      m2IDs: [],
      graphicscardIDs: [],
      serviceID: "",
      pyramidsID: "",
      dateOfPurchase: "",
      count: "1"
    })
    setError(null)
  }
  const handleWorkstationReset = () => {
    setWorkstationFormData({
      Name: "",
      Processor: "",
      Generation: "",
      ramIDs: [],
      ssdIDs: [],
      nvmeIDs: [],
      m2IDs: [],
      graphicscardIDs: [],
      serviceID: "",
      pyramidsID: "",
      dateOfPurchase: "",
      count: "1"
    })
    setError(null)
  }
  const handleGraphicsCardReset = () => {
    setGraphicsCardFormData({
      brand: "",
      model: "",
      size: "",
      generation: "",
      serviceNumber: "",
      serviceTag: "",
      phyramidID: "",
      warrantyEndDate: "",
      dateOfPurchase: "",
      count: "1"
    })
    setError(null)
  }

  const handleMobileWorkstationReset = () => {
    setMobileWorkstationFormData({
      brand: "",
      model: "",
      processor_brand: "",
      processor_model: "",
      generation: "",
      ramIDs: [],
      ssdIDs: [],
      nvmeIDs: [],
      m2IDs: [],
      graphicscardID: "",
      adapter: "",
      serviceTag: "",
      pyramidsID: "",
      warrantyEndDate: "",
      dateOfPurchase: "",
      count: "1"
    })
    setError(null)
  }

  const handleM2Reset = () => {
    setM2FormData({
      brand: "",
      size: "",
      type: "",
      formFactor: "Laptop",
      service_id: "",
      phyramidID: "",
      dateOfPurchase: "",
      inventoryID: "",
      count: "1"
    })
    setError(null)
  }



  const handleDynamicBulkParse = (data: any[]) => {
    switch (activeTab) {
      case "desktop": return handleBulkExcelParsed(data, "/inventory/addDesktop", handleSystemReset, "System");
      case "laptop": return handleBulkExcelParsed(data, "/inventory/addLaptops", handleLaptopReset, "Laptop");
      case "ram": return handleBulkExcelParsed(data, "/inventory/addRam", handleRamReset, "RAM");
      case "ssd": return handleBulkExcelParsed(data, "/inventory/addSSD", handleSSDReset, "SSD");
      case "nvme": return handleBulkExcelParsed(data, "/inventory/addNVMe", handleNvmeReset, "NVMe");
      case "hdd": return handleBulkExcelParsed(data, "/inventory/addHDD", handleHddReset, "HDD");
      case "monitor": return handleBulkExcelParsed(data, "/inventory/addMonitor", handleMonitorReset, "Monitor");
      case "graphicscard": return handleBulkExcelParsed(data, "/inventory/addGraphicsCard", handleGraphicsCardReset, "Graphics Card");
      case "workstation": return handleBulkExcelParsed(data, "/inventory/addWorkstation", handleWorkstationReset, "Workstation");
      case "mobile_workstation": return handleBulkExcelParsed(data, "/inventory/addMobileWorkstation", handleMobileWorkstationReset, "Mobile Workstation");
      case "m_2": return handleBulkExcelParsed(data, "/inventory/addM_2", handleM2Reset, "M.2");
      default: toast.error("Unknown product type");
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>Choose a product type tab and fill the details below to add a product to inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as ProductCategory)} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex w-max min-w-full">
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="laptop">Laptop</TabsTrigger>
                <TabsTrigger value="ram">RAM</TabsTrigger>
                <TabsTrigger value="ssd">SSD</TabsTrigger>
                <TabsTrigger value="nvme">NVMe</TabsTrigger>
                <TabsTrigger value="hdd">HDD</TabsTrigger>
                <TabsTrigger value="monitor">Monitor</TabsTrigger>
                <TabsTrigger value="graphicscard">Graphics Card</TabsTrigger>
                <TabsTrigger value="workstation">Workstation</TabsTrigger>
                <TabsTrigger value="mobile_workstation">Mobile Workstation</TabsTrigger>
                <TabsTrigger value="m_2">M.2</TabsTrigger>
              </TabsList>
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4 items-end justify-between">
              <div className="w-full md:max-w-sm">
                <Label htmlFor="inventory-select">Select Inventory</Label>
                <Select value={selectedInventory} onValueChange={setSelectedInventory}>
                  <SelectTrigger id="inventory-select" className="w-full mt-1.5">
                    <SelectValue placeholder="Select an inventory..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventories.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id.toString()}>
                        {inv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-auto">
                <BulkUpload
                  category={activeTab}
                  onDataParsed={handleDynamicBulkParse}
                />
              </div>
            </div>



            <TabsContent value="desktop">
              {error && (<div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>)}

              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-desktop" className="text-base font-semibold text-primary">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-[200px] xs:max-w-none">
                      Enable to add multiple items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col items-start min-[400px]:flex-row min-[400px]:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              const currentCount = parseInt(systemFormData.count || "0") || 0;
                              const ids = systemFormData.serviceID.split(/\r?\n/);
                              const pyramids = systemFormData.pyramidsID ? systemFormData.pyramidsID.split(/\r?\n/) : [];

                              if (currentCount > ids.length) {
                                setSystemFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                              } else if (ids.length > 0) {
                                ids.pop();
                                if (pyramids.length > ids.length) pyramids.length = ids.length;
                                setSystemFormData(prev => ({
                                  ...prev,
                                  serviceID: ids.join('\n'),
                                  pyramidsID: pyramids.join('\n'),
                                  count: ids.length.toString()
                                }));
                              }
                            } else {
                              const current = parseInt(systemFormData.count || "0") || 0;
                              if (current > 1) {
                                setSystemFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                              }
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-16">
                          <Input
                            id="count-header"
                            name="count"
                            type="number"
                            className="h-8 px-1 text-center"
                            value={systemFormData.count}
                            onChange={handleSystemInputChange}
                            min="1"
                            placeholder="Qty"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              setSystemFormData(prev => ({
                                ...prev,
                                serviceID: prev.serviceID + (prev.serviceID ? '\n' : ''),
                                count: (parseInt(prev.count || "0") + 1).toString()
                              }));
                            } else {
                              const current = parseInt(systemFormData.count || "0") || 0;
                              setSystemFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="hidden min-[400px]:block h-6 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-desktop"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setSystemFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-desktop"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSystemSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* System Name */}
                <div className="space-y-2">
                  <Label htmlFor="Name">
                    Brand Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="Name"
                    name="Name"
                    value={systemFormData.Name}
                    onChange={handleSystemInputChange}
                    required
                  />
                </div>

                {/* Processor */}
                <div className="space-y-2">
                  <Label htmlFor="Processor">
                    Processor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="Processor"
                    name="Processor"
                    value={systemFormData.Processor}
                    onChange={handleSystemInputChange}
                    required
                    placeholder="e.g., Intel i5, Ryzen 7"
                  />
                </div>

                {/* Generation */}
                <div className="space-y-2">
                  <Label htmlFor="Generation">
                    Generation <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="Generation"
                    name="Generation"
                    value={systemFormData.Generation}
                    onChange={handleSystemInputChange}
                    required
                    placeholder="e.g., 12th Gen, 13th Gen"
                  />
                </div>

                {/* RAM Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MemoryStick className="h-3.5 w-3.5" />
                    RAM
                  </Label>
                  <MultiSelect
                    options={ramOptions.map(ram => {
                      const pId = ram.pyramidsID || ram.phyramidID || ram.PyramidID || ram.pyramid_id || ram.service_id || ram.serviceTag || ram.serviceID || ram.service_tag || 'N/A';
                      return { label: `${ram.brand} - ${ram.size} (${ram.type}) (${pId})`, value: ram.id.toString() };
                    })}
                    selected={systemFormData.ramIDs}
                    onChange={(val) => setSystemFormData(prev => ({ ...prev, ramIDs: val }))}
                    placeholder="Select RAM..."
                  />
                </div>

                {/* SSD Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    SSD
                  </Label>
                  <MultiSelect
                    options={ssdOptions.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.ssdSize} (${pId})`, value: item.ssdID.toString() };
                    })}
                    selected={systemFormData.ssdIDs}
                    onChange={(val) => setSystemFormData(prev => ({ ...prev, ssdIDs: val }))}
                    placeholder="Select SSD..."
                  />
                </div>

                {/* NVMe Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    NVMe
                  </Label>
                  <MultiSelect
                    options={nvmeOptions.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.Size} (${pId})`, value: item.ID.toString() };
                    })}
                    selected={systemFormData.nvmeIDs}
                    onChange={(val) => setSystemFormData(prev => ({ ...prev, nvmeIDs: val }))}
                    placeholder="Select NVMe..."
                  />
                </div>

                {/* M.2 Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    M.2
                  </Label>
                  <MultiSelect
                    options={m2Options.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.size} (${pId})`, value: item.id.toString() };
                    })}
                    selected={systemFormData.m2IDs}
                    onChange={(val) => setSystemFormData(prev => ({ ...prev, m2IDs: val }))}
                    placeholder="Select M.2..."
                  />
                </div>

                {/* Graphics Card Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    Graphics Card
                  </Label>
                  <MultiSelect
                    options={gpuOptions.map(gpu => {
                      const pId = gpu.pyramidsID || gpu.phyramidID || gpu.PyramidID || gpu.pyramid_id || gpu.service_id || gpu.serviceTag || gpu.serviceID || gpu.service_tag || 'N/A';
                      return { label: `${gpu.brand} - ${gpu.model} (${gpu.size}) (${pId})`, value: gpu.ID.toString() };
                    })}
                    selected={systemFormData.graphicscardIDs}
                    onChange={(val) => setSystemFormData(prev => ({ ...prev, graphicscardIDs: val }))}
                    placeholder="Select Graphics Card..."
                  />
                </div>

                {/* Service ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serviceID">
                      {isBulk ? "Service Tags" : "Service Tag"} <span className="text-red-500">*</span>
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {systemFormData.serviceID.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="serviceID"
                        name="serviceID"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={systemFormData.serviceID || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setSystemFormData(prev => ({ ...prev, serviceID: val, count: lines.toString() }));
                        }}
                        required
                        placeholder="Scan or paste IDs here...&#10;SVC-001&#10;SVC-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input
                      id="serviceID"
                      name="serviceID"
                      value={systemFormData.serviceID}
                      onChange={handleSystemInputChange}
                      required
                    />
                  )}
                </div>

                {/* Pyramid ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="pyramidsID">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"} <span className="text-red-500">*</span>
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(systemFormData.pyramidsID?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (systemFormData.serviceID.split(/[\n,]+/).filter(s => s.trim()).length || 0) && systemFormData.pyramidsID
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {systemFormData.pyramidsID?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="pyramidsID"
                      name="pyramidsID"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={systemFormData.pyramidsID || ''}
                      onChange={(e) => setSystemFormData(prev => ({ ...prev, pyramidsID: e.target.value }))}
                      placeholder="PID-001&#10;PID-002"
                    />
                  ) : (
                    <Input
                      id="pyramidsID"
                      name="pyramidsID"
                      value={systemFormData.pyramidsID}
                      onChange={handleSystemInputChange}
                      required
                    />
                  )}
                </div>

                {/* Warranty End Date */}


                {/* Date of Purchase */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfPurchase">
                    Date of Purchase <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfPurchase"
                    name="dateOfPurchase"
                    type="date"
                    value={systemFormData.dateOfPurchase || ""}
                    onChange={handleSystemInputChange}
                    required
                  />
                </div>

                {/* Delivery Company */}


                {/* Form Actions */}
                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Adding..." : "Add System"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleSystemReset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>

              </form>
            </TabsContent>

            <TabsContent value="laptop">
              {error && <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}



              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle" className="text-base font-semibold">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable to add multiple items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 sm:gap-6">
                    {/* Quantity Field Moved Here */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground mr-2">Quantity:</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (isBulk) {
                            // Bulk Mode: Remove last line
                            const currentCount = parseInt(laptopFormData.count || "0") || 0;
                            const services = laptopFormData.service_id.split(/\r?\n/);
                            const phyramids = laptopFormData.phyramidID ? laptopFormData.phyramidID.split(/\r?\n/) : [];

                            if (currentCount > services.length) {
                              setLaptopFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                            } else if (services.length > 0) {
                              services.pop();
                              if (phyramids.length > services.length) phyramids.length = services.length;
                              setLaptopFormData(prev => ({
                                ...prev,
                                service_id: services.join('\n'),
                                phyramidID: phyramids.join('\n'),
                                count: services.length.toString()
                              }));
                            }
                          } else {
                            // Single Mode
                            const current = parseInt(laptopFormData.count || "0") || 0;
                            if (current > 1) {
                              setLaptopFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                            }
                          }
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="relative w-20">
                        <Input
                          id="count-header"
                          name="count"
                          type="number"
                          className="h-8 text-center"
                          value={laptopFormData.count}
                          onChange={handleLaptopInputChange}
                          min="1"
                          placeholder="Qty"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (isBulk) {
                            // Bulk Mode: Add new line
                            setLaptopFormData(prev => ({
                              ...prev,
                              service_id: prev.service_id + (prev.service_id ? '\n' : ''),
                              count: (parseInt(prev.count || "0") + 1).toString()
                            }));
                          } else {
                            // Single Mode
                            const current = parseInt(laptopFormData.count || "0") || 0;
                            setLaptopFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="hidden xs:block h-6 w-px bg-slate-200 mx-2"></div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setLaptopFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLaptopSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <Input id="brand"
                    name="brand"
                    value={laptopFormData.brand}
                    onChange={handleLaptopInputChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model"
                    name="model"
                    value={laptopFormData.model || ''} onChange={handleLaptopInputChange} />
                </div>



                <div className="space-y-2">
                  <Label htmlFor="processor_brand">Processor Brand</Label>
                  <Input id="processor_brand" name="processor_brand" value={laptopFormData.processor_brand || ''} onChange={handleLaptopInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processor_model">Processor Model</Label>
                  <Input id="processor_model" name="processor_model" value={laptopFormData.processor_model || ''} onChange={handleLaptopInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="generation">Generation</Label>
                  <Input id="generation" name="generation" value={laptopFormData.generation || ''} onChange={handleLaptopInputChange} />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MemoryStick className="h-3.5 w-3.5" />
                    RAM
                  </Label>
                  <MultiSelect
                    options={ramOptions.map(ram => {
                      const pId = ram.pyramidsID || ram.phyramidID || ram.PyramidID || ram.pyramid_id || ram.service_id || ram.serviceTag || ram.serviceID || ram.service_tag || 'N/A';
                      return { label: `${ram.brand} - ${ram.size} (${ram.type}) (${pId})`, value: ram.id.toString() };
                    })}
                    selected={laptopFormData.ramIDs}
                    onChange={(val) => setLaptopFormData(prev => ({ ...prev, ramIDs: val }))}
                    placeholder="Select RAM..."
                  />
                </div>

                {/* SSD Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    SSD
                  </Label>
                  <MultiSelect
                    options={ssdOptions.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.ssdSize} (${pId})`, value: item.ssdID.toString() };
                    })}
                    selected={laptopFormData.ssdIDs}
                    onChange={(val) => setLaptopFormData(prev => ({ ...prev, ssdIDs: val }))}
                    placeholder="Select SSD..."
                  />
                </div>

                {/* NVMe Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    NVMe
                  </Label>
                  <MultiSelect
                    options={nvmeOptions.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.Size} (${pId})`, value: item.ID.toString() };
                    })}
                    selected={laptopFormData.nvmeIDs}
                    onChange={(val) => setLaptopFormData(prev => ({ ...prev, nvmeIDs: val }))}
                    placeholder="Select NVMe..."
                  />
                </div>

                {/* M.2 Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    M.2
                  </Label>
                  <MultiSelect
                    options={m2Options.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.size} (${pId})`, value: item.id.toString() };
                    })}
                    selected={laptopFormData.m2IDs}
                    onChange={(val) => setLaptopFormData(prev => ({ ...prev, m2IDs: val }))}
                    placeholder="Select M.2..."
                  />
                </div>

                {/* Graphics Card Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    Graphics Card
                  </Label>
                  <MultiSelect
                    options={gpuOptions.map(gpu => {
                      const pId = gpu.pyramidsID || gpu.phyramidID || gpu.PyramidID || gpu.pyramid_id || gpu.service_id || gpu.serviceTag || gpu.serviceID || gpu.service_tag || 'N/A';
                      return { label: `${gpu.brand} - ${gpu.model} (${gpu.size}) (${pId})`, value: gpu.ID.toString() };
                    })}
                    selected={laptopFormData.graphicscardIDs}
                    onChange={(val) => setLaptopFormData(prev => ({ ...prev, graphicscardIDs: val }))}
                    placeholder="Select Graphics Card..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="service_id">
                      {isBulk ? "Service Tags" : "Service Tag"} <span className="text-red-500">*</span>
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {laptopFormData.service_id.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="service_id"
                        name="service_id"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={laptopFormData.service_id || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setLaptopFormData(prev => ({ ...prev, service_id: val, count: lines.toString() }));
                        }}
                        required
                        placeholder="Scan or paste IDs here...&#10;SVC-001&#10;SVC-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input id="service_id" name="service_id" value={laptopFormData.service_id || ''} onChange={handleLaptopInputChange} required />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="phyramidID">
                      {isBulk ? "Phyramid IDs" : "Phyramid ID"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(laptopFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (laptopFormData.service_id.split(/[\n,]+/).filter(s => s.trim()).length || 0) && laptopFormData.phyramidID
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {laptopFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="phyramidID"
                      name="phyramidID"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={laptopFormData.phyramidID || ''}
                      onChange={(e) => setLaptopFormData(prev => ({ ...prev, phyramidID: e.target.value }))}
                      placeholder="PID-001&#10;PID-002"
                    />
                  ) : (
                    <Input id="phyramidID" name="phyramidID" value={laptopFormData.phyramidID || ''} onChange={handleLaptopInputChange} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_purchase">Date of Purchase</Label>
                  <Input id="date_of_purchase" name="date_of_purchase" type="date" value={laptopFormData.date_of_purchase || ''} onChange={handleLaptopInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adapter">Adapter</Label>
                  <Input id="adapter" name="adapter" value={laptopFormData.adapter || ''} onChange={handleLaptopInputChange} />
                </div>



                {/* Empty divs to fill the row if needed */}
                <div></div>

                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Adding..." : "Add Laptop"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleLaptopReset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="ram">
              {error && <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}



              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-ram" className="text-base font-semibold">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable to add multiple Items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 sm:gap-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground mr-2">Quantity:</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (isBulk) {
                            const currentCount = parseInt(ramFormData.count || "0") || 0;
                            const services = ramFormData.service_id.split(/\r?\n/);
                            const pyramids = ramFormData.pyramid_id ? ramFormData.pyramid_id.split(/\r?\n/) : [];

                            if (currentCount > services.length) {
                              setRamFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                            } else if (services.length > 0) {
                              services.pop();
                              if (pyramids.length > services.length) pyramids.length = services.length;
                              setRamFormData(prev => ({
                                ...prev,
                                service_id: services.join('\n'),
                                pyramid_id: pyramids.join('\n'),
                                count: services.length.toString()
                              }));
                            }
                          } else {
                            const current = parseInt(ramFormData.count || "0") || 0;
                            if (current > 1) {
                              setRamFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                            }
                          }
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="relative w-20">
                        <Input
                          id="count-header"
                          name="count"
                          type="number"
                          className="h-8 text-center"
                          value={ramFormData.count}
                          onChange={handleRamInputChange}
                          min="1"
                          placeholder="Qty"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (isBulk) {
                            setRamFormData(prev => ({
                              ...prev,
                              service_id: prev.service_id + (prev.service_id ? '\n' : ''),
                              count: (parseInt(prev.count || "0") + 1).toString()
                            }));
                          } else {
                            const current = parseInt(ramFormData.count || "0") || 0;
                            setRamFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="hidden xs:block h-6 w-px bg-slate-200 mx-2"></div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-ram"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setRamFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-ram"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>



              <form onSubmit={handleRamSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Column 1 */}
                <div className="space-y-2">
                  <Label htmlFor="brand">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={ramFormData.brand}
                    onChange={handleRamInputChange}
                    required
                  />
                </div>

                {/* Column 2 */}
                <div className="space-y-2">
                  <Label htmlFor="size">
                    Size (GB) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="size"
                    name="size"
                    value={ramFormData.size}
                    onChange={handleRamInputChange}
                    required
                    placeholder="e.g., 8GB, 16GB"
                  />
                </div>

                {/* Column 3 */}
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    name="type"
                    value={ramFormData.type || ''}
                    onChange={handleRamInputChange}
                    placeholder="e.g., DDR4, DDR5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form_factor">
                    Form Factor <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={formFactorOpen} onOpenChange={setFormFactorOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between bg-card" type="button">
                        {ramFormData.form_factor || "Select form factor..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            <CommandItem
                              value="Laptop"
                              onSelect={() => {
                                setRamFormData(prev => ({ ...prev, form_factor: 'Laptop' }));
                                setFormFactorOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", ramFormData.form_factor === "Laptop" ? "opacity-100" : "opacity-0")} />
                              Laptop
                            </CommandItem>
                            <CommandItem
                              value="Desktop"
                              onSelect={() => {
                                setRamFormData(prev => ({ ...prev, form_factor: 'Desktop' }));
                                setFormFactorOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", ramFormData.form_factor === "Desktop" ? "opacity-100" : "opacity-0")} />
                              Desktop
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Column 1 - row 2 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="service_id">
                      {isBulk ? "Service Tags" : "Service Tag"} <span className="text-red-500">*</span>
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {ramFormData.service_id.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="service_id"
                        name="service_id"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={ramFormData.service_id || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setRamFormData(prev => ({ ...prev, service_id: val, count: lines.toString() }));
                        }}
                        required
                        placeholder="Scan or paste IDs here...&#10;SVC-001&#10;SVC-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input
                      id="service_id"
                      name="service_id"
                      value={ramFormData.service_id || ''}
                      onChange={handleRamInputChange}
                      required
                    />
                  )}
                </div>

                {/* Column 2 - row 2 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="pyramid_id">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"} <span className="text-red-500">*</span>
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(ramFormData.pyramid_id?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (ramFormData.service_id.split(/[\n,]+/).filter(s => s.trim()).length || 0) && ramFormData.pyramid_id
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {ramFormData.pyramid_id?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="pyramid_id"
                      name="pyramid_id"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={ramFormData.pyramid_id || ''}
                      onChange={(e) => setRamFormData(prev => ({ ...prev, pyramid_id: e.target.value }))}
                      placeholder="PID-001&#10;PID-002"
                    />
                  ) : (
                    <Input
                      id="pyramid_id"
                      name="pyramid_id"
                      value={ramFormData.pyramid_id || ''}
                      onChange={handleRamInputChange}
                      required
                    />
                  )}
                </div>

                {/* Column 3 - row 2 */}
                <div className="space-y-2">
                  <Label htmlFor="date_of_purchase">
                    Date of Purchase <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date_of_purchase"
                    name="date_of_purchase"
                    type="date"
                    value={ramFormData.date_of_purchase || ''}
                    onChange={handleRamInputChange}
                    required
                  />
                </div>

                {/* Form Actions - spans all 3 columns */}
                <div className="col-span-3 flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add RAM"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleRamReset}>
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="ssd">
              {error && (
                <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}



              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-ssd" className="text-base font-semibold text-primary">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                      Enable to add multiple items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col items-start min-[400px]:flex-row min-[400px]:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              const currentCount = parseInt(ssdFormData.count || "0") || 0;
                              const serials = ssdFormData.SerialNumber.split(/\r?\n/);
                              const tags = ssdFormData.serviceTag ? ssdFormData.serviceTag.split(/\r?\n/) : [];
                              const pyramids = ssdFormData.phyramidID ? ssdFormData.phyramidID.split(/\r?\n/) : [];

                              if (currentCount > serials.length) {
                                setssdFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                              } else if (serials.length > 0) {
                                serials.pop();
                                if (tags.length > serials.length) tags.length = serials.length;
                                if (pyramids.length > serials.length) pyramids.length = serials.length;
                                setssdFormData(prev => ({
                                  ...prev,
                                  SerialNumber: serials.join('\n'),
                                  serviceTag: tags.join('\n'),
                                  phyramidID: pyramids.join('\n'),
                                  count: serials.length.toString()
                                }));
                              }
                            } else {
                              const current = parseInt(ssdFormData.count || "0") || 0;
                              if (current > 1) {
                                setssdFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                              }
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-16">
                          <Input
                            id="count-header"
                            name="count"
                            type="number"
                            className="h-8 px-1 text-center"
                            value={ssdFormData.count}
                            onChange={handleSsdInputChange}
                            min="1"
                            placeholder="Qty"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              setssdFormData(prev => ({
                                ...prev,
                                SerialNumber: prev.SerialNumber + (prev.SerialNumber ? '\n' : ''),
                                count: (parseInt(prev.count || "0") + 1).toString()
                              }));
                            } else {
                              const current = parseInt(ssdFormData.count || "0") || 0;
                              setssdFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="hidden min-[400px]:block h-6 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-ssd"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setssdFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-ssd"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>



              <form onSubmit={handleSsdSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Brand */}
                <div className="space-y-2">
                  <Label htmlFor="brand">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={ssdFormData.brand || ""}
                    onChange={handleSsdInputChange}
                    required
                  />
                </div>

                {/* SSD Size */}
                <div className="space-y-2">
                  <Label htmlFor="ssdSize">SSD Size</Label>
                  <Input
                    id="ssdSize"
                    name="ssdSize"
                    placeholder="512GB / 1TB"
                    value={ssdFormData.ssdSize || ""}
                    onChange={handleSsdInputChange}
                  />
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <Label htmlFor="speed">Speed</Label>
                  <Input
                    id="speed"
                    name="speed"
                    placeholder="550MB/s"
                    value={ssdFormData.speed || ""}
                    onChange={handleSsdInputChange}
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="SerialNumber">
                      {isBulk ? "Serial Numbers" : "Serial Number"}
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {ssdFormData.SerialNumber.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="SerialNumber"
                        name="SerialNumber"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={ssdFormData.SerialNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setssdFormData(prev => ({ ...prev, SerialNumber: val, count: lines.toString() }));
                        }}
                        placeholder="Scan or paste Serial Numbers here...&#10;SN-001&#10;SN-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input
                      id="SerialNumber"
                      name="SerialNumber"
                      value={ssdFormData.SerialNumber || ""}
                      onChange={handleSsdInputChange}
                    />
                  )}
                </div>

                {/* Service Tag */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serviceTag">
                      {isBulk ? "Service Tags" : "Service Tag"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(ssdFormData.serviceTag?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (ssdFormData.SerialNumber.split(/[\n,]+/).filter(s => s.trim()).length || 0) && ssdFormData.serviceTag
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {ssdFormData.serviceTag?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="serviceTag"
                      name="serviceTag"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={ssdFormData.serviceTag || ''}
                      onChange={(e) => setssdFormData(prev => ({ ...prev, serviceTag: e.target.value }))}
                      placeholder="ST-001&#10;ST-002"
                    />
                  ) : (
                    <Input
                      id="serviceTag"
                      name="serviceTag"
                      value={ssdFormData.serviceTag || ""}
                      onChange={handleSsdInputChange}
                    />
                  )}
                </div>

                {/* Pyramid ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="phyramidID">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(ssdFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (ssdFormData.SerialNumber.split(/[\n,]+/).filter(s => s.trim()).length || 0) && ssdFormData.phyramidID
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {ssdFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="phyramidID"
                      name="phyramidID"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={ssdFormData.phyramidID || ''}
                      onChange={(e) => setssdFormData(prev => ({ ...prev, pyramidID: e.target.value }))}
                      placeholder="PID-001&#10;PID-002"
                    />
                  ) : (
                    <Input
                      id="phyramidID"
                      name="phyramidID"
                      value={ssdFormData.phyramidID || ""}
                      onChange={handleSsdInputChange}
                    />
                  )}
                </div>

                {/* Warranty End Date */}
                {/* <div className="space-y-2">
                  <Label htmlFor="warrantyEndDate">Warranty End Date</Label>
                  <Input
                    id="warrantyEndDate"
                    name="warrantyEndDate"
                    type="date"
                    value={ssdFormData.warrantyEndDate || ""}
                    onChange={handleSsdInputChange}
                  />
                </div> */}

                {/* Date of Purchase */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfPurchase">Date Of Purchase</Label>
                  <Input
                    id="dateOfPurchase"
                    name="dateOfPurchase"
                    type="date"
                    value={ssdFormData.dateOfPurchase || ""}
                    onChange={handleSsdInputChange}
                  />
                </div>

                {/* Delivery Company */}


                {/* Actions */}
                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Adding..." : "Add SSD"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleSSDReset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="nvme">
              {error && (
                <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}



              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-nvme" className="text-base font-semibold text-primary">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                      Enable to add multiple Items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col items-start min-[400px]:flex-row min-[400px]:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              const currentCount = parseInt(nvmeFormData.count || "0") || 0;
                              const serials = nvmeFormData.serialNumber.split(/\r?\n/);
                              const tags = nvmeFormData.serviceTag ? nvmeFormData.serviceTag.split(/\r?\n/) : [];

                              if (currentCount > serials.length) {
                                setNvmeFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                              } else if (serials.length > 0) {
                                serials.pop();
                                if (tags.length > serials.length) tags.length = serials.length;
                                setNvmeFormData(prev => ({
                                  ...prev,
                                  serialNumber: serials.join('\n'),
                                  serviceTag: tags.join('\n'),
                                  count: serials.length.toString()
                                }));
                              }
                            } else {
                              const current = parseInt(nvmeFormData.count || "0") || 0;
                              if (current > 1) {
                                setNvmeFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                              }
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-16">
                          <Input
                            id="count-header"
                            name="count"
                            type="number"
                            className="h-8 px-1 text-center"
                            value={nvmeFormData.count}
                            onChange={handleNvmeInputChange}
                            min="1"
                            placeholder="Qty"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              setNvmeFormData(prev => ({
                                ...prev,
                                serialNumber: prev.serialNumber + (prev.serialNumber ? '\n' : ''),
                                count: (parseInt(prev.count || "0") + 1).toString()
                              }));
                            } else {
                              const current = parseInt(nvmeFormData.count || "0") || 0;
                              setNvmeFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="hidden min-[400px]:block h-6 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-nvme"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setNvmeFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-nvme"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>



              <form onSubmit={handleNvmeSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Brand */}
                <div className="space-y-2">
                  <Label htmlFor="brand">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={nvmeFormData.brand || ""}
                    onChange={handleNvmeInputChange}
                    required
                  />
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label htmlFor="Size">Size</Label>
                  <Input
                    id="Size"
                    name="Size"
                    placeholder="512GB / 1TB"
                    value={nvmeFormData.Size || ""}
                    onChange={handleNvmeInputChange}
                  />
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <Label htmlFor="speed">Speed</Label>
                  <Input
                    id="speed"
                    name="speed"
                    placeholder="2500MB/s"
                    value={nvmeFormData.speed || ""}
                    onChange={handleNvmeInputChange}
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serialNumber">
                      {isBulk ? "Serial Numbers" : "Serial Number"}
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {nvmeFormData.serialNumber.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="serialNumber"
                        name="serialNumber"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={nvmeFormData.serialNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setNvmeFormData(prev => ({ ...prev, serialNumber: val, count: lines.toString() }));
                        }}
                        placeholder="Scan or paste Serial Numbers here...&#10;SN-001&#10;SN-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      value={nvmeFormData.serialNumber || ""}
                      onChange={handleNvmeInputChange}
                    />
                  )}
                </div>

                {/* Service Tag */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serviceTag">
                      {isBulk ? "Service Tags" : "Service Tag"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(nvmeFormData.serviceTag?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (nvmeFormData.serialNumber.split(/[\n,]+/).filter(s => s.trim()).length || 0) && nvmeFormData.serviceTag
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {nvmeFormData.serviceTag?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="serviceTag"
                      name="serviceTag"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={nvmeFormData.serviceTag || ''}
                      onChange={(e) => setNvmeFormData(prev => ({ ...prev, serviceTag: e.target.value }))}
                      placeholder="ST-001&#10;ST-002"
                    />
                  ) : (
                    <Input
                      id="serviceTag"
                      name="serviceTag"
                      value={nvmeFormData.serviceTag || ""}
                      onChange={handleNvmeInputChange}
                    />
                  )}
                </div>

                {/* Pyramid ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="phyramidID">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(nvmeFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (nvmeFormData.serialNumber.split(/[\n,]+/).filter(s => s.trim()).length || 0) && nvmeFormData.phyramidID
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {nvmeFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="phyramidID"
                      name="phyramidID"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={nvmeFormData.phyramidID || ''}
                      onChange={(e) => setNvmeFormData(prev => ({ ...prev, phyramidID: e.target.value }))}
                      placeholder="PYR-001&#10;PYR-002"
                    />
                  ) : (
                    <Input
                      id="phyramidID"
                      name="phyramidID"
                      value={nvmeFormData.phyramidID || ""}
                      onChange={handleNvmeInputChange}
                    />
                  )}
                </div>

                {/* Warranty End Date */}
                <div className="space-y-2">
                  <Label htmlFor="warrantyEndDate">Warranty End Date</Label>
                  <Input
                    id="warrantyEndDate"
                    name="warrantyEndDate"
                    type="date"
                    value={nvmeFormData.warrantyEndDate || ""}
                    onChange={handleNvmeInputChange}
                  />
                </div>

                {/* Date of Purchase */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfPurchase">Date Of Purchase</Label>
                  <Input
                    id="dateOfPurchase"
                    name="dateOfPurchase"
                    type="date"
                    value={nvmeFormData.dateOfPurchase || ""}
                    onChange={handleNvmeInputChange}
                  />
                </div>

                {/* Delivery Company */}




                {/* Form Actions */}
                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Adding..." : "Add NVMe"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleNvmeReset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="hdd">
              {error && (
                <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}



              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-hdd" className="text-base font-semibold text-primary">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                      Enable to add multiple Items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col items-start min-[400px]:flex-row min-[400px]:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              const currentCount = parseInt(hddFormData.count || "0") || 0;
                              const serials = hddFormData.serialNumber.split(/\r?\n/);
                              const tags = hddFormData.serviceTag ? hddFormData.serviceTag.split(/\r?\n/) : [];

                              if (currentCount > serials.length) {
                                setHddFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                              } else if (serials.length > 0) {
                                serials.pop();
                                if (tags.length > serials.length) tags.length = serials.length;
                                setHddFormData(prev => ({
                                  ...prev,
                                  serialNumber: serials.join('\n'),
                                  serviceTag: tags.join('\n'),
                                  count: serials.length.toString()
                                }));
                              }
                            } else {
                              const current = parseInt(hddFormData.count || "0") || 0;
                              if (current > 1) {
                                setHddFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                              }
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-16">
                          <Input
                            id="count-header"
                            name="count"
                            type="number"
                            className="h-8 px-1 text-center"
                            value={hddFormData.count}
                            onChange={handleHddInputChange}
                            min="1"
                            placeholder="Qty"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              setHddFormData(prev => ({
                                ...prev,
                                serialNumber: prev.serialNumber + (prev.serialNumber ? '\n' : ''),
                                count: (parseInt(prev.count || "0") + 1).toString()
                              }));
                            } else {
                              const current = parseInt(hddFormData.count || "0") || 0;
                              setHddFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="hidden min-[400px]:block h-6 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-hdd"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setHddFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-hdd"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>



              <form onSubmit={handleHddSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Brand */}
                <div className="space-y-2">
                  <Label htmlFor="brand">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={hddFormData.brand || ""}
                    onChange={handleHddInputChange}
                    required
                  />
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    name="size"
                    placeholder="1TB / 2TB"
                    value={hddFormData.size || ""}
                    onChange={handleHddInputChange}
                  />
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <Label htmlFor="speed">Speed</Label>
                  <Input
                    id="speed"
                    name="speed"
                    placeholder="5400 RPM / 7200 RPM"
                    value={hddFormData.speed || ""}
                    onChange={handleHddInputChange}
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serialNumber">
                      {isBulk ? "Serial Numbers" : "Serial Number"}
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {hddFormData.serialNumber.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="serialNumber"
                        name="serialNumber"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={hddFormData.serialNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setHddFormData(prev => ({ ...prev, serialNumber: val, count: lines.toString() }));
                        }}
                        placeholder="Scan or paste Serial Numbers here...&#10;SN-001&#10;SN-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      value={hddFormData.serialNumber || ""}
                      onChange={handleHddInputChange}
                    />
                  )}
                </div>

                {/* Service Tag */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serviceTag">
                      {isBulk ? "Service Tags" : "Service Tag"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(hddFormData.serviceTag?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (hddFormData.serialNumber.split(/[\n,]+/).filter(s => s.trim()).length || 0) && hddFormData.serviceTag
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {hddFormData.serviceTag?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="serviceTag"
                      name="serviceTag"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={hddFormData.serviceTag || ''}
                      onChange={(e) => setHddFormData(prev => ({ ...prev, serviceTag: e.target.value }))}
                      placeholder="ST-001&#10;ST-002"
                    />
                  ) : (
                    <Input
                      id="serviceTag"
                      name="serviceTag"
                      value={hddFormData.serviceTag || ""}
                      onChange={handleHddInputChange}
                    />
                  )}
                </div>

                {/* Pyramid ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="phyramidID">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(hddFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (hddFormData.serialNumber.split(/[\n,]+/).filter(s => s.trim()).length || 0) && hddFormData.phyramidID
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {hddFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="phyramidID"
                      name="phyramidID"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={hddFormData.phyramidID || ''}
                      onChange={(e) => setHddFormData(prev => ({ ...prev, phyramidID: e.target.value }))}
                      placeholder="PYR-001&#10;PYR-002"
                    />
                  ) : (
                    <Input
                      id="phyramidID"
                      name="phyramidID"
                      value={hddFormData.phyramidID || ""}
                      onChange={handleHddInputChange}
                    />
                  )}
                </div>

                {/* Warranty End Date */}
                <div className="space-y-2">
                  <Label htmlFor="warrantyEndDate">Warranty End Date</Label>
                  <Input
                    id="warrantyEndDate"
                    name="warrantyEndDate"
                    type="date"
                    value={hddFormData.warrantyEndDate || ""}
                    onChange={handleHddInputChange}
                  />
                </div>

                {/* Date of Purchase */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfPurchase">
                    Date of Purchase <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfPurchase"
                    name="dateOfPurchase"
                    type="date"
                    value={hddFormData.dateOfPurchase || ""}
                    onChange={handleHddInputChange}
                    required
                  />
                </div>

                {/* Delivery Company */}



                {/* Actions */}
                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Adding..." : "Add HDD"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleHddReset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="monitor">
              {error && (
                <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-monitor" className="text-base font-semibold text-primary">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                      Enable to add multiple items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col items-start min-[400px]:flex-row min-[400px]:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              const currentCount = parseInt(monitorFormData.count || "0") || 0;
                              const tags = monitorFormData.service_tag.split(/\r?\n/);
                              const pyramids = monitorFormData.pyramid_id ? monitorFormData.pyramid_id.split(/\r?\n/) : [];

                              if (currentCount > tags.length) {
                                setMonitorFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                              } else if (tags.length > 0) {
                                tags.pop();
                                if (pyramids.length > tags.length) pyramids.length = tags.length;
                                setMonitorFormData(prev => ({
                                  ...prev,
                                  service_tag: tags.join('\n'),
                                  pyramid_id: pyramids.join('\n'),
                                  count: tags.length.toString()
                                }));
                              }
                            } else {
                              const current = parseInt(monitorFormData.count || "0") || 0;
                              if (current > 1) {
                                setMonitorFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                              }
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-16">
                          <Input
                            id="count-header"
                            name="count"
                            type="number"
                            className="h-8 px-1 text-center"
                            value={monitorFormData.count}
                            onChange={handleMonitorInputChange}
                            min="1"
                            placeholder="Qty"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              setMonitorFormData(prev => ({
                                ...prev,
                                service_tag: prev.service_tag + (prev.service_tag ? '\n' : ''),
                                count: (parseInt(prev.count || "0") + 1).toString()
                              }));
                            } else {
                              const current = parseInt(monitorFormData.count || "0") || 0;
                              setMonitorFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="hidden min-[400px]:block h-6 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-monitor"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setMonitorFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-monitor"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>



              <form onSubmit={handleMonitorSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Monitor Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Brand Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={monitorFormData.name || ""}
                    onChange={handleMonitorInputChange}
                    required
                  />
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    name="size"
                    placeholder='24" / 27"'
                    value={monitorFormData.size || ""}
                    onChange={handleMonitorInputChange}
                  />
                </div>

                {/* Display */}
                <div className="space-y-2">
                  <Label htmlFor="display">Display</Label>
                  <Input
                    id="display"
                    name="display"
                    placeholder="LED / IPS / VA"
                    value={monitorFormData.display || ""}
                    onChange={handleMonitorInputChange}
                  />
                </div>

                {/* Service Tag */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="service_tag">
                      {isBulk ? "Service Tags" : "Service Tag"}
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {monitorFormData.service_tag.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="service_tag"
                        name="service_tag"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={monitorFormData.service_tag || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setMonitorFormData(prev => ({ ...prev, service_tag: val, count: lines.toString() }));
                        }}
                        placeholder="Scan or paste Serial Numbers here...&#10;SN-001&#10;SN-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input
                      id="service_tag"
                      name="service_tag"
                      value={monitorFormData.service_tag || ""}
                      onChange={handleMonitorInputChange}
                    />
                  )}
                </div>

                {/* Pyramid ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="pyramid_id">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(monitorFormData.pyramid_id?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (monitorFormData.service_tag.split(/[\n,]+/).filter(s => s.trim()).length || 0) && monitorFormData.pyramid_id
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {monitorFormData.pyramid_id?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="pyramid_id"
                      name="pyramid_id"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={monitorFormData.pyramid_id || ''}
                      onChange={(e) => setMonitorFormData(prev => ({ ...prev, pyramid_id: e.target.value }))}
                      placeholder="PID-001&#10;PID-002"
                    />
                  ) : (
                    <Input
                      id="pyramid_id"
                      name="pyramid_id"
                      value={monitorFormData.pyramid_id || ""}
                      onChange={handleMonitorInputChange}
                    />
                  )}
                </div>

                {/* Date of Purchase */}
                <div className="space-y-2">
                  <Label htmlFor="date_of_purchase">
                    Date of Purchase <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date_of_purchase"
                    name="date_of_purchase"
                    type="date"
                    value={monitorFormData.date_of_purchase || ""}
                    onChange={handleMonitorInputChange}
                    required
                  />
                </div>

                {/* Warranty Date */}
                <div className="space-y-2">
                  <Label htmlFor="warranty_date">Warranty Date</Label>
                  <Input
                    id="warranty_date"
                    name="warranty_date"
                    type="date"
                    value={monitorFormData.warranty_date || ""}
                    onChange={handleMonitorInputChange}
                  />
                </div>

                {/* Actions */}
                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Adding..." : "Add Monitor"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleMonitorReset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="graphicscard">
              {error && (
                <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}



              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-gpu" className="text-base font-semibold text-primary">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                      Enable to add multiple items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col items-start min-[400px]:flex-row min-[400px]:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              const currentCount = parseInt(graphicsCardFormData.count || "0") || 0;
                              const numbers = graphicsCardFormData.serviceNumber.split(/\r?\n/);
                              const tags = graphicsCardFormData.serviceTag ? graphicsCardFormData.serviceTag.split(/\r?\n/) : [];

                              if (currentCount > numbers.length) {
                                setGraphicsCardFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                              } else if (numbers.length > 0) {
                                numbers.pop();
                                if (tags.length > numbers.length) tags.length = numbers.length;
                                setGraphicsCardFormData(prev => ({
                                  ...prev,
                                  serviceNumber: numbers.join('\n'),
                                  serviceTag: tags.join('\n'),
                                  count: numbers.length.toString()
                                }));
                              }
                            } else {
                              const current = parseInt(graphicsCardFormData.count || "0") || 0;
                              if (current > 1) {
                                setGraphicsCardFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                              }
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-16">
                          <Input
                            id="count-header"
                            name="count"
                            type="number"
                            className="h-8 px-1 text-center"
                            value={graphicsCardFormData.count}
                            onChange={handleGraphicsCardInputChange}
                            min="1"
                            placeholder="Qty"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              setGraphicsCardFormData(prev => ({
                                ...prev,
                                serviceNumber: prev.serviceNumber + (prev.serviceNumber ? '\n' : ''),
                                count: (parseInt(prev.count || "0") + 1).toString()
                              }));
                            } else {
                              const current = parseInt(graphicsCardFormData.count || "0") || 0;
                              setGraphicsCardFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="hidden min-[400px]:block h-6 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-gpu"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setGraphicsCardFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-gpu"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>



              <form onSubmit={handleGraphicsCardSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Brand */}
                <div className="space-y-2">
                  <Label htmlFor="brand">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={graphicsCardFormData.brand || ""}
                    onChange={handleGraphicsCardInputChange}
                    required
                  />
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    value={graphicsCardFormData.model || ""}
                    onChange={handleGraphicsCardInputChange}
                  />
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    name="size"
                    value={graphicsCardFormData.size || ""}
                    onChange={handleGraphicsCardInputChange}
                    placeholder="e.g. 8GB / 12GB"
                  />
                </div>

                {/* Generation */}
                <div className="space-y-2">
                  <Label htmlFor="generation">Generation</Label>
                  <Input
                    id="generation"
                    name="generation"
                    value={graphicsCardFormData.generation || ""}
                    onChange={handleGraphicsCardInputChange}
                  />
                </div>

                {/* Service Number */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serviceNumber">
                      {isBulk ? "Service Numbers" : "Service Number"}
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {graphicsCardFormData.serviceNumber.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="serviceNumber"
                        name="serviceNumber"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={graphicsCardFormData.serviceNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setGraphicsCardFormData(prev => ({ ...prev, serviceNumber: val, count: lines.toString() }));
                        }}
                        placeholder="Scan or paste Serial Numbers here...&#10;SN-001&#10;SN-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input
                      id="serviceNumber"
                      name="serviceNumber"
                      value={graphicsCardFormData.serviceNumber || ""}
                      onChange={handleGraphicsCardInputChange}
                    />
                  )}
                </div>

                {/* Service Tag */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serviceTag">
                      {isBulk ? "Service Tags" : "Service Tag"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(graphicsCardFormData.serviceTag?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (graphicsCardFormData.serviceNumber.split(/[\n,]+/).filter(s => s.trim()).length || 0) && graphicsCardFormData.serviceTag
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {graphicsCardFormData.serviceTag?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="serviceTag"
                      name="serviceTag"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={graphicsCardFormData.serviceTag || ''}
                      onChange={(e) => setGraphicsCardFormData(prev => ({ ...prev, serviceTag: e.target.value }))}
                      placeholder="ST-001&#10;ST-002"
                    />
                  ) : (
                    <Input
                      id="serviceTag"
                      name="serviceTag"
                      value={graphicsCardFormData.serviceTag || ""}
                      onChange={handleGraphicsCardInputChange}
                    />
                  )}
                </div>

                {/* Pyramid ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="phyramidID">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(graphicsCardFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (graphicsCardFormData.serviceNumber.split(/[\n,]+/).filter(s => s.trim()).length || 0) && graphicsCardFormData.phyramidID
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {graphicsCardFormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="phyramidID"
                      name="phyramidID"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={graphicsCardFormData.phyramidID || ''}
                      onChange={(e) => setGraphicsCardFormData(prev => ({ ...prev, phyramidID: e.target.value }))}
                      placeholder="PYR-001&#10;PYR-002"
                    />
                  ) : (
                    <Input
                      id="phyramidID"
                      name="phyramidID"
                      value={graphicsCardFormData.phyramidID || ""}
                      onChange={handleGraphicsCardInputChange}
                    />
                  )}
                </div>

                {/* Warranty End Date */}
                <div className="space-y-2">
                  <Label htmlFor="warrantyEndDate">Warranty End Date</Label>
                  <Input
                    id="warrantyEndDate"
                    name="warrantyEndDate"
                    type="date"
                    value={graphicsCardFormData.warrantyEndDate || ""}
                    onChange={handleGraphicsCardInputChange}
                  />
                </div>

                {/* Date of Purchase */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfPurchase">
                    Date of Purchase <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfPurchase"
                    name="dateOfPurchase"
                    type="date"
                    value={graphicsCardFormData.dateOfPurchase || ""}
                    onChange={handleGraphicsCardInputChange}
                    required
                  />
                </div>

                {/* Delivery Company */}


                {/* Buttons */}
                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Saving..." : "Add Graphics Card"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleGraphicsCardReset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="workstation">
              {error && (
                <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}



              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-workstation" className="text-base font-semibold text-primary">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                      Enable to add multiple Items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col items-start min-[400px]:flex-row min-[400px]:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              const currentCount = parseInt(workstationFormData.count || "0") || 0;
                              const ids = workstationFormData.serviceID.split(/\r?\n/);
                              const pyramids = workstationFormData.pyramidsID ? workstationFormData.pyramidsID.split(/\r?\n/) : [];

                              if (currentCount > ids.length) {
                                setWorkstationFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                              } else if (ids.length > 0) {
                                ids.pop();
                                if (pyramids.length > ids.length) pyramids.length = ids.length;
                                setWorkstationFormData(prev => ({
                                  ...prev,
                                  serviceID: ids.join('\n'),
                                  pyramidsID: pyramids.join('\n'),
                                  count: ids.length.toString()
                                }));
                              }
                            } else {
                              const current = parseInt(workstationFormData.count || "0") || 0;
                              if (current > 1) {
                                setWorkstationFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                              }
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-16">
                          <Input
                            id="count-header"
                            name="count"
                            type="number"
                            className="h-8 px-1 text-center"
                            value={workstationFormData.count}
                            onChange={handleWorkstationInputChange}
                            min="1"
                            placeholder="Qty"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              setWorkstationFormData(prev => ({
                                ...prev,
                                serviceID: prev.serviceID + (prev.serviceID ? '\n' : ''),
                                count: (parseInt(prev.count || "0") + 1).toString()
                              }));
                            } else {
                              const current = parseInt(workstationFormData.count || "0") || 0;
                              setWorkstationFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="hidden min-[400px]:block h-6 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-workstation"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setWorkstationFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-workstation"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>



              <form onSubmit={handleWorkstationSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="Name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="Name"
                    name="Name"
                    value={workstationFormData.Name || ""}
                    onChange={handleWorkstationInputChange}
                    required
                  />
                </div>

                {/* Processor */}
                <div className="space-y-2">
                  <Label htmlFor="Processor">
                    Processor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="Processor"
                    name="Processor"
                    value={workstationFormData.Processor || ""}
                    onChange={handleWorkstationInputChange}
                    required
                  />
                </div>

                {/* Generation */}
                <div className="space-y-2">
                  <Label htmlFor="Generation">Generation</Label>
                  <Input
                    id="Generation"
                    name="Generation"
                    value={workstationFormData.Generation || ""}
                    onChange={handleWorkstationInputChange}
                  />
                </div>

                {/* RAM Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MemoryStick className="h-3.5 w-3.5" />
                    RAM
                  </Label>
                  <MultiSelect
                    options={ramOptions.map(ram => {
                      const pId = ram.pyramidsID || ram.phyramidID || ram.PyramidID || ram.pyramid_id || ram.service_id || ram.serviceTag || ram.serviceID || ram.service_tag || 'N/A';
                      return { label: `${ram.brand} - ${ram.size} (${ram.type}) (${pId})`, value: ram.id.toString() };
                    })}
                    selected={workstationFormData.ramIDs}
                    onChange={(val) => setWorkstationFormData(prev => ({ ...prev, ramIDs: val }))}
                    placeholder="Select RAM..."
                  />
                </div>

                {/* SSD Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    SSD
                  </Label>
                  <MultiSelect
                    options={ssdOptions.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.ssdSize} (${pId})`, value: item.ssdID.toString() };
                    })}
                    selected={workstationFormData.ssdIDs}
                    onChange={(val) => setWorkstationFormData(prev => ({ ...prev, ssdIDs: val }))}
                    placeholder="Select SSD..."
                  />
                </div>

                {/* NVMe Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    NVMe
                  </Label>
                  <MultiSelect
                    options={nvmeOptions.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.Size} (${pId})`, value: item.ID.toString() };
                    })}
                    selected={workstationFormData.nvmeIDs}
                    onChange={(val) => setWorkstationFormData(prev => ({ ...prev, nvmeIDs: val }))}
                    placeholder="Select NVMe..."
                  />
                </div>

                {/* M.2 Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    M.2
                  </Label>
                  <MultiSelect
                    options={m2Options.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.size} (${pId})`, value: item.id.toString() };
                    })}
                    selected={workstationFormData.m2IDs}
                    onChange={(val) => setWorkstationFormData(prev => ({ ...prev, m2IDs: val }))}
                    placeholder="Select M.2..."
                  />
                </div>

                {/* Graphics Card Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    Graphics Card
                  </Label>
                  <MultiSelect
                    options={gpuOptions.map(gpu => {
                      const pId = gpu.pyramidsID || gpu.phyramidID || gpu.PyramidID || gpu.pyramid_id || gpu.service_id || gpu.serviceTag || gpu.serviceID || gpu.service_tag || 'N/A';
                      return { label: `${gpu.brand} - ${gpu.model} (${gpu.size}) (${pId})`, value: gpu.ID.toString() };
                    })}
                    selected={workstationFormData.graphicscardIDs}
                    onChange={(val) => setWorkstationFormData(prev => ({ ...prev, graphicscardIDs: val }))}
                    placeholder="Select Graphics Card..."
                  />
                </div>

                {/* Service ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serviceID">
                      {isBulk ? "Service Tags" : "Service Tag"} <span className="text-red-500">*</span>
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {workstationFormData.serviceID.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="serviceID"
                        name="serviceID"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={workstationFormData.serviceID || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setWorkstationFormData(prev => ({ ...prev, serviceID: val, count: lines.toString() }));
                        }}
                        placeholder="Scan or paste Service Tags here...\nSVC-001\nSVC-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input
                      id="serviceID"
                      name="serviceID"
                      value={workstationFormData.serviceID || ""}
                      onChange={handleWorkstationInputChange}
                    />
                  )}
                </div>

                {/* Pyramids ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="pyramidsID">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(workstationFormData.pyramidsID?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (workstationFormData.serviceID.split(/[\n,]+/).filter(s => s.trim()).length || 0) && workstationFormData.pyramidsID
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {workstationFormData.pyramidsID?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="pyramidsID"
                      name="pyramidsID"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={workstationFormData.pyramidsID || ''}
                      onChange={(e) => setWorkstationFormData(prev => ({ ...prev, pyramidsID: e.target.value }))}
                      placeholder="PID-001&#10;PID-002"
                    />
                  ) : (
                    <Input
                      id="pyramidsID"
                      name="pyramidsID"
                      value={workstationFormData.pyramidsID || ""}
                      onChange={handleWorkstationInputChange}
                    />
                  )}
                </div>

                {/* Date of Purchase */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfPurchase">
                    Date of Purchase <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfPurchase"
                    name="dateOfPurchase"
                    type="date"
                    value={workstationFormData.dateOfPurchase || ""}
                    onChange={handleWorkstationInputChange}
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Saving..." : "Add Workstation"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleWorkstationReset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="mobile_workstation">
              {error && (
                <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-mobile-workstation" className="text-base font-semibold text-primary">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
                      Enable to add multiple Items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col items-start min-[400px]:flex-row min-[400px]:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              const currentCount = parseInt(mobileWorkstationFormData.count || "0") || 0;
                              const tags = mobileWorkstationFormData.serviceTag.split(/\r?\n/);
                              const pyramids = mobileWorkstationFormData.pyramidsID ? mobileWorkstationFormData.pyramidsID.split(/\r?\n/) : [];

                              if (currentCount > tags.length) {
                                setMobileWorkstationFormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                              } else if (tags.length > 0) {
                                tags.pop();
                                if (pyramids.length > tags.length) pyramids.length = tags.length;
                                setMobileWorkstationFormData(prev => ({
                                  ...prev,
                                  serviceTag: tags.join('\n'),
                                  pyramidsID: pyramids.join('\n'),
                                  count: tags.length.toString()
                                }));
                              }
                            } else {
                              const current = parseInt(mobileWorkstationFormData.count || "0") || 0;
                              if (current > 1) {
                                setMobileWorkstationFormData(prev => ({ ...prev, count: (current - 1).toString() }));
                              }
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-16">
                          <Input
                            id="count-header"
                            name="count"
                            type="number"
                            className="h-8 px-1 text-center"
                            value={mobileWorkstationFormData.count}
                            onChange={handleMobileWorkstationInputChange}
                            min="1"
                            placeholder="Qty"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            if (isBulk) {
                              setMobileWorkstationFormData(prev => ({
                                ...prev,
                                serviceTag: prev.serviceTag + (prev.serviceTag ? '\n' : ''),
                                count: (parseInt(prev.count || "0") + 1).toString()
                              }));
                            } else {
                              const current = parseInt(mobileWorkstationFormData.count || "0") || 0;
                              setMobileWorkstationFormData(prev => ({ ...prev, count: (current + 1).toString() }));
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="hidden xs:block h-6 w-px bg-slate-200 mx-1"></div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-mobile-workstation"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setMobileWorkstationFormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-mobile-workstation"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span
                          className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleMobileWorkstationSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Brand */}
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={mobileWorkstationFormData.brand || ""}
                    onChange={handleMobileWorkstationInputChange}
                  />
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    value={mobileWorkstationFormData.model || ""}
                    onChange={handleMobileWorkstationInputChange}
                  />
                </div>

                {/* Processor */}
                {/* Processor Brand */}
                <div className="space-y-2">
                  <Label htmlFor="processor_brand">
                    Processor Brand <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="processor_brand"
                    name="processor_brand"
                    value={mobileWorkstationFormData.processor_brand || ""}
                    onChange={handleMobileWorkstationInputChange}
                    required
                  />
                </div>

                {/* Processor Model */}
                <div className="space-y-2">
                  <Label htmlFor="processor_model">
                    Processor Model <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="processor_model"
                    name="processor_model"
                    value={mobileWorkstationFormData.processor_model || ""}
                    onChange={handleMobileWorkstationInputChange}
                    required
                  />
                </div>

                {/* Generation */}
                <div className="space-y-2">
                  <Label htmlFor="generation">Generation</Label>
                  <Input
                    id="generation"
                    name="generation"
                    value={mobileWorkstationFormData.generation || ""}
                    onChange={handleMobileWorkstationInputChange}
                  />
                </div>

                {/* RAM (Multi-Select) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MemoryStick className="h-3.5 w-3.5" />
                    RAM
                  </Label>
                  <MultiSelect
                    options={ramOptions.map(ram => {
                      const pId = ram.pyramidsID || ram.phyramidID || ram.PyramidID || ram.pyramid_id || ram.service_id || ram.serviceTag || ram.serviceID || ram.service_tag || 'N/A';
                      return { label: `${ram.brand} - ${ram.size} (${ram.type}) (${pId})`, value: ram.id.toString() };
                    })}
                    selected={mobileWorkstationFormData.ramIDs}
                    onChange={(val) => setMobileWorkstationFormData(prev => ({ ...prev, ramIDs: val }))}
                    placeholder="Select RAM..."
                  />
                </div>

                {/* SSD (Multi-Select) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    SSD
                  </Label>
                  <MultiSelect
                    options={ssdOptions.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.ssdSize} (${pId})`, value: item.ssdID.toString() };
                    })}
                    selected={mobileWorkstationFormData.ssdIDs}
                    onChange={(val) => setMobileWorkstationFormData(prev => ({ ...prev, ssdIDs: val }))}
                    placeholder="Select SSD..."
                  />
                </div>

                {/* NVMe (Multi-Select) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    NVMe
                  </Label>
                  <MultiSelect
                    options={nvmeOptions.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.Size} (${pId})`, value: item.ID.toString() };
                    })}
                    selected={mobileWorkstationFormData.nvmeIDs}
                    onChange={(val) => setMobileWorkstationFormData(prev => ({ ...prev, nvmeIDs: val }))}
                    placeholder="Select NVMe..."
                  />
                </div>

                {/* M.2 (Multi-Select) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5" />
                    M.2
                  </Label>
                  <MultiSelect
                    options={m2Options.map(item => {
                      const pId = item.pyramidsID || item.phyramidID || item.PyramidID || item.pyramid_id || item.service_id || item.serviceTag || item.serviceID || item.service_tag || 'N/A';
                      return { label: `${item.brand} - ${item.size} (${pId})`, value: item.id.toString() };
                    })}
                    selected={mobileWorkstationFormData.m2IDs}
                    onChange={(val) => setMobileWorkstationFormData(prev => ({ ...prev, m2IDs: val }))}
                    placeholder="Select M.2..."
                  />
                </div>



                {/* Adapter */}
                <div className="space-y-2">
                  <Label htmlFor="adapter">Adapter</Label>
                  <Input
                    id="adapter"
                    name="adapter"
                    value={mobileWorkstationFormData.adapter || ""}
                    onChange={handleMobileWorkstationInputChange}
                    placeholder="e.g. 65W, 130W"
                  />
                </div>

                {/* Graphics Card ID (Input) */}
                <div className="space-y-2">
                  <Label htmlFor="graphicscardID">Graphics Card</Label>
                  <Input
                    id="graphicscardID"
                    name="graphicscardID"
                    value={mobileWorkstationFormData.graphicscardID || ""}
                    onChange={handleMobileWorkstationInputChange}
                  />
                </div>

                {/* Service Tag */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="serviceTag">
                      {isBulk ? "Service Tags" : "Service Tag"}
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {mobileWorkstationFormData.serviceTag.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="serviceTag"
                        name="serviceTag"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={mobileWorkstationFormData.serviceTag || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setMobileWorkstationFormData(prev => ({ ...prev, serviceTag: val, count: lines.toString() }));
                        }}
                        placeholder="Scan or paste Serial Numbers here...&#10;SN-001&#10;SN-002"
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input
                      id="serviceTag"
                      name="serviceTag"
                      value={mobileWorkstationFormData.serviceTag || ""}
                      onChange={handleMobileWorkstationInputChange}
                    />
                  )}
                </div>

                {/* Pyramids ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="pyramidsID">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(mobileWorkstationFormData.pyramidsID?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (mobileWorkstationFormData.serviceTag.split(/[\n,]+/).filter(s => s.trim()).length || 0) && mobileWorkstationFormData.pyramidsID
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {mobileWorkstationFormData.pyramidsID?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="pyramidsID"
                      name="pyramidsID"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={mobileWorkstationFormData.pyramidsID || ''}
                      onChange={(e) => setMobileWorkstationFormData(prev => ({ ...prev, pyramidsID: e.target.value }))}
                      placeholder="PID-001&#10;PID-002"
                    />
                  ) : (
                    <Input
                      id="pyramidsID"
                      name="pyramidsID"
                      value={mobileWorkstationFormData.pyramidsID || ""}
                      onChange={handleMobileWorkstationInputChange}
                    />
                  )}
                </div>

                {/* Warranty End Date */}
                <div className="space-y-2">
                  <Label htmlFor="warrantyEndDate">Warranty End Date</Label>
                  <Input
                    id="warrantyEndDate"
                    name="warrantyEndDate"
                    type="date"
                    value={mobileWorkstationFormData.warrantyEndDate || ""}
                    onChange={handleMobileWorkstationInputChange}
                  />
                </div>

                {/* Date of Purchase */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfPurchase">
                    Date of Purchase <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfPurchase"
                    name="dateOfPurchase"
                    type="date"
                    value={mobileWorkstationFormData.dateOfPurchase || ""}
                    onChange={handleMobileWorkstationInputChange}
                    required
                  />
                </div>

                {/* Delivery Company */}


                {/* Buttons */}
                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Adding..." : "Add Mobile Workstation"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleMobileWorkstationReset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="m_2">
              {error && (
                <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="bulk-mode-toggle-m2" className="text-base font-semibold">
                      Bulk Add Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable to add multiple Items by pasting lists of IDs.
                    </p>
                  </div>
                  <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 sm:gap-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground mr-2">Quantity:</span>
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => {
                        if (isBulk) {
                          const currentCount = parseInt(m2FormData.count || "0") || 0;
                          const serviceIds = m2FormData.service_id.split(/\r?\n/);
                          const pyramids = m2FormData.phyramidID ? m2FormData.phyramidID.split(/\r?\n/) : [];

                          if (currentCount > serviceIds.length) {
                            setM2FormData(prev => ({ ...prev, count: (currentCount - 1).toString() }));
                          } else if (serviceIds.length > 0) {
                            serviceIds.pop();
                            if (pyramids.length > serviceIds.length) pyramids.length = serviceIds.length;
                            setM2FormData(prev => ({
                              ...prev,
                              service_id: serviceIds.join('\n'),
                              phyramidID: pyramids.join('\n'),
                              count: serviceIds.length.toString()
                            }));
                          }
                        } else {
                          const current = parseInt(m2FormData.count || "0") || 0;
                          if (current > 1) {
                            setM2FormData(prev => ({ ...prev, count: (current - 1).toString() }));
                          }
                        }
                      }}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="relative w-20">
                        <Input
                          id="count-header"
                          name="count"
                          type="number"
                          className="h-8 text-center"
                          value={m2FormData.count}
                          onChange={handleM2InputChange}
                          min="1"
                          placeholder="Qty"
                        />
                      </div>
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => {
                        if (isBulk) {
                          setM2FormData(prev => ({
                            ...prev,
                            service_id: prev.service_id + (prev.service_id ? '\n' : ''),
                            count: (parseInt(prev.count || "0") + 1).toString()
                          }));
                        } else {
                          const current = parseInt(m2FormData.count || "0") || 0;
                          setM2FormData(prev => ({ ...prev, count: (current + 1).toString() }));
                        }
                      }}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="hidden xs:block h-6 w-px bg-slate-200 mx-2"></div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="bulk-mode-toggle-m2"
                        className="peer sr-only"
                        checked={isBulk}
                        onChange={(e) => {
                          setIsBulk(e.target.checked);
                          if (e.target.checked) setM2FormData(prev => ({ ...prev, count: "0" }));
                        }}
                      />
                      <Label
                        htmlFor="bulk-mode-toggle-m2"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${isBulk ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span className={`${isBulk ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-background transition-transform`} />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleM2Submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Brand */}
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand <span className="text-red-500">*</span></Label>
                  <Input id="brand" name="brand" value={m2FormData.brand} onChange={handleM2InputChange} required />
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input id="size" name="size" value={m2FormData.size} onChange={handleM2InputChange} placeholder="e.g. 1TB" />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    name="type"
                    value={m2FormData.type || ""}
                    onChange={handleM2InputChange}
                    placeholder="e.g., NVMe, SATA"
                  />
                </div>

                {/* Form Factor */}
                <div className="space-y-2">
                  <Label htmlFor="formFactor">
                    Form Factor <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={m2FormData.formFactor}
                    onValueChange={(value) => setM2FormData(prev => ({ ...prev, formFactor: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Form Factor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Desktop">Desktop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="service_id">
                      {isBulk ? "Service Tags" : "Service Tag"} <span className="text-red-500">*</span>
                    </Label>
                    {isBulk && (
                      <span className="text-xs text-muted-foreground">
                        {m2FormData.service_id.split(/[\n,]+/).filter(s => s.trim()).length} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <>
                      <textarea
                        id="service_id"
                        name="service_id"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={m2FormData.service_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          const lines = val.split(/[\n,]+/).filter(s => s.trim()).length;
                          setM2FormData(prev => ({ ...prev, service_id: val, count: lines.toString() }));
                        }}
                        placeholder="Scan or paste Service Tags here...&#10;SVC-001&#10;SVC-002"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Separate IDs with newlines or commas.</p>
                    </>
                  ) : (
                    <Input id="service_id" name="service_id" value={m2FormData.service_id} onChange={handleM2InputChange} required />
                  )}
                </div>

                {/* Pyramid ID */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="phyramidID">
                      {isBulk ? "Pyramid IDs" : "Pyramid ID"}
                    </Label>
                    {isBulk && (
                      <span className={`text-xs ${(m2FormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0) !==
                        (m2FormData.service_id.split(/[\n,]+/).filter(s => s.trim()).length || 0) && m2FormData.phyramidID
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                        }`}>
                        {m2FormData.phyramidID?.split(/[\n,]+/).filter(s => s.trim()).length || 0} items
                      </span>
                    )}
                  </div>
                  {isBulk ? (
                    <textarea
                      id="phyramidID"
                      name="phyramidID"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={m2FormData.phyramidID}
                      onChange={(e) => setM2FormData(prev => ({ ...prev, phyramidID: e.target.value }))}
                      placeholder="PID-001&#10;PID-002"
                    />
                  ) : (
                    <Input id="phyramidID" name="phyramidID" value={m2FormData.phyramidID} onChange={handleM2InputChange} />
                  )}
                </div>

                {/* Date of Purchase */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfPurchase">Date of Purchase <span className="text-red-500">*</span></Label>
                  <Input type="date" id="dateOfPurchase" name="dateOfPurchase" value={m2FormData.dateOfPurchase} onChange={handleM2InputChange} required />
                </div>

                {/* Form Actions */}
                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Adding..." : "Add M.2"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleM2Reset} className="w-full sm:w-auto">
                    Reset
                  </Button>
                </div>
              </form>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}