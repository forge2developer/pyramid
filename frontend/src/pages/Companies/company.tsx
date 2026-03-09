import { useState, useEffect } from "react"
import { Link } from "react-router-dom" // Added for navigation
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Edit, Trash2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Updated interface to match your data structure
interface Laptop {
  id: number
  brand: string
  size: string
  type: string
  service_id: string
  form_factor: string
  pyramid_id: string
  date_of_purchase: string
  company_name?: string
  customer_name?: string
  phone?: string
  address?: string
  city?: string
  pinCode?: string
  gstNumber?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

const ITEMS_PER_PAGE = 20

export default function companyList() {


  const [companyNameOpen, setCompanyNameOpen] = useState(false)
  const [customerNameOpen, setCustomerNameOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)

  const [formData, setFormData] = useState({
    company_name: "",
    customer_name: "",
    phone: "",
    city: "",
  })

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Laptop | null>(null)

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCompany, setDeletingCompany] = useState<Laptop | null>(null)

  const [company, setCompany] = useState<Laptop[]>([])
  const [ramFilters, setRamFilters] = useState<Laptop[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLaptops = async (_page: number = 1, searchData = formData) => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.post(`/Companies/company?page=${_page}&limit=${ITEMS_PER_PAGE}`, searchData)
      setCompany(data.data.company)
      setRamFilters(data.data.data)
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

  const handlePageChange = (page: number) => {
    fetchLaptops(page)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    fetchLaptops(1, formData)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const uniqueCompanyName = [...new Set(ramFilters?.map((company: any) => company.company_name).filter(Boolean))]
  const uniqueCustomerName = [...new Set(ramFilters?.map((company: any) => company.customer_name).filter(Boolean))]
  const uniquePhone = [...new Set(ramFilters?.map((company: any) => company.phone).filter(Boolean))]

  const handleReset = async () => {
    const emptyForm = {
      company_name: "",
      customer_name: "",
      phone: "",
      city: "",
    }
    setFormData(emptyForm)
    fetchLaptops(1, emptyForm)
  }

  // Edit Handlers
  const handleEditClick = (comp: Laptop) => {
    setEditingCompany(comp)
    setEditModalOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingCompany) {
      setEditingCompany({ ...editingCompany, [e.target.name]: e.target.value })
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCompany) return

    try {
      setLoading(true)
      const res = await api.put(`/Companies/updateCompany/${editingCompany.id}`, editingCompany)
      if (res.data.success) {
        toast.success("Company updated successfully")
        setEditModalOpen(false)
        fetchLaptops(pagination.currentPage) // Refresh
      } else {
        toast.error(res.data.message || "Failed to update company")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || "Error updating company")
    } finally {
      setLoading(false)
    }
  }

  // Delete Handlers
  const handleDeleteClick = (comp: Laptop) => {
    setDeletingCompany(comp)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingCompany) return

    try {
      setLoading(true)
      const res = await api.delete(`/Companies/deleteCompany/${deletingCompany.id}`)
      if (res.data.success) {
        toast.success("Company deleted successfully")
        setDeleteDialogOpen(false)
        fetchLaptops(pagination.currentPage) // Refresh list
      } else {
        toast.error(res.data.message || "Failed to delete company")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || "Error deleting company. It might have assigned products.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <FullScreenLoader text="Loading inventory..." />
  }

  return (
    <div className="flex flex-col gap-3">

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Company Name Filter */}
            <div className="space-y-2">
              <Label htmlFor="brand">Company Name</Label>
              <Popover open={companyNameOpen} onOpenChange={setCompanyNameOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formData.company_name || "Select company name..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search company name..." />
                    <CommandList>
                      <CommandEmpty>No company name found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { handleSelectChange("company_name", ""); setCompanyNameOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.company_name === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniqueCompanyName.map((name: any) => (
                          <CommandItem key={name} value={name} onSelect={() => { handleSelectChange("company_name", name); setCompanyNameOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.company_name === name ? "opacity-100" : "opacity-0")} />
                            {name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Customer Name Filter */}
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name</Label>
              <Popover open={customerNameOpen} onOpenChange={setCustomerNameOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formData.customer_name || "Select customer_name..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search customer_name..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { handleSelectChange("customer_name", ""); setCustomerNameOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.customer_name === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniqueCustomerName.map((name: any) => (
                          <CommandItem key={name} value={name} onSelect={() => { handleSelectChange("customer_name", name); setCustomerNameOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.customer_name === name ? "opacity-100" : "opacity-0")} />
                            {name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Phone Filter */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Popover open={phoneOpen} onOpenChange={setPhoneOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formData.phone || "Select Phone..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Phone..." />
                    <CommandList>
                      <CommandEmpty>No phone found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { handleSelectChange("phone", ""); setPhoneOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.phone === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniquePhone.map((p: any) => (
                          <CommandItem key={p} value={p} onSelect={() => { handleSelectChange("phone", p); setPhoneOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.phone === p ? "opacity-100" : "opacity-0")} />
                            {p}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* City Filter */}
            {/* <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formData.city || "Select City..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search City..." />
                    <CommandList>
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { handleSelectChange("city", ""); setCityOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.city === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {uniqueCity.map((loc: any) => (
                          <CommandItem key={loc} value={loc} onSelect={() => { handleSelectChange("city", loc); setCityOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.city === loc ? "opacity-100" : "opacity-0")} />
                            {loc}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div> */}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="submit">Submit</Button>
            <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
          </div>
        </form>
      </div>

      <div className="flex justify-end gap-4">
        <Link to={`/Companies/AddCompany/`}>
          <Button type="button">
            Add Company
          </Button>
        </Link>
      </div>


      <div className="rounded-xl border bg-card shadow-sm">
        {error ? (
          <div className="p-8 text-center text-destructive">{error}</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">S.No</TableHead>
                  <TableHead className="w-[300px]">Company Name</TableHead>
                  <TableHead className="w-[200px]">Customer Name</TableHead>
                  <TableHead className="w-[200px]">Contact Number</TableHead>
                  <TableHead className="w-[150px]">Address</TableHead>
                  <TableHead className="w-[100px]">Pin Code</TableHead>
                  <TableHead className="w-[150px]">GST Number</TableHead>
                  <TableHead className="text-center w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No company found
                    </TableCell>
                  </TableRow>
                ) : (
                  company?.map((laptop: Laptop, index: number) => (
                    <TableRow key={laptop.id}>
                      <TableCell className="font-medium">{(pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                      <TableCell
                        className="text-blue-600 hover:underline cursor-pointer font-semibold"
                      >
                        <Link
                          to={`/Companies/company/${laptop.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {laptop.company_name}
                        </Link>
                      </TableCell>

                      <TableCell>{laptop.customer_name}</TableCell>
                      <TableCell>{laptop.phone}</TableCell>
                      <TableCell>{laptop.address}</TableCell>
                      <TableCell>{laptop.pinCode}</TableCell>
                      <TableCell>{laptop.gstNumber}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handleEditClick(laptop)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteClick(laptop)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination?.totalPages > 0 && (
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
          </>
        )}
      </div>

      {/* Edit Company Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          {editingCompany && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={editingCompany.company_name || ""}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={editingCompany.customer_name || ""}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={editingCompany.phone || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={editingCompany.address || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={editingCompany.city || ""}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pinCode">Pin Code</Label>
                  <Input
                    id="pinCode"
                    name="pinCode"
                    value={editingCompany.pinCode || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  name="gstNumber"
                  value={editingCompany.gstNumber || ""}
                  onChange={handleEditChange}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will attempt to permanently delete the company <strong>{deletingCompany?.company_name}</strong>.
              This action cannot be completed if the company still has assigned inventory items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}