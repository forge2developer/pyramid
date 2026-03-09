import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import api from "@/lib/axios"
import { getAuthCookie } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Pencil, Trash2, RefreshCw, Undo2, Building2, Phone, MapPin, User, Info, Plus, FileText } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ActionTooltip
} from "@/components/common/action-tooltip"
import { Checkbox } from "@/components/ui/checkbox"


interface Company {
  id: number
  company_name: string
  [key: string]: any
}

interface Product {
  id: number
  CompanyID: number
  isActive: number
  [key: string]: any
}

interface CompanyDetailsResponse {
  success: boolean
  data: {
    company: Company
    products: {
      laptop: Product[]
      monitor: Product[]
      ram: Product[]
      system: Product[]
      workstation: Product[]
      hdd: Product[]
      ssd: Product[]
      nvme: Product[]
      graphicscard: Product[]
      mobileworkstation: Product[]
      m_2: Product[]
    }
    pagination: {
      currentPage: number
      itemsPerPage: number
      note: string
    }
  }
}

const PRODUCT_COLUMNS: Record<string, { label: string; key: string }[]> = {
  laptop: [
    { label: "Brand", key: "brand" },
    { label: "Model", key: "model" },
    { label: "Processor", key: "processor_brand" },
    { label: "Graphics", key: "graphics" },
    { label: "Service Tag", key: "service_id" },
  ],
  m_2: [
    { label: "Brand", key: "brand" },
    { label: "Size", key: "size" },
    { label: "Type", key: "type" },
    { label: "Form Factor", key: "form_factor" },
    { label: "Service Tag", key: "service_id" },
  ],
  monitor: [
    { label: "Name", key: "name" },
    { label: "Size", key: "size" },
    { label: "Display", key: "display" },
    { label: "Service Tag", key: "service_tag" },
  ],
  ram: [
    { label: "Brand", key: "brand" },
    { label: "Size", key: "size" },
    { label: "Type", key: "type" },
    { label: "Service Tag", key: "service_id" },
  ],
  system: [
    { label: "Name", key: "Name" },
    { label: "Processor", key: "Processor" },
    { label: "Config", key: "configuration" },
    { label: "RAM", key: "ramCount" },
    { label: "SSD", key: "ssdCount" },
    { label: "NVMe", key: "nvmeCount" },
    { label: "Service Tag", key: "serviceID" },
  ],
  workstation: [
    { label: "Processor", key: "processor" },
    { label: "Config", key: "configuration" },
    { label: "Display", key: "display" },
    { label: "Service Tag", key: "serviceTag" },
  ],
  mobileworkstation: [
    { label: "Brand", key: "brand" },
    { label: "Model", key: "model" },
    { label: "Processor Brand", key: "processor_brand" },
    { label: "Processor Model", key: "processor_model" },
    { label: "RAM", key: "ram_details" },
    { label: "SSD", key: "ssd_details" },
    { label: "NVMe", key: "nvme_details" },
    { label: "M.2", key: "m2_details" },
    { label: "Graphics", key: "graphicscard_details" },
    { label: "Service Tag", key: "service_id" },
    { label: "Pyramid ID", key: "phyramidID" },
  ],
  hdd: [
    { label: "Brand", key: "brand" },
    { label: "Size", key: "size" },
    { label: "Speed", key: "speed" },
    { label: "Service Tag", key: "serviceTag" },
  ],
  ssd: [
    { label: "Brand", key: "brand" },
    { label: "Size", key: "ssdSize" },
    { label: "Service Tag", key: "serviceTag" },
  ],
  nvme: [
    { label: "Brand", key: "brand" },
    { label: "Size", key: "Size" },
    { label: "Service Tag", key: "serviceTag" },
  ],
  graphicscard: [
    { label: "Brand", key: "brand" },
    { label: "Model", key: "model" },
    { label: "Size", key: "size" },
    { label: "Service Tag", key: "serviceTag" },
  ],
};

