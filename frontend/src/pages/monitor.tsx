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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface Laptop {
  id: number
  name: string
  size: string
  display: string
  service_tag: string
  pyramid_id: string
  warranty_date: string
  company_id: number | null
  date_of_purchase: string
  inventoryID?: string | number | null
  available?: string | boolean | number
  isAvailable?: string | boolean | number
}


interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

const ITEMS_PER_PAGE = 20

const MonitorInventory = () => {
  const navigate = useNavigate()
  const [brandOpen, setBrandOpen] = useState(false)
  const [sizeOpen, setsizeOpen] = useState(false)
  const [displayOpen, setdisplayOpen] = useState(false)
  const [serviceTagOpen, setServiceTagOpen] = useState(false)
  const [pyramidIdOpen, setPyramidIdOpen] = useState(false)
  const [inventoryIdOpen, setInventoryIdOpen] = useState(false)

  const [formData, setFormData] = useState({
    brand: "",
    size: "",
    display: "",
    service_tag: "",
    pyramid_id: "",
    inventoryID: "",
    isAvailable: false,
  })

  const [monitors, setMonitors] = useState<Laptop[]>([])
  const [monitorFilters, setMonitorFilters] = useState<Laptop[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingMonitor, setEditingMonitor] = useState<Laptop | null>(null)
  const [scrapItem, setScrapItem] = useState<Laptop | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchMonitors = async (_page: number = 1, searchData = formData) => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.post(`/inventory/getallMonitor?page=${_page}&limit=${ITEMS_PER_PAGE}`, searchData)
      setMonitors(data.data.monitors)
      setMonitorFilters(data.data.monitors)
      setPagination(data.data.pagination)
    } catch (err) {
      setError("Failed to fetch inventory data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitors()
  }, [])

  const handlePageChange = (page: number) => {
    fetchMonitors(page)
  }

  const handleEditClick = (monitor: Laptop) => {
    setEditingMonitor(monitor)
  }

  const handleSaveEdit = async () => {
    if (!editingMonitor) return

    try {
      setIsSaving(true)
      const { data } = await api.post("/inventory/updateMonitor", editingMonitor)
      if (data.success) {
        setEditingMonitor(null)
        fetchMonitors(pagination.currentPage)
      } else {
        toast.error("Failed to update monitor")
      }
    } catch (err: any) {
      console.error("Failed to update monitor:", err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || "Error updating monitor")
    } finally {
      setIsSaving(false)
    }
  }

  const handleScrapClick = (monitor: Laptop) => {
    setScrapItem(monitor)
  }

  const handleConfirmScrap = async (reason: string) => {
    if (!scrapItem) return
    const user = getAuthCookie()
    // @ts-ignore
    const userId = user?.id || null

    try {
      const payload = {
        producedID: scrapItem.id,
        produced: 'monitor',
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
        fetchMonitors(pagination.currentPage)
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
    fetchMonitors(1, formData)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Get unique Brand from Monitor
  const uniqueBrands = [...new Set(monitorFilters.map((monitor: any) => monitor.name).filter(Boolean))]

  // Get unique Size from Monitor
  const uniqueSize = [...new Set(monitorFilters.map((monitor: any) => monitor.size).filter(Boolean))]

  // Get unique Display from Monitor
  const uniqueDisplay = [...new Set(monitorFilters.map((monitor: any) => monitor.display).filter(Boolean))]

  // Get unique Service Tag from Monitor
  const uniqueserviceTag = [...new Set(monitorFilters.map((monitor: any) => monitor.service_tag).filter(Boolean))]

  // Get unique Pyramid Id from Monitor
  const uniquepyramidId = [...new Set(monitorFilters.map((monitor: any) => monitor.pyramid_id).filter(Boolean))]

  // Get unique Pyramid Id from Monitor
  const uniqueinventoryID = [...new Set(monitorFilters.map((monitor: any) => monitor.inventoryID).filter(Boolean))]

  const handleReset = async () => {
    const emptyForm = {
      brand: "",
      size: "",
      display: "",
      service_tag: "",
      pyramid_id: "",
      inventoryID: "",
      isAvailable: false,
    }
    setFormData(emptyForm);
    fetchMonitors(1, emptyForm);
  }

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
              <Popover open={sizeOpen} onOpenChange={setsizeOpen}>
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
                            setsizeOpen(false)
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
                        {uniqueSize.map((size: any) => (
                          <CommandItem
                            key={size}
                            value={size}
                            onSelect={() => {
                              handleSelectChange("size", size)
                              setsizeOpen(false)
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
              <Label htmlFor="display">Display</Label>
              <Popover open={displayOpen} onOpenChange={setdisplayOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={displayOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.display || "Select Display..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Display..." />
                    <CommandList>
                      <CommandEmpty>No Display found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            handleSelectChange("display", "")
                            setdisplayOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.display === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {uniqueDisplay.map((display: any) => (
                          <CommandItem
                            key={display}
                            value={display}
                            onSelect={() => {
                              handleSelectChange("display", display)
                              setdisplayOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.display === display ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {display}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_tag">Service Tag</Label>
              <Popover open={serviceTagOpen} onOpenChange={setServiceTagOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={serviceTagOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.service_tag || "Select Service Tag..."}
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
                            handleSelectChange("service_tag", "")
                            setServiceTagOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.service_tag === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {uniqueserviceTag.map((service_tag: any) => (
                          <CommandItem
                            key={service_tag}
                            value={service_tag}
                            onSelect={() => {
                              handleSelectChange("service_tag", service_tag)
                              setServiceTagOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.service_tag === service_tag ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {service_tag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pyramid_id">Pyramid Id</Label>
              <Popover open={pyramidIdOpen} onOpenChange={setPyramidIdOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={pyramidIdOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.pyramid_id || "Select Pyramid Id..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Pyramid Id..." />
                    <CommandList>
                      <CommandEmpty>No Pyramid Id found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            handleSelectChange("pyramid_id", "")
                            setPyramidIdOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.pyramid_id === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {uniquepyramidId.map((pyramid_id: any) => (
                          <CommandItem
                            key={pyramid_id}
                            value={pyramid_id}
                            onSelect={() => {
                              handleSelectChange("pyramid_id", pyramid_id)
                              setPyramidIdOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.pyramid_id === pyramid_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {pyramid_id}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventory_id">Inventory Id</Label>
              <Popover open={inventoryIdOpen} onOpenChange={setInventoryIdOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={inventoryIdOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.inventoryID || "Select Inventory Id..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Pyramid Id..." />
                    <CommandList>
                      <CommandEmpty>No Pyramid Id found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            handleSelectChange("inventoryID", "")
                            setInventoryIdOpen(false)
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
                              setInventoryIdOpen(false)
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
                    api.post("/inventory/getallMonitor", newItem).then(({ data }) => {
                      setMonitors(data.data.monitors);
                      setMonitorFilters(data.data.monitors);
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
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>pyramid id</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Display</TableHead>
                    <TableHead>service tag</TableHead>
                    <TableHead>inventory id</TableHead>
                    <TableHead>warranty</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitors?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No monitors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    monitors?.map((monitor: any, index: number) => (
                      <TableRow key={monitor.id}>
                        <TableCell className="font-medium">{(pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>{monitor.pyramid_id}</TableCell>
                        <TableCell
                          className="cursor-pointer hover:underline text-blue-600"
                          onClick={() => navigate(`/Inventory/monitor/${monitor.id}`)}
                        >
                          {monitor.name}
                          <div className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2",
                            monitor.isAvailable === "1" || monitor.isAvailable === "true" || monitor.isAvailable === "yes" || monitor.isAvailable === true || monitor.isAvailable === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                              : "bg-red-100 text-red-800 hover:bg-red-100/80"
                          )}>
                            {monitor.isAvailable === "1" || monitor.isAvailable === "true" || monitor.isAvailable === "yes" || monitor.isAvailable === true || monitor.isAvailable === 1 ? "Available" : "Moving"}
                          </div>
                        </TableCell>
                        <TableCell>{monitor.size}</TableCell>
                        <TableCell>{monitor.display}</TableCell>
                        <TableCell>{monitor.service_tag}</TableCell>
                        <TableCell>{monitor.inventoryID}</TableCell>
                        <TableCell>{monitor.warranty_date ? new Date(monitor.warranty_date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{monitor.date_of_purchase ? new Date(monitor.date_of_purchase).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <ActionTooltip label="Edit">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(monitor)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Scrap">
                            <Button variant="ghost" size="icon" onClick={() => handleScrapClick(monitor)}>
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

      <Dialog open={!!editingMonitor} onOpenChange={(open) => !open && setEditingMonitor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Monitor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingMonitor && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Brand</Label>
                    <Input
                      id="edit-name"
                      value={editingMonitor.name}
                      onChange={(e) => setEditingMonitor({ ...editingMonitor, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-size">Size</Label>
                    <Input
                      id="edit-size"
                      value={editingMonitor.size}
                      onChange={(e) => setEditingMonitor({ ...editingMonitor, size: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-display">Display</Label>
                    <Input
                      id="edit-display"
                      value={editingMonitor.display}
                      onChange={(e) => setEditingMonitor({ ...editingMonitor, display: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-service-tag">Service Tag</Label>
                    <Input
                      id="edit-service-tag"
                      value={editingMonitor.service_tag}
                      onChange={(e) => setEditingMonitor({ ...editingMonitor, service_tag: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pyramid-id">Pyramid ID</Label>
                    <Input
                      id="edit-pyramid-id"
                      value={editingMonitor.pyramid_id}
                      onChange={(e) => setEditingMonitor({ ...editingMonitor, pyramid_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-inventory-id">Inventory ID</Label>
                    <Input
                      id="edit-inventory-id"
                      value={editingMonitor.inventoryID || ""}
                      onChange={(e) => setEditingMonitor({ ...editingMonitor, inventoryID: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-warranty-date">Warranty Date</Label>
                    <Input
                      id="edit-warranty-date"
                      type="date"
                      value={editingMonitor.warranty_date ? new Date(editingMonitor.warranty_date).toISOString().split('T')[0] : ""}
                      onChange={(e) => setEditingMonitor({ ...editingMonitor, warranty_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-purchase-date">Purchase Date</Label>
                    <Input
                      id="edit-purchase-date"
                      type="date"
                      value={editingMonitor.date_of_purchase ? new Date(editingMonitor.date_of_purchase).toISOString().split('T')[0] : ""}
                      onChange={(e) => setEditingMonitor({ ...editingMonitor, date_of_purchase: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMonitor(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScrapDialog
        isOpen={!!scrapItem}
        onClose={() => setScrapItem(null)}
        onConfirm={handleConfirmScrap}
        itemName={`Monitor ${scrapItem?.name}`}
      />
    </div>
  )
}

export default MonitorInventory;   