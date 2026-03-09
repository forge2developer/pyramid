import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Home from './pages/home.tsx'
import Login from './pages/login.tsx'
import LaptopInventory from './pages/inventory.tsx'
import MonitorInventory from './pages/monitor.tsx'
import RamInventory from './pages/ram.tsx'
import M2Inventory from './pages/m2.tsx'

import AddProducts from './pages/addProducts.tsx'
import SystemInventory from './pages/system.tsx'
import SSDInventory from './pages/ssd.tsx'
import NVMeInventory from './pages/nvme.tsx'
import HHDInventory from './pages/hdd.tsx'
import GraphicsCardInventory from './pages/graphicsCard.tsx'
import WorkstationInventory from './pages/workstation.tsx'
import Companys from './pages/Companies/company.tsx'
import CompanyDetails from './pages/Companies/companyDetails.tsx'
import MobileWorkstationInventory from './pages/mobileWorkstation.tsx'
import AddCompany from './pages/Companies/addCompany.tsx'
import AddCompanyProducts from './pages/Companies/addCompanyProducts.tsx'
import ChallanHistory from './pages/ChallanHistory.tsx'
import LaptopHistory from './pages/LaptopHistory.tsx'
import RamHistory from './pages/RamHistory.tsx'
import MonitorHistory from './pages/MonitorHistory.tsx'
import SystemHistory from './pages/SystemHistory.tsx'
import SSDHistory from './pages/SSDHistory.tsx'
import NVMeHistory from './pages/NVMeHistory.tsx'
import HDDHistory from './pages/HDDHistory.tsx'
import GraphicsCardHistory from './pages/GraphicsCardHistory.tsx'
import WorkstationHistory from './pages/WorkstationHistory.tsx'
import MobileWorkstationHistory from './pages/MobileWorkstationHistory.tsx'
import ScrapHistory from './pages/ScrapHistory.tsx'
import UserManagement from './pages/UserManagement.tsx'
import M2History from './pages/M2History.tsx'

createRoot(document.getElementById('root')!).render(

  <BrowserRouter>
    <Routes>
      {/* Login page without sidebar */}
      {/* <Route path="/" element={<Login />} /> */}

      <Route path="/login" element={<Login />} />

      {/* All other pages with sidebar layout */}
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="/Inventory/Laptop" element={<LaptopInventory />} />
        <Route path="/Inventory/Laptop/:id" element={<LaptopHistory />} />
        <Route path="/Inventory/monitor" element={<MonitorInventory />} />
        <Route path="/Inventory/monitor/:id" element={<MonitorHistory />} />
        <Route path="/Inventory/ram" element={<RamInventory />} />
        <Route path="/Inventory/ram/:id" element={<RamHistory />} />
        <Route path="/Inventory/system" element={<SystemInventory />} />
        <Route path="/Inventory/system/:id" element={<SystemHistory />} />
        <Route path="/Inventory/SSD" element={<SSDInventory />} />
        <Route path="/Inventory/ssd/:id" element={<SSDHistory />} />
        <Route path="/Inventory/NVMe" element={<NVMeInventory />} />
        <Route path="/Inventory/nvme/:id" element={<NVMeHistory />} />
        <Route path="/Inventory/HDD" element={<HHDInventory />} />
        <Route path="/Inventory/hdd/:id" element={<HDDHistory />} />
        <Route path="/Inventory/graphicsCard" element={<GraphicsCardInventory />} />
        <Route path="/Inventory/graphicsCard/:id" element={<GraphicsCardHistory />} />
        <Route path="/Inventory/workstation" element={<WorkstationInventory />} />
        <Route path="/Inventory/workstation/:id" element={<WorkstationHistory />} />
        <Route path="/Inventory/mobileWorkstation" element={<MobileWorkstationInventory />} />
        <Route path="/Inventory/mobileWorkstation/:id" element={<MobileWorkstationHistory />} />
        <Route path="/Inventory/m2" element={<M2Inventory />} />
        <Route path="/Inventory/m2/:id" element={<M2History />} />
        <Route path="/Inventory/add-products" element={<AddProducts />} />
        <Route path="/Companies/company" element={<Companys />} />
        <Route path="/Companies/company/:id" element={<CompanyDetails />} />
        <Route path="/companies/:id/add-products" element={<AddCompanyProducts />} />
        <Route path="/Companies/AddCompany/" element={<AddCompany />} />
        <Route path="/challan-history" element={<ChallanHistory />} />
        <Route path="/scrap-history" element={<ScrapHistory />} />
        <Route path="/user-management" element={<UserManagement />} />
      </Route>

    </Routes>
  </BrowserRouter>

)
