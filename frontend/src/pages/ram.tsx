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

interface Laptop {
  id: number
  brand: string
  size: string
  type: string
  service_id: string
  form_factor: string
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

const RamInventory = () => {
  const navigate = useNavigate()

  const [brandOpen, setBrandOpen] = useState(false)
  const [sizeOpen, setsizeOpen] = useState(false)
  const [displayOpen, setdisplayOpen] = useState(false)
  const [serviceTagOpen, setServiceTagOpen] = useState(false)
  const [pyramidIdOpen, setPyramidIdOpen] = useState(false)
  const [inventoryIDOpen, setInventoryIDOpen] = useState(false)

  const [formData, setFormData] = useState({
    brand: "",
    size: "",
    type: "",
    service_id: "",
    phyramidID: "",
    inventoryID: "",
    isAvailable: false,
  })

  const [ram, setRam] = useState<Laptop[]>([])
  const [ramFilters, setRamFilters] = useState<Laptop[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  })
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [editingRam, setEditingRam] = useState<any | null>(null)
  const [scrapItem, setScrapItem] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchLaptops = async (_page: number = 1, searchData = formData) => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.post(`/inventory/getAllRam?page=${_page}&limit=${ITEMS_PER_PAGE}`, searchData)
      setRam(data.data.ram)
      setRamFilters(data.data.data)
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

  const handleEditClick = (ram: any) => {
    setEditingRam(ram)
  }

