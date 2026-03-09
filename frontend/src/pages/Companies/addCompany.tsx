import { useEffect, useState } from "react"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function AddCompany() {

  // Company form data
  const [companyFormData, setCompanyFormData] = useState({
    company_name: "",
    customer_name: "",
    phone: "",
    address: "",
    city: "",
    pinCode: "",
    gstNumber: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  // Fetch existing companies for validation or selection
  const fetchCompanies = async () => {
    try {
      await api.get("/inventory/companies")
    } catch (err) {
      console.error("Failed to fetch companies", err)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  // Handle CompanyInputChange input change
  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post("/Companies/addCompany", companyFormData)
      handleCompanyReset()
      toast.success("Company added successfully")
      navigate(-1)
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || "Failed to add company")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompanyReset = () => {
    setCompanyFormData({
      company_name: "",
      customer_name: "",
      phone: "",
      address: "",
      city: "",
      pinCode: "",
      gstNumber: "",
    })
  }

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Add New Company</CardTitle>
          <CardDescription>Choose a product type tab and fill the details below to add a product to inventory.</CardDescription>
        </CardHeader>
        <CardContent>

          <form onSubmit={handleCompanySubmit} className="grid grid-cols-3 gap-4">

            {/* Column 1 */}
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_name"
                name="company_name"
                value={companyFormData.company_name}
                onChange={handleCompanyInputChange}
                required
              // placeholder="Enter company name"
              />
            </div>

            {/* Column 2 */}
            <div className="space-y-2">
              <Label htmlFor="customer_name">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer_name"
                name="customer_name"
                value={companyFormData.customer_name}
                onChange={handleCompanyInputChange}
                required
              // placeholder="Enter customer name"
              />
            </div>

            {/* Column 3 */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                value={companyFormData.phone}
                onChange={handleCompanyInputChange}
                required
              // placeholder="Enter phone number"
              />
            </div>

            {/* Column 1 - Row 2 */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={companyFormData.address || ""}
                onChange={handleCompanyInputChange}
              // placeholder="Enter address"
              />
            </div>

            {/* Column 2 - Row 2 */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={companyFormData.city || ""}
                onChange={handleCompanyInputChange}
              // placeholder="Enter city"
              />
            </div>

            {/* Column 3 - Row 2 */}
            <div className="space-y-2">
              <Label htmlFor="pinCode">Pin Code</Label>
              <Input
                id="pinCode"
                name="pinCode"
                type="number"
                value={companyFormData.pinCode || ""}
                onChange={handleCompanyInputChange}
              // placeholder="Enter pin code"
              />
            </div>

            {/* Column 1 - Row 3 */}
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number <span className="text-red-500">*</span></Label>
              <Input
                id="gstNumber"
                name="gstNumber"
                value={companyFormData.gstNumber || ""}
                onChange={handleCompanyInputChange}
                required
              // placeholder="Enter GST Number"
              />
            </div>

            {/* Column 3 - Row 2 */}


            {/* Form Actions */}
            <div className="col-span-3 flex justify-end gap-3 mt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Add Company"}
              </Button>

              <Button type="button" variant="outline" onClick={handleCompanyReset}>
                Reset
              </Button>
            </div>

          </form>

        </CardContent>
      </Card>
    </div>
  )
}