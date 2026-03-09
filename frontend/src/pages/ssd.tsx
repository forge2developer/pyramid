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
  ssdSize: string
  speed: string
  // SerialNumber: string
  serviceTag: string
  phyramidID: string
  inventoryID: string
  dateOfPurchase: string
  isAvailable?: string | boolean | number
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

const ITEMS_PER_PAGE = 20

const SSDInventory = () => {
  const navigate = useNavigate()
  const [brandOpen, setBrandOpen] = useState(false)
  const [sizeOpen, setsizeOpen] = useState(false)
  const [serviceTagOpen, setServiceTagOpen] = useState(false)
  // const [SerialNumberOpen, setSerialNumberOpen] = useState(false)
  const [pyramidIdOpen, setPyramidIdOpen] = useState(false)
  const [inventoryIDOpen, setInventoryIDOpen] = useState(false)

  const [formData, setFormData] = useState({
    brand: "",
    size: "",
    service_tag: "",
    // SerialNumber: "",
    phyramidID: "",
    inventoryID: "",
    isAvailable: false,
  })

  const [ssd, setSSD] = useState<Laptop[]>([])
  const [ssdFilters, setSSDFilters] = useState<Laptop[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingSSD, setEditingSSD] = useState<any | null>(null)
  const [scrapItem, setScrapItem] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchLaptops = async (_page: number = 1, showLoader: boolean = true, searchData = formData) => {
    try {
      if (showLoader) setLoading(true)
      setError(null)
      const { data } = await api.post(`/inventory/getAllSSD?page=${_page}&limit=${ITEMS_PER_PAGE}`, searchData)
      setSSD(data.data.ssd)
      setSSDFilters(data.data.data)
      setPagination(data.data.pagination)
      console.log(data);

    } catch (err) {
      setError("Failed to fetch inventory data")
      console.error(err)
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => {
    fetchLaptops()
  }, [])

  const handlePageChange = (page: number) => {
    fetchLaptops(page)
  }

  const handleEditClick = (ssd: any) => {
    setEditingSSD(ssd)
  }

  const handleSaveEdit = async () => {
    if (!editingSSD) return

    try {
      setIsSaving(true)
      const { data } = await api.post("/inventory/updateSSD", editingSSD)
      if (data.success) {
        setEditingSSD(null)
        toast.success("SSD updated successfully")
        fetchLaptops(pagination.currentPage, false)
      } else {
        toast.error("Failed to update SSD")
      }
    } catch (err: any) {
      console.error("Failed to update SSD:", err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || err.message || "Error updating SSD")
    } finally {
      setIsSaving(false)
    }
  }

  const handleScrapClick = (ssd: any) => {
    setScrapItem(ssd)
  }

  const handleConfirmScrap = async (reason: string) => {
    if (!scrapItem) return
    const user = getAuthCookie()
    // @ts-ignore
    const userId = user?.id || null

    try {
      const payload = {
        producedID: scrapItem.ssdID,
        produced: 'ssd',
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
        fetchLaptops(pagination.currentPage, false)
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
    fetchLaptops(1, true, formData)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Get unique Brand from Monitor
  const uniqueBrands = [...new Set(ssdFilters?.map((monitor: any) => monitor.brand).filter(Boolean))]

  // Get unique Size from Monitor
  const uniqueSize = [...new Set(ssdFilters?.map((monitor: any) => monitor.ssdSize).filter(Boolean))]

  // Get unique Service Tag from Monitor
  const uniqueserviceTag = [...new Set(ssdFilters?.map((monitor: any) => monitor.serviceTag).filter(Boolean))]

  // Get unique Pyramid Id from Monitor
  const uniquepyramidId = [...new Set(ssdFilters?.map((monitor: any) => monitor.phyramidID).filter(Boolean))]

  const uniqueInventoryID = [...new Set(ssdFilters?.map((monitor: any) => monitor.inventoryID).filter(Boolean))]

  const handleReset = async () => {
    const emptyForm = {
      brand: "",
      size: "",
      service_tag: "",
      phyramidID: "",
      inventoryID: "",
      isAvailable: false,
    }
    setFormData(emptyForm);
    fetchLaptops(1, true, emptyForm);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand</Label>
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
                      <CommandEmpty>No size found.</CommandEmpty>
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
              <Label htmlFor="service_tag">Service Tag</Label>
              <Popover open={serviceTagOpen} onOpenChange={setServiceTagOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={serviceTagOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.service_tag || "Select service_tag..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search service_tag..." />
                    <CommandList>
                      <CommandEmpty>No service_tag found.</CommandEmpty>
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
            {/* <div className="space-y-2">
              <Label htmlFor="SerialNumber">SerialNumber</Label>
              <Popover open={SerialNumberOpen} onOpenChange={setSerialNumberOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={SerialNumberOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.SerialNumber || "Select SerialNumber..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search SerialNumber..." />
                    <CommandList>
                      <CommandEmpty>No SerialNumber found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            handleSelectChange("SerialNumber", "")
                            setSerialNumberOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.SerialNumber === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {uniquepyramidId.map((SerialNumber: any) => (
                          <CommandItem
                            key={SerialNumber}
                            value={SerialNumber}
                            onSelect={() => {
                              handleSelectChange("SerialNumber", SerialNumber)
                              setSerialNumberOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.SerialNumber === SerialNumber ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {SerialNumber}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div> */}
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
                        {uniquepyramidId.map((id: any) => (
                          <CommandItem
                            key={id}
                            value={id}
                            onSelect={() => {
                              handleSelectChange("phyramidID", id)
                              setPyramidIdOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.phyramidID === id ? "opacity-100" : "opacity-0"
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
                  api.post("/inventory/getAllSSD", newItem).then(({ data }) => {
                    setSSD(data.data.ssd);
                    setSSDFilters(data.data.data);
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
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Pyramid ID</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Speed</TableHead>
                    {/* <TableHead>SerialNumber</TableHead> */}
                    <TableHead>ServiceTag</TableHead>

                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Actions</TableHead>
                    {/* <TableHead>pyramid id</TableHead> */}
                    {/* <TableHead>Purchase Date</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ssd.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No SSD found
                      </TableCell>
                    </TableRow>
                  ) : (
                    ssd.map((ssd: any, index) => (
                      <TableRow key={ssd.ssdID}>
                        <TableCell className="font-medium">{(pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>{ssd.phyramidID}</TableCell>
                        <TableCell
                          className="cursor-pointer hover:underline text-blue-600"
                          onClick={() => navigate(`/Inventory/ssd/${ssd.ssdID}`)}
                        >
                          {ssd.brand}
                          <div className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2",
                            ssd.isAvailable === "1" || ssd.isAvailable === "true" || ssd.isAvailable === "yes" || ssd.isAvailable === true || ssd.isAvailable === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                              : "bg-red-100 text-red-800 hover:bg-red-100/80"
                          )}>
                            {ssd.isAvailable === "1" || ssd.isAvailable === "true" || ssd.isAvailable === "yes" || ssd.isAvailable === true || ssd.isAvailable === 1 ? "Available" : "Moving"}
                          </div>
                        </TableCell>
                        <TableCell>{ssd.ssdSize}</TableCell>
                        <TableCell>{ssd.speed}</TableCell>
                        {/* <TableCell>{laptop.SerialNumber}</TableCell> */}
                        <TableCell>{ssd.serviceTag}</TableCell>

                        <TableCell>{ssd.inventoryID}</TableCell>
                        <TableCell>
                          <ActionTooltip label="Edit">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(ssd)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Scrap">
                            <Button variant="ghost" size="icon" onClick={() => handleScrapClick(ssd)}>
                              <XCircle className="h-4 w-4 text-orange-600" />
                            </Button>
                          </ActionTooltip>
                        </TableCell>
                        {/* <TableCell>{laptop.service_id}</TableCell>
                      <TableCell>{laptop.date_of_purchase ? new Date(laptop.date_of_purchase).toLocaleDateString() : "-"}</TableCell> */}
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


      <Dialog open={!!editingSSD} onOpenChange={(open) => !open && setEditingSSD(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit SSD</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingSSD && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Name</Label>
                    <Input
                      id="edit-brand"
                      value={editingSSD.brand}
                      onChange={(e) => setEditingSSD({ ...editingSSD, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-size">Size</Label>
                    <Input
                      id="edit-size"
                      value={editingSSD.ssdSize}
                      onChange={(e) => setEditingSSD({ ...editingSSD, ssdSize: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* <div className="space-y-2">
                    <Label htmlFor="edit-serial">Serial Number</Label>
                    <Input
                      id="edit-serial"
                      value={editingSSD.SerialNumber}
                      onChange={(e) => setEditingSSD({ ...editingSSD, SerialNumber: e.target.value })}
                    />
                  </div> */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-speed">Speed</Label>
                    <Input
                      id="edit-speed"
                      value={editingSSD.speed || ""}
                      onChange={(e) => setEditingSSD({ ...editingSSD, speed: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-service-tag">Service Tag</Label>
                    <Input
                      id="edit-service-tag"
                      value={editingSSD.serviceTag}
                      onChange={(e) => setEditingSSD({ ...editingSSD, serviceTag: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-pyramid-id">Pyramid ID</Label>
                    <Input
                      id="edit-pyramid-id"
                      value={editingSSD.phyramidID || ""}
                      onChange={(e) => setEditingSSD({ ...editingSSD, phyramidID: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSSD(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScrapDialog
        isOpen={!!scrapItem}
        onClose={() => setScrapItem(null)}
        onConfirm={handleConfirmScrap}
        itemName={`SSD ${scrapItem?.brand} ${scrapItem?.ssdSize}`}
      />
    </div >
  )
}

export default SSDInventory;   