export default function CompanyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CompanyDetailsResponse["data"] | null>(null)

  // State for Edit/Delete actions
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: string; id: any } | null>(null)
  const [removingItem, setRemovingItem] = useState<{ type: string; item: any } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // State for Action Modal (Scrap/Replace/Return)
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; type: string; item: { type: string; data: any } } | null>(null)
  const [actionReason, setActionReason] = useState("")

  // State for Replacement Logic
  const [replacementItems, setReplacementItems] = useState<any[]>([])
  const [pendingReplacementItems, setPendingReplacementItems] = useState<any[]>([])
  const [selectedReplacement, setSelectedReplacement] = useState<string>("")
  const [loadingReplacements, setLoadingReplacements] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // RAM Management State
  const [availableRams, setAvailableRams] = useState<any[]>([])
  const [assignedRams, setAssignedRams] = useState<any[]>([])
  const [initialAssignedRams, setInitialAssignedRams] = useState<any[]>([]) // To track changes
  const [selectedRamToAdd, setSelectedRamToAdd] = useState<string>("")

  // SSD Management State
  const [availableSSDs, setAvailableSSDs] = useState<any[]>([])
  const [assignedSSDs, setAssignedSSDs] = useState<any[]>([])
  const [initialAssignedSSDs, setInitialAssignedSSDs] = useState<any[]>([])
  const [selectedSSDToAdd, setSelectedSSDToAdd] = useState<string>("")

  // NVMe Management State
  const [availableNvmes, setAvailableNvmes] = useState<any[]>([])
  const [assignedNvmes, setAssignedNvmes] = useState<any[]>([])
  const [initialAssignedNvmes, setInitialAssignedNvmes] = useState<any[]>([])
  const [selectedNvmeToAdd, setSelectedNvmeToAdd] = useState<string>("")

  // M.2 Management State
  const [availableM2s, setAvailableM2s] = useState<any[]>([])
  const [assignedM2s, setAssignedM2s] = useState<any[]>([])
  const [initialAssignedM2s, setInitialAssignedM2s] = useState<any[]>([])
  const [selectedM2ToAdd, setSelectedM2ToAdd] = useState<string>("")

  // Graphics Card Management State
  const [availableGraphicsCards, setAvailableGraphicsCards] = useState<any[]>([])
  const [assignedGraphicsCards, setAssignedGraphicsCards] = useState<any[]>([])
  const [initialAssignedGraphicsCards, setInitialAssignedGraphicsCards] = useState<any[]>([])
  const [selectedGraphicsCardToAdd, setSelectedGraphicsCardToAdd] = useState<string>("")

  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [historyStartDate, setHistoryStartDate] = useState("")
  const [historyEndDate, setHistoryEndDate] = useState("")
  const [historyLogType, setHistoryLogType] = useState("All")
  const [historyProduct, setHistoryProduct] = useState("All")
  const [downloadingActivityPDF, setDownloadingActivityPDF] = useState(false)
  const [downloadingCurrentPDF, setDownloadingCurrentPDF] = useState(false)
  const [pdfActivityConfirmModalOpen, setPdfActivityConfirmModalOpen] = useState(false)
  const [pdfCurrentConfirmModalOpen, setPdfCurrentConfirmModalOpen] = useState(false)

  // Product Selection State for Manual Challan
  const [selectedProducts, setSelectedProducts] = useState<Record<string, any[]>>({})
  const [challanModalOpen, setChallanModalOpen] = useState(false)

  // Challan Form State
  const [challanRemarks, setChallanRemarks] = useState("")
  const [challanCompanyName, setChallanCompanyName] = useState("")
  const [challanAddress, setChallanAddress] = useState("")
  const [challanDate, setChallanDate] = useState<Date | undefined>(new Date())
  const [isGeneratingChallan, setIsGeneratingChallan] = useState(false)

  const toggleProductSelection = (type: string, item: any) => {
    const id = getSafeId(item);
    setSelectedProducts(prev => {
      const currentList = prev[type] || [];
      const isSelected = currentList.find(i => getSafeId(i) === id);

      let newList;
      if (isSelected) {
        newList = currentList.filter(i => getSafeId(i) !== id);
      } else {
        newList = [...currentList, item];
      }

      return { ...prev, [type]: newList };
    });
  };

  const toggleSelectAll = (type: string, items: any[]) => {
    setSelectedProducts(prev => {
      const currentList = prev[type] || [];
      // Check if all *visible* items are selected
      const allSelected = items.length > 0 && items.every(item => currentList.some(i => getSafeId(i) === getSafeId(item)));

      let newList;
      if (allSelected) {
        // Deselect current page items
        const idsToRemove = new Set(items.map(i => getSafeId(i)));
        newList = currentList.filter(i => !idsToRemove.has(getSafeId(i)));
      } else {
        // Select current page items
        const existingIds = new Set(currentList.map(i => getSafeId(i)));
        const newItems = items.filter(i => !existingIds.has(getSafeId(i)));
        newList = [...currentList, ...newItems];
      }
      return { ...prev, [type]: newList };
    });
  };

  const isProductSelected = (type: string, item: any) => {
    const list = selectedProducts[type] || [];
    return list.some(i => getSafeId(i) === getSafeId(item));
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedProducts).reduce((acc, curr) => acc + curr.length, 0);
  };



  const handleGenerateManualChallan = async () => {
    setIsGeneratingChallan(true);
    try {
      const selected = { ...selectedProducts };
      // Filter out empty keys
      Object.keys(selected).forEach(key => {
        if (!selected[key] || selected[key].length === 0) delete selected[key];
      });

      if (Object.keys(selected).length === 0) {
        toast.error("No products selected");
        return;
      }

      await handleDownloadChallan('DELIVERY', selected, challanRemarks, challanDate, challanCompanyName, challanAddress);
      setChallanModalOpen(false);
      setSelectedProducts({});
      setChallanRemarks("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate challan");
    } finally {
      setIsGeneratingChallan(false);
    }
  };

  useEffect(() => {
    if (data?.company) {
      setChallanCompanyName(data.company.company_name || "")
      setChallanAddress(data.company.location || "")
    }
  }, [data])

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;

      try {
        setLoading(true)
        // Backend expects companyID in body, and page/limit in query
        const response = await api.post(`/Companies/getCompanyDetails`, {
          companyID: id
        }, {
          params: {
            page: 1,
            limit: 50 // Fetching more to show meaningful data
          }
        })

        if (response.data.success) {
          setData(response.data.data)
        } else {
          setError(response.data.message || "Failed to fetch company details")
        }
      } catch (err) {
        console.error("Error fetching company details:", err)
        setError("An error occurred while fetching company details")
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
        </div>
      </div>
    )
  }

  const { company, products } = data!


  // Helper to safely get ID regardless of case
  const getSafeId = (item: any) => item.id || item.ID || item.Id || item.iD || item.systemID || item.ssdID;

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

  // Helper to filter keys case-insensitively (for fallback)
  const isExcludedKey = (key: string) => {
    const lowerKey = key.toLowerCase();
    return ['id', 'companyid', 'isactive'].includes(lowerKey);
  };

  // Helper to get API URL based on type and action
  const getApiUrl = (type: string, action: 'edit' | 'delete') => {
    const formattedType = type.toLowerCase();
    const isEdit = action === 'edit';

    // Map frontend types to backend endpoint suffixes
    let suffix = "";
    switch (formattedType) {
      case 'laptop': suffix = isEdit ? 'Laptop' : 'Laptops'; break;
      case 'system': suffix = isEdit ? 'System' : 'Desktop'; break;
      case 'ram': suffix = 'Ram'; break;
      case 'ssd': suffix = 'SSD'; break;
      case 'nvme': suffix = isEdit ? 'Nvme' : 'NVMe'; break;
      case 'hdd': suffix = 'HDD'; break;
      case 'monitor': suffix = 'Monitor'; break;
      case 'workstation': suffix = 'Workstation'; break;
      case 'graphicscard': suffix = 'GraphicsCard'; break;
      case 'mobileworkstation': suffix = 'MobileWorkStation'; break;
      case 'm_2': suffix = 'M_2'; break;
      default: suffix = formattedType.charAt(0).toUpperCase() + formattedType.slice(1);
    }

    const prefix = isEdit ? 'update' : action;
    return `/inventory/${prefix}${suffix}`;
  };

  // Helper to get Suffix for Fetching (reused logic from getApiUrl conceptually)
  const getSuffix = (type: string) => {
    const formattedType = type.toLowerCase();
    switch (formattedType) {
      case 'laptop': return 'Laptops';
      case 'system': return 'Systems';
      case 'ram': return 'Ram';
      case 'ssd': return 'SSD';
      case 'nvme': return 'NVMe';
      case 'hdd': return 'HDD';
      case 'monitor': return 'Monitor';
      case 'workstation': return 'Workstation';
      case 'graphicscard': return 'GraphicsCard';
      case 'm_2': return 'M_2';
      default: return formattedType.charAt(0).toUpperCase() + formattedType.slice(1);
    }
  }

  const handleEdit = async (type: string, item: any) => {
    setEditingItem({ type, data: { ...item } })

    // Initialize RAM, SSD, NVMe management for laptops, systems (desktops), workstations, and mobile workstations
    const lowerType = type.toLowerCase();
    if (['laptop', 'system', 'workstation', 'mobileworkstation'].includes(lowerType)) {
      const itemId = getSafeId(item);

      // --- Fetch Assigned Components Asynchronously ---
      const fetchAssignedComponents = async () => {
        try {
          const filterProps: any = {};
          if (lowerType === 'laptop') filterProps.LaptopID = itemId;
          else if (lowerType === 'system') filterProps.SystemID = itemId;
          else if (lowerType === 'workstation') filterProps.WorkstationID = itemId;
          else if (lowerType === 'mobileworkstation') filterProps.MobileWorkstationID = itemId;

          // 1. RAM
          const ramRes = await api.post("/inventory/getAllRam", { ...filterProps });
          if (ramRes.data?.success) {
            const rams = ramRes.data.data.ram || [];
            setAssignedRams(rams);
            setInitialAssignedRams(rams);
          }

          // 2. SSD
          const ssdRes = await api.post("/inventory/getAllSSD", { ...filterProps });
          if (ssdRes.data?.success) {
            const ssds = ssdRes.data.data.ssd || [];
            setAssignedSSDs(ssds);
            setInitialAssignedSSDs(ssds);
          }

          // 3. NVMe
          const nvmeRes = await api.post("/inventory/getAllnvme", { ...filterProps });
          if (nvmeRes.data?.success) {
            const nvmes = nvmeRes.data.data.nvme || [];
            setAssignedNvmes(nvmes);
            setInitialAssignedNvmes(nvmes);
          }

          // 4. M.2
          const m2Res = await api.post("/inventory/getAllM_2", { ...filterProps });
          if (m2Res.data?.success) {
            const m2s = m2Res.data.data.m_2 || [];
            setAssignedM2s(m2s);
            setInitialAssignedM2s(m2s);
          }

          // 5. Graphics Card
          if (['system', 'workstation', 'mobileworkstation'].includes(lowerType)) {
            let gpuFilter = { ...filterProps };
            // Special case for Mobile Workstation: Fetch by ID if available
            if (lowerType === 'mobileworkstation') {
              const gID = getValueIgnoreCase(item, 'graphicscardID');
              if (gID) {
                gpuFilter = { id: gID }; // Fetch specific card
              } else {
                gpuFilter = { MobileWorkstationID: itemId }; // Standard filter (might return empty if not set on card)
              }
            }

            const gpuRes = await api.post("/inventory/getallGraphicsCard", gpuFilter);
            if (gpuRes.data?.success) {
              const gpus = gpuRes.data.data.graphicscard || [];
              setAssignedGraphicsCards(gpus);
              setInitialAssignedGraphicsCards(gpus);
            }
          } else {
            setAssignedGraphicsCards([]);
            setInitialAssignedGraphicsCards([]);
          }

        } catch (error) {
          console.error("Failed to fetch assigned components", error);
        }
      };

      fetchAssignedComponents();

      // Reset selection states
      setSelectedRamToAdd("");
      setSelectedSSDToAdd("");
      setSelectedNvmeToAdd("");
      setSelectedM2ToAdd("");
      setSelectedGraphicsCardToAdd("");


      // --- Fetch Resources ---
      try {
        // 1. RAM
        const ramRes = await api.post("/inventory/getAllRam", { brand: "", size: "", type: "", service_id: "", pyramid_id: "" });
        if (ramRes.data?.data?.ram) {
          const available = ramRes.data.data.ram.filter((r: any) =>
            !getValueIgnoreCase(r, 'laptopID') && !getValueIgnoreCase(r, 'systemID') && !getValueIgnoreCase(r, 'WorkstationID') && !getValueIgnoreCase(r, 'MobileWorkstationID') &&
            !getValueIgnoreCase(r, 'laptop_id') && !getValueIgnoreCase(r, 'desktop_id') && !getValueIgnoreCase(r, 'workstation_id') && !getValueIgnoreCase(r, 'mobileworkstation_id')
          );
          setAvailableRams(available);
        }

        // 2. SSD
        const ssdRes = await api.post("/inventory/getAllSSD", { brand: "", size: "", service_tag: "", SerialNumber: "" });
        if (ssdRes.data?.data?.ssd) {
          const available = ssdRes.data.data.ssd.filter((s: any) =>
            getValueIgnoreCase(s, 'isAvailable') == 1

          );
          setAvailableSSDs(available);
        }

        // 3. NVMe
        const nvmeRes = await api.post("/inventory/getAllnvme", { brand: "", Size: "", serialNumber: "", serviceTag: "" });
        if (nvmeRes.data?.data?.nvme) {
          const available = nvmeRes.data.data.nvme.filter((n: any) =>
            getValueIgnoreCase(n, 'isAvailable') == 1
          );
          setAvailableNvmes(available);
        }

        // 4. M.2
        const m2Res = await api.post("/inventory/getAllM_2", { brand: "", size: "", type: "", service_id: "", phyramidID: "", inventoryID: "" });
        if (m2Res.data?.data?.m_2) {
          const available = m2Res.data.data.m_2.filter((m: any) =>
            getValueIgnoreCase(m, 'isAvailable') == 1
          );
          setAvailableM2s(available);
        }

        // 5. Graphics Card
        if (['system', 'workstation', 'mobileworkstation'].includes(lowerType)) {
          const gpuRes = await api.post("/inventory/getallGraphicsCard", { brand: "", model: "", size: "", serviceTag: "" });
          if (gpuRes.data?.data?.graphicscard) {
            const available = gpuRes.data.data.graphicscard.filter((g: any) =>
              getValueIgnoreCase(g, 'isAvailable') == 1
            );
            setAvailableGraphicsCards(available);
          }
        }

      } catch (error) {
        console.error("Failed to fetch available components", error);
      }
    }
  }





  const handleReplace = async (type: string, item: any) => {
    // Reset previous selection
    setReplacementItems([]);
    setPendingReplacementItems([]);
    setSelectedReplacement("");
    setLoadingReplacements(true);

    // Open modal immediately to show intent, can show loading inside
    setActionModal({ isOpen: true, type: 'Replace', item: { type, data: item } });

    try {
      const suffixMap: Record<string, string> = {
        laptop: 'Laptops', system: 'Systems', monitor: 'Monitor', ram: 'Ram',
        ssd: 'SSD', hdd: 'HDD', nvme: 'NVMe', workstation: 'Workstation',
        mobile_workstation: 'MobileWorkstation', mobileworkstation: 'MobileWorkstation',
        graphicscard: 'GraphicsCard', m_2: 'M_2'
      };
      const suffix = suffixMap[type.toLowerCase()] || (type.charAt(0).toUpperCase() + type.slice(1));
      const endpoint = `/inventory/getall${suffix}`;
      // Fetch ALL items (no isAvailable filter) to get both pending and available
      const response = await api.post(endpoint, {}, {
        params: { page: 1, limit: 1000 }
      });

      if (response.data && response.data.success) {
        const responseData = response.data.data;
        let items: any[] = [];

        if (Array.isArray(responseData)) {
          items = responseData;
        } else if (responseData && typeof responseData === 'object') {
          const entries = Object.entries(responseData);
          for (const [k, v] of entries) {
            if (Array.isArray(v) && k.toLowerCase().includes(type.toLowerCase())) {
              items = v as any[];
              break;
            }
            if (Array.isArray(v) && k.toLowerCase().includes('desktop') && type.toLowerCase() === 'system') {
              items = v as any[];
              break;
            }
          }
          // @ts-ignore
          if (items.length === 0 && Array.isArray(responseData.data)) items = responseData.data;
          // @ts-ignore
          if (items.length === 0 && Array.isArray(responseData[type.toLowerCase() + 's'])) items = responseData[type.toLowerCase() + 's'];
        }

        const currentId = getSafeId(item);

        // Split into pending and available
        const pending = items.filter(i => i.replacement_status === 'pending' && getSafeId(i) !== currentId);
        const available = items.filter(i => {
          if (getSafeId(i) === currentId) return false;
          if (i.replacement_status === 'pending') return false;
          // Only show items that are available (not assigned)
          const isAvail = getValueIgnoreCase(i, 'isAvailable');
          if (isAvail != 1 && isAvail !== true) return false;
          return true;
        });

        setPendingReplacementItems(pending);
        setReplacementItems(available);
      }
    } catch (e) {
      console.error("Failed to fetch replacements", e);
    } finally {
      setLoadingReplacements(false);
    }
  }

  const handleReturn = (type: string, item: any) => {
    setActionModal({ isOpen: true, type: 'Return', item: { type, data: item } })
  }

  const confirmAction = async () => {
    if (!actionModal || !actionModal.item) return;
    if (confirmLoading) return; // Prevent double submission
    setConfirmLoading(true);

    const { type, item } = actionModal; // type is 'Scrap', 'Replace', 'Return'
    const id = getSafeId(item.data);

    const user = getAuthCookie();
    // @ts-ignore
    const userId = (user as any)?.id || null;

    // Validation for Replace
    let replacementObj: any = null;
    if (type === 'Replace') {
      if (!selectedReplacement) {
        toast.error("Please select a replacement item.");
        return;
      }
      // Find the full replacement object from either pending or available lists
      replacementObj = replacementItems.find(r => String(getSafeId(r)) === String(selectedReplacement))
        || pendingReplacementItems.find(r => String(getSafeId(r)) === String(selectedReplacement));
    }

    // Endpoint: /Companies/AddScrap, /Companies/AddReplace, /Companies/AddReturn
    const endpoint = `/Companies/Add${type}`;

    // Construct Payload
    // Backend expects: producedID, log, CompanyID, inventoryID, userID
    const payload: any = {
      producedID: id,
      produced: item.type,
      log: actionReason,
      // @ts-ignore
      CompanyID: company?.id,
      inventoryID: item.data.inventoryID || item.data.inventory_id || item.data.InventoryID || null,
      userID: userId
    };

    if (type === 'Replace') {
      payload.replacementID = selectedReplacement;
      // Check if selected from pending list
      const isFromPending = pendingReplacementItems.some(
        p => String(getSafeId(p)) === String(selectedReplacement)
      );
      if (isFromPending) {
        payload.isPendingReplacement = true;
      }
    }

    try {
      const response = await api.post(endpoint, payload);

      if (response.data?.success) {

        const responseData = await api.post(`/Companies/getCompanyDetails`, {
          companyID: company?.id
        }, {
          params: {
            page: 1,
            limit: 50 // Fetching more to show meaningful data
          }
        })

        if (responseData.data.success) {
          setData(responseData.data.data)
        }

        // --- PDF GENERATION ---
        if (type === 'Return') {
          await handleDownloadChallan('RETURN', { [item.type]: [item.data] });
        } else if (type === 'Replace') {
          // 1. Return Challan for Old Item (always generated)
          await handleDownloadChallan('REPLACE_RETURN', { [item.type]: [item.data] }, 'Replacement Return');

          // 2. Delivery Challan for New Item — only if it's NOT from the pending list
          //    (pending items already had their delivery challan generated earlier)
          const isFromPending = pendingReplacementItems.some(
            p => String(getSafeId(p)) === String(selectedReplacement)
          );
          if (replacementObj && !isFromPending) {
            await handleDownloadChallan('REPLACE_DELIVERY', { [item.type]: [replacementObj] }, 'Replacement Delivery');
          }
        }


        // Close modals
        setActionModal(null);
        setActionReason("");
        setEditingItem(null);
        // Reset replacement
        setReplacementItems([]);
        setPendingReplacementItems([]);
        setSelectedReplacement("");


      } else {
        toast.error(`Failed to perform ${type}: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`Error performing ${type}:`, err);
      // @ts-ignore
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setConfirmLoading(false);
    }
  }

  const confirmDelete = async () => {
    if (!deletingItem) return
    setIsSaving(true)
    const type = deletingItem.type;
    const url = getApiUrl(type, 'delete');

    try {
      console.log(`Deleting ${type} at ${url}`, { id: deletingItem.id });
      // API Call
      await api.post(url, { id: deletingItem.id })

      // Update State on success
      setData(prev => {
        if (!prev) return null
        const newProducts = { ...prev.products }
        const productType = type as keyof typeof newProducts
        // @ts-ignore
        if (newProducts[productType]) {
          // @ts-ignore
          newProducts[productType] = newProducts[productType].filter(item => getSafeId(item) !== deletingItem.id)
        }
        return { ...prev, products: newProducts }
      })
      setDeletingItem(null)
    } catch (err) {
      console.error("Failed to delete", err)
      toast.error(`Failed to delete item. Check console.`);
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddRam = (ramId: string) => {
    const ramToAdd = availableRams.find(r => String(getSafeId(r)) === ramId);
    if (ramToAdd) {
      setAssignedRams(prev => [...prev, ramToAdd]);
      setAvailableRams(prev => prev.filter(r => String(getSafeId(r)) !== ramId));
      setSelectedRamToAdd(""); // Reset selection
    }
  }

  const handleRemoveRam = (ram: any) => {
    setAssignedRams(prev => prev.filter(r => getSafeId(r) !== getSafeId(ram)));
    setAvailableRams(prev => [...prev, ram]);
  }

  const handleAddSSD = (ssdId: string) => {
    const ssdToAdd = availableSSDs.find(s => String(getSafeId(s)) === ssdId);
    if (ssdToAdd) {
      setAssignedSSDs(prev => [...prev, ssdToAdd]);
      setAvailableSSDs(prev => prev.filter(s => String(getSafeId(s)) !== ssdId));
      setSelectedSSDToAdd("");
    }
  }
  const handleRemoveSSD = (ssd: any) => {
    setAssignedSSDs(prev => prev.filter(s => getSafeId(s) !== getSafeId(ssd)));
    setAvailableSSDs(prev => [...prev, ssd]);
  }

  const handleAddNvme = (nvmeId: string) => {
    const nvmeToAdd = availableNvmes.find(n => String(getSafeId(n)) === nvmeId);
    if (nvmeToAdd) {
      setAssignedNvmes(prev => [...prev, nvmeToAdd]);
      setAvailableNvmes(prev => prev.filter(n => String(getSafeId(n)) !== nvmeId));
      setSelectedNvmeToAdd("");
    }
  }
  const handleRemoveNvme = (nvme: any) => {
    setAssignedNvmes(prev => prev.filter(n => getSafeId(n) !== getSafeId(nvme)));
    setAvailableNvmes(prev => [...prev, nvme]);
  }

  const handleAddM2 = (m2Id: string) => {
    const m2ToAdd = availableM2s.find(m => String(getSafeId(m)) === m2Id);
    if (m2ToAdd) {
      setAssignedM2s(prev => [...prev, m2ToAdd]);
      setAvailableM2s(prev => prev.filter(m => String(getSafeId(m)) !== m2Id));
      setSelectedM2ToAdd("");
    }
  }
  const handleRemoveM2 = (m2: any) => {
    setAssignedM2s(prev => prev.filter(m => getSafeId(m) !== getSafeId(m)));
    setAvailableM2s(prev => [...prev, m2]);
  }

  const handleAddGraphicsCard = (cardId: string) => {
    const cardToAdd = availableGraphicsCards.find(c => String(getSafeId(c)) === cardId);
    if (cardToAdd) {
      setAssignedGraphicsCards(prev => [...prev, cardToAdd]);
      setAvailableGraphicsCards(prev => prev.filter(c => String(getSafeId(c)) !== cardId));
      setSelectedGraphicsCardToAdd("");
    }
  }
  const handleRemoveGraphicsCard = (card: any) => {
    setAssignedGraphicsCards(prev => prev.filter(c => getSafeId(c) !== getSafeId(card)));
    setAvailableGraphicsCards(prev => [...prev, card]);
  }



  const fetchActivityLogs = async () => {
    if (!id) return
    setLoadingLogs(true)
    try {
      const response = await api.post('/Companies/getActivityLogs', {
        companyID: id,
        logType: historyLogType,
        product: historyProduct,
        startDate: historyStartDate,
        endDate: historyEndDate
      });
      if (response.data.success) {
        setActivityLogs(response.data.data)
      } else {
        toast.error("Failed to fetch activity logs")
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err)
      toast.error("Error fetching activity logs")
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleDownloadActivityPDF = async () => {
    if (!id) return;
    setDownloadingActivityPDF(true);
    try {
      const response = await api.post("/Companies/generateActivityHistoryPDF", {
        companyID: id,
        logType: historyLogType,
        product: historyProduct,
        startDate: historyStartDate,
        endDate: historyEndDate,
        companyName: data?.company?.company_name
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Activity_History_${id}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Activity History PDF downloaded successfully");
      setPdfActivityConfirmModalOpen(false);
    } catch (error) {
      console.error("Failed to download Activity PDF", error);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingActivityPDF(false);
    }
  };

  const handleDownloadCurrentPDF = async () => {
    if (!id) return;
    setDownloadingCurrentPDF(true);
    try {
      const response = await api.post("/Companies/generateCurrentProductsPDF", {
        companyID: id,
        companyName: company?.company_name
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Current_Products_${id}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Current Products PDF downloaded successfully");
      setPdfCurrentConfirmModalOpen(false);
    } catch (error) {
      console.error("Failed to download Current Products PDF", error);
      toast.error("Failed to download Current Products PDF");
    } finally {
      setDownloadingCurrentPDF(false);
    }
  };



  // Consoliated Add/Remove Logic
  const handleDownloadChallan = async (challanType: 'DELIVERY' | 'RETURN' | 'REPLACE_DELIVERY' | 'REPLACE_RETURN', productsMap: any, customRemark?: string, challanDate?: Date, customCompanyName?: string, customAddress?: string) => {
    try {
      const response = await api.post('/inventory/generate-challan', {
        companyDetails: company,
        products: productsMap,
        challanType,
        challanRemark: customRemark,
        challanDate: challanDate,
        customCompanyName,
        customAddress
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${challanType.toLowerCase()}_challan_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Failed to download PDF", e);
      toast.error("Failed to generate Challan PDF");
    }
  }

  const manageProductAssignment = async (operation: 'assign' | 'unassign', type: string, item: any) => {
    setIsSaving(true);
    let suffix = getSuffix(type);
    const endpoint = `/Companies/companyUpdate${suffix}`;

    try {
      const payload = { ...item };
      if (operation === 'assign') {
        payload.company_id = id;
        payload.CompanyID = id;
        payload.action = 'add';
      } else {
        payload.action = 'remove';
      }

      console.log(`${operation === 'assign' ? 'Adding' : 'Removing'} ${type} (${operation}) to ${endpoint}`, payload);
      await api.post(endpoint, payload);

      // Refresh Data
      const response = await api.post(`/Companies/getCompanyDetails`, {
        companyID: id
      }, {
        params: { page: 1, limit: 50 },
      });

      if (response.data.success) {
        setData(response.data.data);
      }

      // Auto-generate Challan - REMOVED per requirement
      // const challanType = operation === 'assign' ? 'DELIVERY' : 'RETURN';
      // await handleDownloadChallan(challanType, { [type]: [item] });

    } catch (err) {
      console.error(`Failed to ${operation} ${type}`, err);
      toast.error(`Failed to ${operation} ${type}. Check console.`);
    } finally {
      setIsSaving(false);
    }
  };


  const confirmRemove = async () => {
    if (!removingItem) return
    await manageProductAssignment('unassign', removingItem.type, removingItem.item)
    setRemovingItem(null)
  }

  const saveEdit = async () => {
    if (!editingItem) return
    setIsSaving(true)
    const type = editingItem.type;
    const url = getApiUrl(type, 'edit');

    try {
      // Handle RAM updates if editing a laptop, system, or workstation
      const lowerType = type.toLowerCase();
      if (['laptop', 'system', 'workstation', 'mobileworkstation'].includes(lowerType)) {
        // Find added RAMs
        const addedRams = assignedRams.filter(r =>
          !initialAssignedRams.find(ir => getSafeId(ir) === getSafeId(r))
        );

        // Find removed RAMs
        const removedRams = initialAssignedRams.filter(ir =>
          !assignedRams.find(r => getSafeId(r) === getSafeId(ir))
        );
        const payload: any = { ...editingItem.data };
        payload.product = lowerType;

        if (addedRams.length > 0) {
          payload.addRam = addedRams;
        }

        if (removedRams.length > 0) {
          payload.removeRam = removedRams;
        }

        // --- SSD ---
        const addedSSDs = assignedSSDs.filter(s => !initialAssignedSSDs.find(is => getSafeId(is) === getSafeId(s)));
        const removedSSDs = initialAssignedSSDs.filter(is => !assignedSSDs.find(s => getSafeId(s) === getSafeId(is)));
        if (addedSSDs.length > 0) payload.addSSD = addedSSDs;
        if (removedSSDs.length > 0) payload.removeSSD = removedSSDs;

        // --- NVMe ---
        const addedNvmes = assignedNvmes.filter(n => !initialAssignedNvmes.find(in_ => getSafeId(in_) === getSafeId(n)));
        const removedNvmes = initialAssignedNvmes.filter(in_ => !assignedNvmes.find(n => getSafeId(n) === getSafeId(in_)));
        if (addedNvmes.length > 0) payload.addNvme = addedNvmes;
        if (addedNvmes.length > 0) payload.addNvme = addedNvmes;
        if (removedNvmes.length > 0) payload.removeNvme = removedNvmes;

        // --- M.2 ---
        const addedM2s = assignedM2s.filter(m => !initialAssignedM2s.find(im => getSafeId(im) === getSafeId(m)));
        const removedM2s = initialAssignedM2s.filter(im => !assignedM2s.find(m => getSafeId(m) === getSafeId(im)));
        if (addedM2s.length > 0) payload.addM2 = addedM2s;
        if (removedM2s.length > 0) payload.removeM2 = removedM2s;

        // --- Graphics Card ---
        if (['system', 'workstation', 'mobileworkstation'].includes(lowerType)) {
          const addedGraphicsCards = assignedGraphicsCards.filter(g => !initialAssignedGraphicsCards.find(ig => getSafeId(ig) === getSafeId(g)));
          const removedGraphicsCards = initialAssignedGraphicsCards.filter(ig => !assignedGraphicsCards.find(g => getSafeId(g) === getSafeId(ig)));

          // System/Workstation use array
          if (addedGraphicsCards.length > 0) payload.addGraphicsCard = addedGraphicsCards;
          if (removedGraphicsCards.length > 0) payload.removeGraphicsCard = removedGraphicsCards;

          // Mobile Workstation uses single ID
          if (lowerType === 'mobileworkstation' && assignedGraphicsCards.length > 0) {
            payload.graphicscardID = getSafeId(assignedGraphicsCards[0]);
          }
        }

        console.log(`Saving ${type} at ${url}`, payload);
        // API Call
        await api.post(url, payload)
      } else {
        // API Call for other types
        await api.post(url, editingItem.data)
      }

      // Update State on success
      setData(prev => {
        if (!prev) return null
        const newProducts = { ...prev.products }
        const productType = type as keyof typeof newProducts
        // @ts-ignore
        if (newProducts[productType]) {
          // @ts-ignore
          newProducts[productType] = newProducts[productType].map(item =>
            getSafeId(item) === getSafeId(editingItem.data) ? editingItem.data : item
          )
        }
        return { ...prev, products: newProducts }
      })
      setEditingItem(null)

      // Sync updated data back to selectedProducts if it's there
      setSelectedProducts(prev => {
        const newSelected = { ...prev };
        const productType = type.toLowerCase();
        if (newSelected[productType]) {
          // @ts-ignore
          newSelected[productType] = newSelected[productType].map(item =>
            getSafeId(item) === getSafeId(editingItem.data) ? { ...editingItem.data } : item
          );
        }
        return newSelected;
      });
    } catch (err) {
      console.error("Failed to save", err)
      toast.error(`Failed to save changes. Check console.`);
    } finally {
      setIsSaving(false)

      if (['laptop', 'system', 'workstation', 'mobileworkstation'].includes(type.toLowerCase())) {
        const response = await api.post(`/Companies/getCompanyDetails`, {
          companyID: id
        }, {
          params: {
            page: 1,
            limit: 50
          }
        })
        if (response.data.success) {
          setData(response.data.data)
        }
      }

      // Check for changes to generate challans
      const lowerType = type.toLowerCase();
      if (['laptop', 'system', 'workstation'].includes(lowerType)) {
        // Re-calculate added/removed (since we need them for PDF)
        const addedRams = assignedRams.filter(r => !initialAssignedRams.find(ir => getSafeId(ir) === getSafeId(r)));
        const removedRams = initialAssignedRams.filter(ir => !assignedRams.find(r => getSafeId(r) === getSafeId(ir)));

        const addedSSDs = assignedSSDs.filter(s => !initialAssignedSSDs.find(is => getSafeId(is) === getSafeId(s)));
        const removedSSDs = initialAssignedSSDs.filter(is => !assignedSSDs.find(s => getSafeId(s) === getSafeId(is)));

        const addedNvmes = assignedNvmes.filter(n => !initialAssignedNvmes.find(in_ => getSafeId(in_) === getSafeId(n)));
        const removedNvmes = initialAssignedNvmes.filter(in_ => !assignedNvmes.find(n => getSafeId(n) === getSafeId(in_)));

        const deliveryMap: any = {};
        const returnMap: any = {};

        if (addedRams.length > 0) deliveryMap.ram = addedRams;
        if (removedRams.length > 0) returnMap.ram = removedRams;

        if (addedSSDs.length > 0) deliveryMap.ssd = addedSSDs;
        if (removedSSDs.length > 0) returnMap.ssd = removedSSDs;

        if (addedNvmes.length > 0) deliveryMap.nvme = addedNvmes;
        if (removedNvmes.length > 0) returnMap.nvme = removedNvmes;

        if (Object.keys(deliveryMap).length > 0) await handleDownloadChallan('DELIVERY', deliveryMap);
        if (Object.keys(returnMap).length > 0) await handleDownloadChallan('RETURN', returnMap);
      }
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Company Details</h1>

        <div className="ml-auto flex items-center gap-2">
          <Dialog open={challanModalOpen} onOpenChange={setChallanModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {getTotalSelectedCount()}
                </span>
                Create Challan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle className="text-primary text-xl font-bold">Generate Delivery Challan</DialogTitle>
                <DialogDescription className="text-purple-600">
                  Create a challan for the {getTotalSelectedCount()} selected items.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="companyName" className="text-right text-gray-500">
                    Company
                  </Label>
                  <Input
                    id="companyName"
                    value={challanCompanyName}
                    onChange={(e) => setChallanCompanyName(e.target.value)}
                    className="col-span-3 border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="address" className="text-right text-gray-500 pt-2">
                    Delivery At
                  </Label>
                  <Textarea
                    id="address"
                    value={challanAddress}
                    onChange={(e) => setChallanAddress(e.target.value)}
                    className="col-span-3 min-h-[80px] border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right text-gray-500">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={challanDate ? challanDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setChallanDate(e.target.value ? new Date(e.target.value) : undefined)}
                    className="col-span-3 border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="remarks" className="text-right text-gray-500 pt-2">
                    Remarks
                  </Label>
                  <Textarea
                    id="remarks"
                    value={challanRemarks}
                    onChange={(e) => setChallanRemarks(e.target.value)}
                    className="col-span-3 min-h-[80px] border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Optional remarks..."
                  />
                </div>
              </div>

              {/* Selected Items Summary */}
              <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm max-h-[300px] overflow-y-auto">
                <h4 className="font-bold text-sm text-primary mb-2">Selected Items:</h4>
                <div className="space-y-2">
                  {Object.entries(selectedProducts).flatMap(([type, items]) =>
                    items.map(item => ({ type, item }))
                  ).map(({ type, item }) => (
                    <div key={`${type}-${getSafeId(item)}`} className="flex items-center justify-between text-sm p-2 bg-muted/20 hover:bg-muted/40 rounded-md transition-colors border">
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary capitalize flex items-center gap-2">
                          {type}
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-normal">
                            ID: {getSafeId(item)}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {(() => {
                            const brand = getValueIgnoreCase(item, 'brand') || getValueIgnoreCase(item, 'Name');
                            const model = getValueIgnoreCase(item, 'model') || getValueIgnoreCase(item, 'Processor');
                            return [brand, model].filter(Boolean).join(' - ');
                          })()}
                        </span>
                      </div>
                      <ActionTooltip label="Edit Details">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(type, item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </ActionTooltip>
                    </div>
                  ))}
                  {getTotalSelectedCount() === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border-dashed border-2 rounded-md">
                      No items selected
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleGenerateManualChallan} className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto" disabled={isGeneratingChallan || getTotalSelectedCount() === 0}>
                  {isGeneratingChallan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    "Generate PDF"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog >

          <Button
            variant="outline"
            onClick={() => setPdfCurrentConfirmModalOpen(true)}
            disabled={downloadingCurrentPDF}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>

          <Button onClick={() => navigate(`/companies/${id}/add-products`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Products
          </Button>
        </div >
      </div >

      {/* Company Info Card */}
      < Card >
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
              <Building2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Company Name</p>
                <p>{company?.company_name || "N/A"}</p>
              </div>
            </div>

            {/* Dynamically render other relevant company fields if they exist */}
            {Object.entries(company || {}).map(([key, value]) => {
              if (['id', 'company_name', 'isactive'].includes(key.toLowerCase()) || typeof value === 'object') return null;

              const lower = key.toLowerCase();
              let Icon = Info;
              if (lower.includes('phone') || lower.includes('mobile')) Icon = Phone;
              else if (lower.includes('location') || lower.includes('address') || lower.includes('city')) Icon = MapPin;
              else if (lower.includes('customer') || lower.includes('name')) Icon = User;

              return (
                <div key={key} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
                  <Icon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium">{String(value)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card >

      {/* Add Product Modal */}

      {/* Products Tabs */}
      <Card>
        <Tabs defaultValue="Current" className="w-full">
          <CardHeader>
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="Current" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Current Products</TabsTrigger>
              <TabsTrigger value="History" onClick={fetchActivityLogs} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">History Products</TabsTrigger>
            </TabsList>

          </CardHeader>
          <CardContent>
            <TabsContent value="Current" className="mt-0 space-y-4">
              <Tabs defaultValue="laptop" >
                <TabsList className="mb-6 flex flex-wrap gap-2">
                  <TabsTrigger value="laptop" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Laptop ({products.laptop?.length || 0})</TabsTrigger>
                  <TabsTrigger value="system" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Desktop ({products.system?.length || 0})</TabsTrigger>
                  <TabsTrigger value="monitor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Monitor ({products.monitor?.length || 0})</TabsTrigger>
                  <TabsTrigger value="ram" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">RAM ({products.ram?.length || 0})</TabsTrigger>
                  <TabsTrigger value="ssd" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">SSD ({products.ssd?.length || 0})</TabsTrigger>
                  <TabsTrigger value="hdd" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">HDD ({products.hdd?.length || 0})</TabsTrigger>
                  <TabsTrigger value="nvme" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">NVMe ({products.nvme?.length || 0})</TabsTrigger>
                  <TabsTrigger value="workstation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Workstation ({products.workstation?.length || 0})</TabsTrigger>
                  <TabsTrigger value="graphicscard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Graphics Card ({products.graphicscard?.length || 0})</TabsTrigger>
                  <TabsTrigger value="mobileworkstation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Mobile Workstation ({products.mobileworkstation?.length || 0})</TabsTrigger>
                  <TabsTrigger value="m_2" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">M.2 ({products.m_2?.length || 0})</TabsTrigger>
                </TabsList>

                {/* Laptop Table */}
                <TabsContent value="laptop">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Laptops</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.laptop?.length > 0 &&
                                products.laptop?.every(item => isProductSelected('laptop', item))
                              }
                              onChange={() => toggleSelectAll('laptop', products.laptop || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Processor</TableHead>
                          <TableHead>Graphics</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Ram</TableHead>
                          <TableHead>SSD</TableHead>
                          <TableHead>NVMe</TableHead>
                          <TableHead>M.2</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.laptop?.length === 0 ? (
                          <TableRow><TableCell colSpan={10} className="text-center py-4">No laptops found</TableCell></TableRow>
                        ) : (
                          products.laptop?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('laptop', item)}
                                  onChange={() => toggleProductSelection('laptop', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'phyramidID')}</TableCell>
                              <TableCell>
                                {getValueIgnoreCase(item, 'brand')}
                                {getValueIgnoreCase(item, 'replacement_status') === 'pending' && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full ml-2 inline-block">
                                    Replacement Pending
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'model')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'processor_brand')} {getValueIgnoreCase(item, 'processor_model')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'graphics')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'service_id')}</TableCell>
                              <TableCell>
                                {products.ram?.filter((ramItem) => String(getValueIgnoreCase(ramItem, 'laptopID')) === String(getValueIgnoreCase(item, 'id')))
                                  .map((ram) => getValueIgnoreCase(ram, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell>
                                {products.ssd?.filter((ssdItem) => String(getValueIgnoreCase(ssdItem, 'laptopID')) === String(getValueIgnoreCase(item, 'id')))
                                  .map((ssd) => getValueIgnoreCase(ssd, 'ssdSize') || getValueIgnoreCase(ssd, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell>
                                {products.nvme?.filter((nvmeItem) => String(getValueIgnoreCase(nvmeItem, 'laptopID')) === String(getValueIgnoreCase(item, 'id')))
                                  .map((nvme) => getValueIgnoreCase(nvme, 'Size') || getValueIgnoreCase(nvme, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell>
                                {products.m_2?.filter((m2Item) => String(getValueIgnoreCase(m2Item, 'laptopID')) === String(getValueIgnoreCase(item, 'id')))
                                  .map((m2) => getValueIgnoreCase(m2, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Edit">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit('laptop', item)}><Pencil className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('laptop', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('laptop', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* System Table */}
                <TabsContent value="system">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Desktops</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.system?.length > 0 &&
                                products.system?.every(item => isProductSelected('system', item))
                              }
                              onChange={() => toggleSelectAll('system', products.system || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Processor</TableHead>
                          <TableHead>Graphics</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>RAM</TableHead>
                          <TableHead>SSD</TableHead>
                          <TableHead>NVMe</TableHead>
                          <TableHead>M.2</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.system?.length === 0 ? (
                          <TableRow><TableCell colSpan={9} className="text-center py-4">No desktops found</TableCell></TableRow>
                        ) : (
                          products.system?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('system', item)}
                                  onChange={() => toggleProductSelection('system', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'pyramidsID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'Name')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'Processor')}</TableCell>
                              <TableCell>
                                {products.graphicscard?.filter((gpuItem) => String(getValueIgnoreCase(gpuItem, 'systemID')) === String(getValueIgnoreCase(item, 'systemID')))
                                  .map((gpu) => getValueIgnoreCase(gpu, 'name') || getValueIgnoreCase(gpu, 'model')).join('+ ')}
                              </TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'serviceID')}</TableCell>
                              <TableCell>
                                {products.ram?.filter((ramItem) => String(getValueIgnoreCase(ramItem, 'systemID')) === String(getValueIgnoreCase(item, 'systemID')))
                                  .map((ram) => getValueIgnoreCase(ram, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell>
                                {products.ssd?.filter((ssdItem) => String(getValueIgnoreCase(ssdItem, 'systemID')) === String(getValueIgnoreCase(item, 'systemID')))
                                  .map((ssd) => getValueIgnoreCase(ssd, 'ssdSize') || getValueIgnoreCase(ssd, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell>
                                {products.nvme?.filter((nvmeItem) => String(getValueIgnoreCase(nvmeItem, 'systemID')) === String(getValueIgnoreCase(item, 'systemID')))
                                  .map((nvme) => getValueIgnoreCase(nvme, 'Size') || getValueIgnoreCase(nvme, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell>
                                {products.m_2?.filter((m2Item) => String(getValueIgnoreCase(m2Item, 'systemID')) === String(getValueIgnoreCase(item, 'systemID')))
                                  .map((m2) => getValueIgnoreCase(m2, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Edit">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit('system', item)}><Pencil className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('system', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('system', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Monitor Table */}
                <TabsContent value="monitor">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Monitors</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.monitor?.length > 0 &&
                                products.monitor?.every(item => isProductSelected('monitor', item))
                              }
                              onChange={() => toggleSelectAll('monitor', products.monitor || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Display</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.monitor?.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-4">No monitors found</TableCell></TableRow>
                        ) : (
                          products.monitor?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('monitor', item)}
                                  onChange={() => toggleProductSelection('monitor', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'pyramid_id')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'name')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'size')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'display')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'service_tag')}</TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('monitor', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('monitor', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* RAM Table */}
                <TabsContent value="ram">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">RAM Modules</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.ram?.length > 0 &&
                                products.ram?.every(item => isProductSelected('ram', item))
                              }
                              onChange={() => toggleSelectAll('ram', products.ram || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.ram?.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-4">No RAM found</TableCell></TableRow>
                        ) : (
                          products.ram?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('ram', item)}
                                  onChange={() => toggleProductSelection('ram', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'phyramidID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'brand')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'size')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'type')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'service_id')}</TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('ram', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('ram', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* SSD Table */}
                <TabsContent value="ssd">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">SSDs</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.ssd?.length > 0 &&
                                products.ssd?.every(item => isProductSelected('ssd', item))
                              }
                              onChange={() => toggleSelectAll('ssd', products.ssd || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.ssd?.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-4">No SSDs found</TableCell></TableRow>
                        ) : (
                          products.ssd?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('ssd', item)}
                                  onChange={() => toggleProductSelection('ssd', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'phyramidID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'brand')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'ssdSize')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'serviceTag')}</TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('ssd', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('ssd', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* HDD Table */}
                <TabsContent value="hdd">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">HDD</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.hdd?.length > 0 &&
                                products.hdd?.every(item => isProductSelected('hdd', item))
                              }
                              onChange={() => toggleSelectAll('hdd', products.hdd || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Speed</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.hdd?.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-4">No HDDs found</TableCell></TableRow>
                        ) : (
                          products.hdd?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('hdd', item)}
                                  onChange={() => toggleProductSelection('hdd', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'phyramidID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'brand')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'size')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'speed')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'serviceTag')}</TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('hdd', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('hdd', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* NVMe Table */}
                <TabsContent value="nvme">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">NVMe</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.nvme?.length > 0 &&
                                products.nvme?.every(item => isProductSelected('nvme', item))
                              }
                              onChange={() => toggleSelectAll('nvme', products.nvme || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.nvme?.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-4">No NVMe found</TableCell></TableRow>
                        ) : (
                          products.nvme?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('nvme', item)}
                                  onChange={() => toggleProductSelection('nvme', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'phyramidID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'brand')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'Size')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'serviceTag')}</TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('nvme', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('nvme', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Workstation Table */}
                <TabsContent value="workstation">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Workstations</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.workstation?.length > 0 &&
                                products.workstation?.every(item => isProductSelected('workstation', item))
                              }
                              onChange={() => toggleSelectAll('workstation', products.workstation || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Processor</TableHead>
                          <TableHead>Graphics</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>RAM</TableHead>
                          <TableHead>SSD</TableHead>
                          <TableHead>NVMe</TableHead>
                          <TableHead>M.2</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.workstation?.length === 0 ? (
                          <TableRow><TableCell colSpan={11} className="text-center py-4">No workstations found</TableCell></TableRow>
                        ) : (
                          products.workstation?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('workstation', item)}
                                  onChange={() => toggleProductSelection('workstation', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'pyramidsID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'Name')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'Processor')}</TableCell>
                              <TableCell>
                                {products.graphicscard?.filter((gpuItem) => String(getValueIgnoreCase(gpuItem, 'WorkstationID')) === String(getValueIgnoreCase(item, 'id')))
                                  .map((gpu) => getValueIgnoreCase(gpu, 'name') || getValueIgnoreCase(gpu, 'model')).join('+ ')}
                              </TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'serviceID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'pyramidsID')}</TableCell>
                              <TableCell>
                                {products.ram?.filter((ramItem) => String(getValueIgnoreCase(ramItem, 'WorkstationID')) === String(getValueIgnoreCase(item, 'id')))
                                  .map((ram) => getValueIgnoreCase(ram, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell>
                                {products.ssd?.filter((ssdItem) => String(getValueIgnoreCase(ssdItem, 'WorkstationID')) === String(getValueIgnoreCase(item, 'id')))
                                  .map((ssd) => getValueIgnoreCase(ssd, 'ssdSize') || getValueIgnoreCase(ssd, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell>
                                {products.nvme?.filter((nvmeItem) => String(getValueIgnoreCase(nvmeItem, 'WorkstationID')) === String(getValueIgnoreCase(item, 'id')))
                                  .map((nvme) => getValueIgnoreCase(nvme, 'Size') || getValueIgnoreCase(nvme, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell>
                                {products.m_2?.filter((m2Item) => String(getValueIgnoreCase(m2Item, 'WorkstationID')) === String(getValueIgnoreCase(item, 'id')))
                                  .map((m2) => getValueIgnoreCase(m2, 'size')).join('+ ')}
                              </TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Edit">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit('workstation', item)}><Pencil className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('workstation', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('workstation', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Graphics Card Table */}
                <TabsContent value="graphicscard">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Graphics Cards</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.graphicscard?.length > 0 &&
                                products.graphicscard?.every(item => isProductSelected('graphicscard', item))
                              }
                              onChange={() => toggleSelectAll('graphicscard', products.graphicscard || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.graphicscard?.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-4">No graphics cards found</TableCell></TableRow>
                        ) : (
                          products.graphicscard?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('graphicscard', item)}
                                  onChange={() => toggleProductSelection('graphicscard', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'phyramidID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'brand')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'model')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'size')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'serviceTag')}</TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('graphicscard', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('graphicscard', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Mobile Workstation Table */}
                <TabsContent value="mobileworkstation">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Mobile Workstations</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.mobileworkstation?.length > 0 &&
                                products.mobileworkstation?.every(item => isProductSelected('mobileworkstation', item))
                              }
                              onChange={() => toggleSelectAll('mobileworkstation', products.mobileworkstation || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Processor</TableHead>
                          <TableHead>RAM</TableHead>
                          <TableHead>SSD</TableHead>
                          <TableHead>NVMe</TableHead>
                          <TableHead>M.2</TableHead>
                          <TableHead>Graphics</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.mobileworkstation?.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-4">No mobile workstations found</TableCell></TableRow>
                        ) : (
                          products.mobileworkstation?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('mobileworkstation', item)}
                                  onChange={() => toggleProductSelection('mobileworkstation', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'phyramidID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'brand')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'model')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'processor_brand')} {getValueIgnoreCase(item, 'processor_model')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'ram_details')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'ssd_details')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'nvme_details')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'm2_details')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'graphicscard_details')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'service_id')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'phyramidID')}</TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Edit">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit('mobileworkstation', item)}><Pencil className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('mobileworkstation', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('mobileworkstation', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* M.2 Table */}
                <TabsContent value="m_2">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">M.2 Products</h3>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                products.m_2?.length > 0 &&
                                products.m_2?.every(item => isProductSelected('m_2', item))
                              }
                              onChange={() => toggleSelectAll('m_2', products.m_2 || [])}
                            />
                          </TableHead>
                          <TableHead>S.No</TableHead>
                          <TableHead>Pyramid ID</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Form Factor</TableHead>
                          <TableHead>Service Tag</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.m_2?.length === 0 ? (
                          <TableRow><TableCell colSpan={7} className="text-center py-4">No M.2 products found</TableCell></TableRow>
                        ) : (
                          products.m_2?.map((item, index) => (
                            <TableRow key={getSafeId(item)}>
                              <TableCell>
                                <Checkbox
                                  checked={isProductSelected('m_2', item)}
                                  onChange={() => toggleProductSelection('m_2', item)}
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'phyramidID')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'brand')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'size')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'type')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'form_factor')}</TableCell>
                              <TableCell>{getValueIgnoreCase(item, 'service_id')}</TableCell>
                              <TableCell className="flex gap-2">
                                <ActionTooltip label="Replace">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleReplace('m_2', item)}><RefreshCw className="h-4 w-4" /></Button>
                                </ActionTooltip>
                                <ActionTooltip label="Return">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn('m_2', item)}><Undo2 className="h-4 w-4" /></Button>
                                </ActionTooltip>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="History">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle>Activity History</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="hist-date-from" className="text-xs">From:</Label>
                        <Input
                          id="hist-date-from"
                          type="date"
                          value={historyStartDate}
                          onChange={(e) => setHistoryStartDate(e.target.value)}
                          className="h-8 w-[130px] text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="hist-date-to" className="text-xs">To:</Label>
                        <Input
                          id="hist-date-to"
                          type="date"
                          value={historyEndDate}
                          onChange={(e) => setHistoryEndDate(e.target.value)}
                          className="h-8 w-[130px] text-xs"
                        />
                      </div>
                      <Select value={historyLogType} onValueChange={setHistoryLogType}>
                        <SelectTrigger className="h-8 w-[110px] text-xs">
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
                      <Select value={historyProduct} onValueChange={setHistoryProduct}>
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Products</SelectItem>
                          <SelectItem value="Laptop">Laptop</SelectItem>
                          <SelectItem value="System">System</SelectItem>
                          <SelectItem value="Monitor">Monitor</SelectItem>
                          <SelectItem value="Workstation">Workstation</SelectItem>
                          <SelectItem value="MobileWorkstation">Mobile Workstation</SelectItem>
                          <SelectItem value="Ram">RAM</SelectItem>
                          <SelectItem value="SSD">SSD</SelectItem>
                          <SelectItem value="NVMe">NVMe</SelectItem>
                          <SelectItem value="M_2">M.2</SelectItem>
                          <SelectItem value="HDD">HDD</SelectItem>
                          <SelectItem value="GraphicsCard">Graphics Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={fetchActivityLogs}
                        disabled={loadingLogs}
                        className="h-8"
                      >
                        {/* <RefreshCw className={`h-4 w-4 mr-1 ${loadingLogs ? 'animate-spin' : ''}`} /> */}
                        Submit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setHistoryStartDate("");
                          setHistoryEndDate("");
                          setHistoryLogType("All");
                          setHistoryProduct("All");
                          setTimeout(() => fetchActivityLogs(), 0);
                        }}
                        className="h-8"
                      >
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPdfActivityConfirmModalOpen(true)}
                        disabled={downloadingActivityPDF}
                        className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <FileText className="h-4 w-4 mr-1" />
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
                        <TableHead className="border border-slate-200">Name</TableHead>
                        <TableHead className="border border-slate-200">Pyramid ID</TableHead>
                        <TableHead className="border border-slate-200">Service Tag</TableHead>
                        <TableHead className="border border-slate-200">Product</TableHead>
                        <TableHead className="border border-slate-200">Log</TableHead>
                        <TableHead className="border border-slate-200">Reason</TableHead>
                        <TableHead className="border border-slate-200">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingLogs ? (
                        <TableRow>
                          <TableCell colSpan={9} className="border border-slate-200 text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : activityLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="border border-slate-200 text-center py-8 text-muted-foreground">
                            No activity logs found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        activityLogs.map((log, index) => (
                          <TableRow key={log.id}>
                            <TableCell className="border border-slate-200">{index + 1}</TableCell>
                            <TableCell className="border border-slate-200 capitalize max-w-[350px] whitespace-normal" title={log.fullProductName || log.product}>{log.fullProductName || log.product}</TableCell>
                            <TableCell className="border border-slate-200">{log.pyramidID || "-"}</TableCell>
                            <TableCell className="border border-slate-200">{log.serviceTag || "-"}</TableCell>
                            <TableCell className="border border-slate-200">{log.product}</TableCell>
                            <TableCell className="border border-slate-200">{log.log}</TableCell>
                            <TableCell className="border border-slate-200">{log.reason}</TableCell>
                            <TableCell className="border border-slate-200">{log.data ? new Date(log.data).toLocaleDateString() : '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Tabs >
      </Card >

      {/* Delete Dialog */}
      < Dialog open={!!deletingItem
      } onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deletingItem?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingItem(null)} disabled={isSaving}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSaving}>
              {isSaving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Remove Assignment Dialog */}
      < Dialog open={!!removingItem} onOpenChange={(open) => !open && setRemovingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this {removingItem?.type} from the company? This will unassign it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingItem(null)} disabled={isSaving}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRemove} disabled={isSaving}>
              {isSaving ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Edit Dialog */}
      < Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.type}</DialogTitle>
            <DialogDescription>
              Make changes to the {editingItem?.type} details below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {editingItem && (() => {
              const type = editingItem.type;
              const columns = PRODUCT_COLUMNS[type.toLowerCase()] || [];
              const isComputer = ['laptop', 'system', 'workstation', 'mobileworkstation'].includes(type.toLowerCase());
              // Use keys from data if no columns defined
              const fields = columns.length > 0 ? columns : Object.keys(editingItem.data).filter(k => !isExcludedKey(k)).map(k => ({ label: k, key: k }));

              if (!isComputer) {
                return (
                  <div className="space-y-4 px-1">
                    {fields.map((field) => (
                      <div className="grid grid-cols-4 items-center gap-4" key={field.key}>
                        <Label htmlFor={field.key} className="text-right flex-shrink-0 font-medium">
                          {field.label}
                        </Label>
                        <Input
                          id={field.key}
                          value={editingItem.data[field.key] || ""}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, [field.key]: e.target.value }
                          })}
                          className="col-span-3"
                        />
                      </div>
                    ))}
                  </div>
                );
              }


              return (
                <Tabs defaultValue="ram" className="w-full">
                  <TabsList className={`grid w-full ${['system', 'workstation', 'mobileworkstation'].includes(editingItem.type.toLowerCase()) ? 'grid-cols-5' : 'grid-cols-4'}`}>
                    <TabsTrigger value="ram">RAM</TabsTrigger>
                    <TabsTrigger value="ssd">SSD</TabsTrigger>
                    <TabsTrigger value="nvme">NVMe</TabsTrigger>
                    <TabsTrigger value="m2">M.2</TabsTrigger>
                    {['system', 'workstation', 'mobileworkstation'].includes(editingItem.type.toLowerCase()) && (
                      <TabsTrigger value="graphicscard">Graphics Card</TabsTrigger>
                    )}
                  </TabsList>

                  {/* RAM Tab */}
                  <TabsContent value="ram" className="mt-4 space-y-4">
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Assigned RAM</h4>
                        <span className="text-xs text-muted-foreground">{assignedRams.length} modules</span>
                      </div>

                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {assignedRams.length === 0 ? (
                          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                            No RAM assigned
                          </div>
                        ) : (
                          assignedRams.map((ram) => (
                            <div key={getSafeId(ram)} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border group hover:border-primary/50 transition-colors">
                              <div className="flex gap-2 text-sm items-center">
                                <span className="font-semibold">{getValueIgnoreCase(ram, 'brand')}</span>
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{getValueIgnoreCase(ram, 'size')}</span>
                                <span className="text-muted-foreground text-xs">({getValueIgnoreCase(ram, 'type')})</span>
                              </div>
                              <ActionTooltip label="Remove RAM">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveRam(ram)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </ActionTooltip>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t">
                        <Label className="mb-2 block text-sm font-medium">Add RAM</Label>
                        <div className="flex gap-2">
                          <Select value={selectedRamToAdd} onValueChange={(val) => { setSelectedRamToAdd(val); handleAddRam(val); }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select RAM to add..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {availableRams.length === 0 ? (
                                <SelectItem value="none" disabled>No RAM available</SelectItem>
                              ) : (
                                availableRams.map((r) => (
                                  <SelectItem key={getSafeId(r)} value={String(getSafeId(r))}>
                                    <div className="flex justify-between w-full gap-4">
                                      <span>{getValueIgnoreCase(r, 'brand')} {getValueIgnoreCase(r, 'size')}</span>
                                      <span className="text-muted-foreground text-xs self-center">ID: {getSafeId(r)}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* SSD Tab */}
                  <TabsContent value="ssd" className="mt-4 space-y-4">
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Assigned SSD</h4>
                        <span className="text-xs text-muted-foreground">{assignedSSDs.length} drives</span>
                      </div>

                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {assignedSSDs.length === 0 ? (
                          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                            No SSD assigned
                          </div>
                        ) : (
                          assignedSSDs.map((item) => (
                            <div key={getSafeId(item)} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border group hover:border-primary/50 transition-colors">
                              <div className="flex gap-2 text-sm items-center">
                                <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span>
                                <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-xs font-medium">{getValueIgnoreCase(item, 'ssdSize') || getValueIgnoreCase(item, 'size')}</span>
                              </div>
                              <ActionTooltip label="Remove SSD">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveSSD(item)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </ActionTooltip>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t">
                        <Label className="mb-2 block text-sm font-medium">Add SSD</Label>
                        <div className="flex gap-2">
                          <Select value={selectedSSDToAdd} onValueChange={(val) => { setSelectedSSDToAdd(val); handleAddSSD(val); }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select SSD to add..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {availableSSDs.length === 0 ? (
                                <SelectItem value="none" disabled>No SSD available</SelectItem>
                              ) : (
                                availableSSDs.map((s) => (
                                  <SelectItem key={getSafeId(s)} value={String(getSafeId(s))}>
                                    <div className="flex justify-between w-full gap-4">
                                      <span>{getValueIgnoreCase(s, 'brand')} {getValueIgnoreCase(s, 'ssdSize') || getValueIgnoreCase(s, 'size')}</span>
                                      <span className="text-muted-foreground text-xs self-center">ID: {getSafeId(s)}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* NVMe Tab */}
                  <TabsContent value="nvme" className="mt-4 space-y-4">
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Assigned NVMe</h4>
                        <span className="text-xs text-muted-foreground">{assignedNvmes.length} drives</span>
                      </div>

                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {assignedNvmes.length === 0 ? (
                          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                            No NVMe assigned
                          </div>
                        ) : (
                          assignedNvmes.map((item) => (
                            <div key={getSafeId(item)} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border group hover:border-primary/50 transition-colors">
                              <div className="flex gap-2 text-sm items-center">
                                <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span>
                                <span className="bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded text-xs font-medium">{getValueIgnoreCase(item, 'Size') || getValueIgnoreCase(item, 'size')}</span>
                              </div>
                              <ActionTooltip label="Remove NVMe">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveNvme(item)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </ActionTooltip>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t">
                        <Label className="mb-2 block text-sm font-medium">Add NVMe</Label>
                        <div className="flex gap-2">
                          <Select value={selectedNvmeToAdd} onValueChange={(val) => { setSelectedNvmeToAdd(val); handleAddNvme(val); }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select NVMe to add..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {availableNvmes.length === 0 ? (
                                <SelectItem value="none" disabled>No NVMe available</SelectItem>
                              ) : (
                                availableNvmes.map((n) => (
                                  <SelectItem key={getSafeId(n)} value={String(getSafeId(n))}>
                                    <div className="flex justify-between w-full gap-4">
                                      <span>{getValueIgnoreCase(n, 'brand')} {getValueIgnoreCase(n, 'Size') || getValueIgnoreCase(n, 'size')}</span>
                                      <span className="text-muted-foreground text-xs self-center">ID: {getSafeId(n)}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* M.2 Tab */}
                  <TabsContent value="m2" className="mt-4 space-y-4">
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Assigned M.2</h4>
                        <span className="text-xs text-muted-foreground">{assignedM2s.length} drives</span>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {assignedM2s.length === 0 ? (
                          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">No M.2 assigned</div>
                        ) : (
                          assignedM2s.map((item) => (
                            <div key={getSafeId(item)} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border group hover:border-primary/50 transition-colors">
                              <div className="flex gap-2 text-sm items-center">
                                <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span>
                                <span className="bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded text-xs font-medium">{getValueIgnoreCase(item, 'size')}</span>
                              </div>
                              <ActionTooltip label="Remove M.2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveM2(item)}><Trash2 className="h-4 w-4" /></Button>
                              </ActionTooltip>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <Label className="mb-2 block text-sm font-medium">Add M.2</Label>
                        <Select value={selectedM2ToAdd} onValueChange={(val) => { setSelectedM2ToAdd(val); handleAddM2(val); }}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Select M.2 to add..." /></SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {availableM2s.length === 0 ? <SelectItem value="none" disabled>No M.2 available</SelectItem> : availableM2s.map((m) => (
                              <SelectItem key={getSafeId(m)} value={String(getSafeId(m))}>{getValueIgnoreCase(m, 'brand')} {getValueIgnoreCase(m, 'size')} (ID: {getSafeId(m)})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Graphics Card Tab */}
                  <TabsContent value="graphicscard" className="mt-4 space-y-4">
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Assigned Graphics Cards</h4>
                        <span className="text-xs text-muted-foreground">{assignedGraphicsCards.length} cards</span>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {assignedGraphicsCards.length === 0 ? (
                          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">No Graphics Cards assigned</div>
                        ) : (
                          assignedGraphicsCards.map((item) => (
                            <div key={getSafeId(item)} className="flex items-center justify-between p-3 bg-muted/40 rounded-md border group hover:border-primary/50 transition-colors">
                              <div className="flex gap-2 text-sm items-center">
                                <span className="font-semibold">{getValueIgnoreCase(item, 'brand')}</span>
                                <span className="bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded text-xs font-medium">{getValueIgnoreCase(item, 'model')}</span>
                              </div>
                              <ActionTooltip label="Remove Graphics Card">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveGraphicsCard(item)}><Trash2 className="h-4 w-4" /></Button>
                              </ActionTooltip>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <Label className="mb-2 block text-sm font-medium">Add Graphics Card</Label>
                        <Select value={selectedGraphicsCardToAdd} onValueChange={(val) => { setSelectedGraphicsCardToAdd(val); handleAddGraphicsCard(val); }}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Select Graphics Card to add..." /></SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {availableGraphicsCards.length === 0 ? <SelectItem value="none" disabled>No Graphics Cards available</SelectItem> : availableGraphicsCards.map((c) => (
                              <SelectItem key={getSafeId(c)} value={String(getSafeId(c))}>{getValueIgnoreCase(c, 'brand')} {getValueIgnoreCase(c, 'model')} (ID: {getSafeId(c)})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              );

            })()}
          </div>
          <DialogFooter className="sm:justify-between gap-4 sm:gap-0">
            <div className="flex gap-2 justify-center sm:justify-end">
              <Button variant="outline" onClick={() => setEditingItem(null)} disabled={isSaving}>Cancel</Button>
              <Button onClick={saveEdit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Action Confirmation Dialog */}
      < Dialog open={!!actionModal?.isOpen} onOpenChange={(open) => !open && setActionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {actionModal?.type}</DialogTitle>
            <DialogDescription>
              {actionModal?.type === 'Replace' ? 'Select a replacement item and provide a reason.' : 'Please provide a reason for this action.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {actionModal?.type === 'Replace' && (
              <div className="space-y-4">
                {/* 1. Currently Assigned Product */}
                {actionModal.item && (
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">Currently Assigned {actionModal.item.type}</Label>
                    <div className="border rounded-md p-3 bg-muted/50">
                      <p className="text-sm font-medium">
                        {(() => {
                          const d = actionModal.item.data;
                          const brand = getValueIgnoreCase(d, 'brand');
                          const model = getValueIgnoreCase(d, 'model');
                          const name = getValueIgnoreCase(d, 'name');
                          const parts = [];
                          if (brand) parts.push(brand);
                          if (model) parts.push(model);
                          if (name && parts.length === 0) parts.push(name);
                          return parts.length > 0 ? `${parts.join(' ')} (ID: ${getSafeId(d)})` : `Item ID: ${getSafeId(d)}`;
                        })()}
                      </p>
                      {actionModal.item.data.replacement_status === 'pending' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Replacement Pending
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Pending Products Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="pending-select" className="text-sm font-medium">Pending Replacements</Label>
                  {loadingReplacements ? (
                    <div className="text-sm text-muted-foreground">Loading items...</div>
                  ) : (
                    <Select value={selectedReplacement} onValueChange={setSelectedReplacement}>
                      <SelectTrigger id="pending-select">
                        <SelectValue placeholder="Select from pending items..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {pendingReplacementItems.length === 0 ? (
                          <SelectItem value="none-pending" disabled>No pending items</SelectItem>
                        ) : (
                          pendingReplacementItems.map((item) => (
                            <SelectItem key={`pending-${getSafeId(item)}`} value={String(getSafeId(item))}>
                              {(() => {
                                const brand = getValueIgnoreCase(item, 'brand');
                                const model = getValueIgnoreCase(item, 'model');
                                const name = getValueIgnoreCase(item, 'name');
                                const processor = getValueIgnoreCase(item, 'processor');
                                const id = getSafeId(item);
                                const parts = [];
                                if (brand) parts.push(brand);
                                if (model) parts.push(model);
                                if (name && parts.length === 0) parts.push(name);
                                if (processor) parts.push(`(${processor})`);
                                return parts.length > 0 ? `${parts.join(' ')} (${id}) ⏳` : `Item ${id} ⏳`;
                              })()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* 3. Available Products Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="available-select" className="text-sm font-medium">Available Products</Label>
                  {loadingReplacements ? (
                    <div className="text-sm text-muted-foreground">Loading items...</div>
                  ) : (
                    <Select value={selectedReplacement} onValueChange={setSelectedReplacement}>
                      <SelectTrigger id="available-select">
                        <SelectValue placeholder="Select from available items..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {replacementItems.length === 0 ? (
                          <SelectItem value="none-available" disabled>No available items found</SelectItem>
                        ) : (
                          replacementItems.map((item) => (
                            <SelectItem key={`avail-${getSafeId(item)}`} value={String(getSafeId(item))}>
                              {(() => {
                                const brand = getValueIgnoreCase(item, 'brand');
                                const model = getValueIgnoreCase(item, 'model');
                                const name = getValueIgnoreCase(item, 'name');
                                const processor = getValueIgnoreCase(item, 'processor');
                                const config = getValueIgnoreCase(item, 'configuration');
                                const id = getSafeId(item);
                                const parts = [];
                                if (brand) parts.push(brand);
                                if (model) parts.push(model);
                                if (name && parts.length === 0) parts.push(name);
                                if (processor) parts.push(`(${processor})`);
                                if (config) parts.push(`[${config}]`);
                                return parts.length > 0 ? `${parts.join(' ')} (${id})` : `Item ${id}`;
                              })()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="action-reason" className="block">Reason</Label>
              <Input
                id="action-reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button onClick={confirmAction} disabled={confirmLoading || !actionReason.trim() || (actionModal?.type === 'Replace' && !selectedReplacement)}>
              {confirmLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
      <Dialog open={pdfActivityConfirmModalOpen} onOpenChange={setPdfActivityConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm PDF Download</DialogTitle>
            <DialogDescription>
              Are you sure you want to download the Activity History report for this company as a PDF?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfActivityConfirmModalOpen(false)}>No</Button>
            <Button
              onClick={handleDownloadActivityPDF}
              disabled={downloadingActivityPDF}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {downloadingActivityPDF ? "Downloading..." : "Yes, Download PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={pdfCurrentConfirmModalOpen} onOpenChange={setPdfCurrentConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm PDF Download</DialogTitle>
            <DialogDescription>
              Are you sure you want to download the Current Products report for this company as a PDF?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfCurrentConfirmModalOpen(false)}>No</Button>
            <Button
              onClick={handleDownloadCurrentPDF}
              disabled={downloadingCurrentPDF}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {downloadingCurrentPDF ? "Downloading..." : "Yes, Download PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
