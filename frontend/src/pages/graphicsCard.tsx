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
  pyramid_id: string
  // pyramid_id: string
  phyramidID: string
  generation: string
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

const GraphicsCardInventory = () => {
  const navigate = useNavigate()
  const [brandOpen, setBrandOpen] = useState(false)
  const [sizeOpen, setsizeOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  // const [serviceNumberOpen, setServiceNumberOpen] = useState(false)
  const [serviceTagOpen, setServiceTagOpen] = useState(false)
  const [inventoryIDOpen, setInventoryIDOpen] = useState(false)
  const [pyramidOpen, setPyramidOpen] = useState(false)
  const [generationOpen, setGenerationOpen] = useState(false)

  const [formData, setFormData] = useState({
    brand: "",
    size: "",
    model: "",
    serviceNumber: "",
    serviceTag: "",
    inventoryID: "",
    phyramidID: "",
    generation: "",
    isAvailable: false,
  })

  const [monitorFilters, setMonitorFilters] = useState<Laptop[]>([])

  const [graphicsCard, setGraphicsCard] = useState<Laptop[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingGraphicsCard, setEditingGraphicsCard] = useState<any | null>(null)
  const [scrapItem, setScrapItem] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchLaptops = async (_page: number = 1, showLoader: boolean = true, searchData = formData) => {
    try {
      if (showLoader) setLoading(true)
      setError(null)
      const { data } = await api.post(`/inventory/getallGraphicsCard?page=${_page}&limit=${ITEMS_PER_PAGE}`, searchData)
      setGraphicsCard(data.data.graphicsCard)
      setMonitorFilters(data.data.data)
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

  const handleEditClick = (graphicsCard: any) => {
    setEditingGraphicsCard(graphicsCard)
  }

  const handleSaveEdit = async () => {
    if (!editingGraphicsCard) return

    try {
      setIsSaving(true)
      const { data } = await api.post("/inventory/updateGraphicsCard", editingGraphicsCard)
      if (data.success) {
        toast.success("Graphics Card updated successfully")
        setEditingGraphicsCard(null)
        fetchLaptops(pagination.currentPage, false)
      } else {
        toast.error("Failed to update Graphics Card")
      }
    } catch (err) {
      console.error("Failed to update Graphics Card:", err)
      toast.error("Error updating Graphics Card")
    } finally {
      setIsSaving(false)
    }
  }

  const handleScrapClick = (graphicsCard: any) => {
    setScrapItem(graphicsCard)
  }

  const handleConfirmScrap = async (reason: string) => {
    if (!scrapItem) return
    const user = getAuthCookie()
    // @ts-ignore
    const userId = user?.id || null

    try {
      const payload = {
        producedID: scrapItem.ID,
        produced: 'graphicscard',
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
    fetchLaptops(1, true, formData)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Get unique Brand from Monitor
  const uniqueBrands = [...new Set(monitorFilters?.map((graphicsCard: any) => graphicsCard.brand).filter(Boolean))]

  // Get unique Size from Monitor
  const uniqueSize = [...new Set(monitorFilters?.map((graphicsCard: any) => graphicsCard.size).filter(Boolean))]

  const uniqueGeneration = [...new Set(monitorFilters?.map((graphicsCard: any) => graphicsCard.generation).filter(Boolean))]

  // Get unique Display from Monitor
  const uniqueModel = [...new Set(monitorFilters?.map((graphicsCard: any) => graphicsCard.model).filter(Boolean))]

  // Get unique Service Tag from Monitor
  const uniqueServiceTag = [...new Set(monitorFilters?.map((graphicsCard: any) => graphicsCard.serviceTag).filter(Boolean))]

  // Get unique Pyramid Id from Monitor
  // const uniqueServiceNumber = [...new Set(monitorFilters?.map((graphicsCard: any) => graphicsCard.serviceNumber).filter(Boolean))]

  const uniquePyramidID = [...new Set(monitorFilters?.map((graphicsCard: any) => graphicsCard.phyramidID).filter(Boolean))]

  const uniqueInventoryID = [...new Set(monitorFilters?.map((graphicsCard: any) => graphicsCard.inventoryID).filter(Boolean))]

  const handleReset = async () => {
    const emptyForm = {
      brand: "",
      size: "",
      model: "",
      serviceNumber: "",
      serviceTag: "",
      inventoryID: "",
      phyramidID: "",
      generation: "",
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
                    <CommandInput placeholder="Search generation..." />
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
              <Label htmlFor="model">Model</Label>
              <Popover open={modelOpen} onOpenChange={setModelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={modelOpen}
                    className="w-full justify-between font-normal"
                  >
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
                        {uniqueModel.map((model: any) => (
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
              <Label htmlFor="serviceTag">Service Tag</Label>
              <Popover open={serviceTagOpen} onOpenChange={setServiceTagOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={serviceTagOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.serviceTag || "Select Service Tag..."}
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
                            handleSelectChange("serviceTag", "")
                            setServiceTagOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.serviceTag === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {uniqueServiceTag.map((serviceTag: any) => (
                          <CommandItem
                            key={serviceTag}
                            value={serviceTag}
                            onSelect={() => {
                              handleSelectChange("serviceTag", serviceTag)
                              setServiceTagOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.serviceTag === serviceTag ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {serviceTag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="serviceNumber">ServiceNumber</Label>
              <Popover open={serviceNumberOpen} onOpenChange={setServiceNumberOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={serviceNumberOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.serviceNumber || "Select ServiceNumber..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search ServiceNumber..." />
                    <CommandList>
                      <CommandEmpty>No ServiceNumber found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            handleSelectChange("serviceNumber", "")
                            setServiceNumberOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.serviceNumber === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {uniqueServiceNumber.map((serviceNumber: any) => (
                          <CommandItem
                            key={serviceNumber}
                            value={serviceNumber}
                            onSelect={() => {
                              handleSelectChange("serviceNumber", serviceNumber)
                              setServiceNumberOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.serviceNumber === serviceNumber ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {serviceNumber}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="pyramidID">Pyramid ID</Label>
              <Popover open={pyramidOpen} onOpenChange={setPyramidOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={pyramidOpen}
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
                            setPyramidOpen(false)
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
                        {uniquePyramidID.map((id: any) => (
                          <CommandItem
                            key={id}
                            value={id}
                            onSelect={() => {
                              handleSelectChange("phyramidID", id)
                              setPyramidOpen(false)
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
          <div className="space-y-4">
            <Label htmlFor="isAvailable">Availability</Label>
            <div className="flex items-center space-x-2 h-10">
              <Switch
                id="isAvailable"
                checked={Boolean(formData.isAvailable)}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, isAvailable: checked }));
                  const newItem = { ...formData, isAvailable: checked };
                  api.post("/inventory/getallGraphicsCard", newItem).then(({ data }) => {
                    setGraphicsCard(data.data.graphicsCard);
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
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Pyramid ID</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Generation</TableHead>
                    <TableHead>Model</TableHead>
                    {/* <TableHead>serialNumber</TableHead> */}
                    <TableHead>serviceTag</TableHead>

                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Actions</TableHead>
                    {/* <TableHead>Purchase Date</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {graphicsCard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No graphicsCard found
                      </TableCell>
                    </TableRow>
                  ) : (
                    graphicsCard.map((graphicsCard: any, index) => (
                      <TableRow key={graphicsCard.ID}>
                        <TableCell className="font-medium">{(pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>{graphicsCard.phyramidID}</TableCell>
                        <TableCell
                          className="cursor-pointer hover:underline text-blue-600"
                          onClick={() => navigate(`/Inventory/graphicsCard/${graphicsCard.ID}`)}
                        >
                          {graphicsCard.brand}
                          <div className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2",
                            graphicsCard.isAvailable === "1" || graphicsCard.isAvailable === "true" || graphicsCard.isAvailable === "yes" || graphicsCard.isAvailable === true || graphicsCard.isAvailable === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                              : "bg-red-100 text-red-800 hover:bg-red-100/80"
                          )}>
                            {graphicsCard.isAvailable === "1" || graphicsCard.isAvailable === "true" || graphicsCard.isAvailable === "yes" || graphicsCard.isAvailable === true || graphicsCard.isAvailable === 1 ? "Available" : "Moving"}
                          </div>
                        </TableCell>
                        <TableCell>{graphicsCard.size}</TableCell>
                        <TableCell>{graphicsCard.generation}</TableCell>
                        <TableCell>{graphicsCard.model}</TableCell>
                        {/* <TableCell>{laptop.serviceNumber}</TableCell> */}
                        <TableCell>{graphicsCard.serviceTag}</TableCell>

                        <TableCell>{graphicsCard.inventoryID}</TableCell>
                        <TableCell>
                          <ActionTooltip label="Edit">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(graphicsCard)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Scrap">
                            <Button variant="ghost" size="icon" onClick={() => handleScrapClick(graphicsCard)}>
                              <XCircle className="h-4 w-4 text-orange-600" />
                            </Button>
                          </ActionTooltip>
                        </TableCell>
                        {/* <TableCell>{laptop.date_of_purchase ? new Date(laptop.date_of_purchase).toLocaleDateString() : "-"}</TableCell> */}
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


      <Dialog open={!!editingGraphicsCard} onOpenChange={(open) => !open && setEditingGraphicsCard(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Graphics Card</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingGraphicsCard && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Brand</Label>
                    <Input
                      id="edit-brand"
                      value={editingGraphicsCard.brand}
                      onChange={(e) => setEditingGraphicsCard({ ...editingGraphicsCard, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-size">Size</Label>
                    <Input
                      id="edit-size"
                      value={editingGraphicsCard.size}
                      onChange={(e) => setEditingGraphicsCard({ ...editingGraphicsCard, size: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-generation">Generation</Label>
                    <Input
                      id="edit-generation"
                      value={editingGraphicsCard.generation || ""}
                      onChange={(e) => setEditingGraphicsCard({ ...editingGraphicsCard, generation: e.target.value })}
                      placeholder="Enter Generation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-model">Model</Label>
                    <Input
                      id="edit-model"
                      value={editingGraphicsCard.model}
                      onChange={(e) => setEditingGraphicsCard({ ...editingGraphicsCard, model: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* <div className="space-y-2">
                    <Label htmlFor="edit-serviceNumber">Service Number</Label>
                    <Input
                      id="edit-serviceNumber"
                      value={editingGraphicsCard.serviceNumber}
                      onChange={(e) => setEditingGraphicsCard({ ...editingGraphicsCard, serviceNumber: e.target.value })}
                    />
                  </div> */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-pyramid-id">Pyramid ID</Label>
                    <Input
                      id="edit-pyramid-id"
                      value={editingGraphicsCard.phyramidID || ""}
                      onChange={(e) => setEditingGraphicsCard({ ...editingGraphicsCard, phyramidID: e.target.value })}
                      placeholder="Enter Pyramid ID"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-serviceTag">Service Tag</Label>
                    <Input
                      id="edit-serviceTag"
                      value={editingGraphicsCard.serviceTag}
                      onChange={(e) => setEditingGraphicsCard({ ...editingGraphicsCard, serviceTag: e.target.value })}
                    />
                  </div>

                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGraphicsCard(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScrapDialog
        isOpen={!!scrapItem}
        onClose={() => setScrapItem(null)}
        onConfirm={handleConfirmScrap}
        itemName={`Graphics Card ${scrapItem?.model}`}
      />
    </div >
  )
}

export default GraphicsCardInventory;   