  const handleSaveEdit = async () => {
    if (!editingRam) return

    try {
      setIsSaving(true)
      const { data } = await api.post("/inventory/updateRam", editingRam)
      if (data.success) {
        toast.success("RAM updated successfully")
        setEditingRam(null)
        fetchLaptops(pagination.currentPage)
      } else {
        toast.error(data.message || data.error?.message || "Failed to update RAM")
      }
    } catch (err: any) {
      console.error("Full Error Object:", err);
      const backendMessage = err.response?.data?.error?.message || err.response?.data?.message;
      const errorMessage = backendMessage || err.message || "Error updating RAM";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false)
    }
  }

  const handleScrapClick = (ram: any) => {
    setScrapItem(ram)
  }

  const handleConfirmScrap = async (reason: string) => {
    if (!scrapItem) return
    const user = getAuthCookie()
    // @ts-ignore
    const userId = user?.id || null

    try {
      const payload = {
        producedID: scrapItem.id,
        produced: 'ram',
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

  // Get unique Brand from Monitor
  const uniqueBrands = [...new Set(ramFilters?.map((ram: any) => ram.brand).filter(Boolean))]

  // Get unique Size from Monitor
  const uniqueSize = [...new Set(ramFilters?.map((ram: any) => ram.size).filter(Boolean))]

  // Get unique type from Monitor
  const uniqueType = [...new Set(ramFilters?.map((ram: any) => ram.type).filter(Boolean))]

  // Get unique Service Tag from Monitor
  const uniqueserviceTag = [...new Set(ramFilters?.map((ram: any) => ram.service_id).filter(Boolean))]

  // Get unique Pyramid Id from Monitor
  const uniquepyramidId = [...new Set(ramFilters?.map((ram: any) => ram.phyramidID).filter(Boolean))]

  // Get unique Inventory Id
  const uniqueInventoryID = [...new Set(ramFilters?.map((ram: any) => ram.inventoryID).filter(Boolean))]

  const handleReset = async () => {
    const emptyForm = {
      brand: "",
      size: "",
      type: "",
      service_id: "",
      phyramidID: "",
      inventoryID: "",
      isAvailable: false,
    }
    setFormData(emptyForm);
    fetchLaptops(1, emptyForm);
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
              <Label htmlFor="type">Type</Label>
              <Popover open={displayOpen} onOpenChange={setdisplayOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={displayOpen}
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
                            setdisplayOpen(false)
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
                        {uniqueType.map((type: any) => (
                          <CommandItem
                            key={type}
                            value={type}
                            onSelect={() => {
                              handleSelectChange("type", type)
                              setdisplayOpen(false)
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
              <Popover open={serviceTagOpen} onOpenChange={setServiceTagOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={serviceTagOpen}
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
                            setServiceTagOpen(false)
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
                        {uniqueserviceTag.map((service_id: any) => (
                          <CommandItem
                            key={service_id}
                            value={service_id}
                            onSelect={() => {
                              handleSelectChange("service_id", service_id)
                              setServiceTagOpen(false)
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
              <Label htmlFor="phyramidID">Pyramid Id</Label>
              <Popover open={pyramidIdOpen} onOpenChange={setPyramidIdOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={pyramidIdOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.phyramidID || "Select Pyramid Id..."}
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
                        {uniquepyramidId.map((pyramid_id: any) => (
                          <CommandItem
                            key={pyramid_id}
                            value={pyramid_id}
                            onSelect={() => {
                              handleSelectChange("phyramidID", pyramid_id)
                              setPyramidIdOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.phyramidID === pyramid_id ? "opacity-100" : "opacity-0"
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
                        {uniqueInventoryID.map((id: any) => (
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
                  api.post("/inventory/getAllRam", newItem).then(({ data }) => {
                    setRam(data.data.ram);
                    setRamFilters(data.data.data);
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
                    <TableHead>pyramid id</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Service Tag</TableHead>
                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ram.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No ram found
                      </TableCell>
                    </TableRow>
                  ) : (
                    ram.map((ram, index) => (
                      <TableRow key={ram.id}>
                        <TableCell className="font-medium">{(pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>{ram.phyramidID}</TableCell>
                        <TableCell
                          className="cursor-pointer hover:underline text-blue-600"
                          onClick={() => navigate(`/Inventory/ram/${ram.id}`)}
                        >
                          {ram.brand}
                          <div className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2",
                            ram.isAvailable === "1" || ram.isAvailable === "true" || ram.isAvailable === "yes" || ram.isAvailable === true || ram.isAvailable === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                              : "bg-red-100 text-red-800 hover:bg-red-100/80"
                          )}>
                            {ram.isAvailable === "1" || ram.isAvailable === "true" || ram.isAvailable === "yes" || ram.isAvailable === true || ram.isAvailable === 1 ? "Available" : "Moving"}
                          </div>
                        </TableCell>
                        <TableCell>{ram.size}</TableCell>
                        <TableCell>{ram.type}</TableCell>
                        {/* <TableCell>{laptop.form_factor}</TableCell> */}
                        <TableCell>{ram.service_id}</TableCell>
                        <TableCell>{ram.inventoryID}</TableCell>
                        <TableCell>{ram.date_of_purchase ? new Date(ram.date_of_purchase).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <ActionTooltip label="Edit">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(ram)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Scrap">
                            <Button variant="ghost" size="icon" onClick={() => handleScrapClick(ram)}>
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

      <Dialog open={!!editingRam} onOpenChange={(open) => !open && setEditingRam(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit RAM</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingRam && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Brand</Label>
                    <Input
                      id="edit-brand"
                      value={editingRam.brand}
                      onChange={(e) => setEditingRam({ ...editingRam, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-size">Size</Label>
                    <Input
                      id="edit-size"
                      value={editingRam.size}
                      onChange={(e) => setEditingRam({ ...editingRam, size: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Type</Label>
                    <Input
                      id="edit-type"
                      value={editingRam.type}
                      onChange={(e) => setEditingRam({ ...editingRam, type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-form-factor">Form Factor</Label>
                    <Input
                      id="edit-form-factor"
                      value={editingRam.form_factor}
                      onChange={(e) => setEditingRam({ ...editingRam, form_factor: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-service-id">Service Tag</Label>
                    <Input
                      id="edit-service-id"
                      value={editingRam.service_id}
                      onChange={(e) => setEditingRam({ ...editingRam, service_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-pyramid-id">Pyramid ID</Label>
                    <Input
                      id="edit-pyramid-id"
                      value={editingRam.phyramidID || ""}
                      onChange={(e) => setEditingRam({ ...editingRam, phyramidID: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-inventory-id">Inventory ID</Label>
                    <Input
                      id="edit-inventory-id"
                      value={editingRam.inventoryID || ""}
                      onChange={(e) => setEditingRam({ ...editingRam, inventoryID: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-purchase-date">Purchase Date</Label>
                    <Input
                      id="edit-purchase-date"
                      type="date"
                      value={editingRam.date_of_purchase ? new Date(editingRam.date_of_purchase).toISOString().split('T')[0] : ""}
                      onChange={(e) => setEditingRam({ ...editingRam, date_of_purchase: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRam(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScrapDialog
        isOpen={!!scrapItem}
        onClose={() => setScrapItem(null)}
        onConfirm={handleConfirmScrap}
        itemName={`RAM ${scrapItem?.brand} ${scrapItem?.size}`}
      />
    </div >
  )
}

export default RamInventory;   