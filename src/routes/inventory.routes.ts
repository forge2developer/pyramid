import { Router } from "express";
import {
  getAllLaptops,
  getInventoryFilter,
  deleteLaptop,
  getAllCompanies,
  getAllMonitors,
  getAllRam,
  getAllSystem,
  getAllSSD,
  getAllNVMe,
  getAllHDD,
  getAllGraphicsCard,
  getAllWorkstation,
  updateRam,
  updateLaptop,
  updateMonitor,
  updateNvme,
  editRam,
  updateSystem,
  updateSSD,
  updateHDD,
  updateGraphicsCard,
  updateWorkstation,
  addBulkProducts,
  addLaptopNew as addLaptop,
  addNVMe,
  addHDD,
  addDesktop,
  addWorkstation,
  addMobileWorkstation,
  addMonitor,
  addGraphicsCard,
  addRam,
  addSSD,
  getLaptopHistory,
  getRamHistory,
  getMonitorHistory,
  getSystemHistory,
  getSSDHistory,
  getNVMeHistory,
  addM_2,
  getHDDHistory,
  getGraphicsCardHistory,
  getGraphicsCardHistoryPDF,
  getProductHistoryPDF,
  getWorkstationHistory,
  getMobileWorkstationHistory,
  getAllInventories,
  getAllMobileWorkstation,
  updateMobileWorkstation,
  updateLaptops,
  editM_2,
  deleteM_2,
  getAllM_2,
  updateM_2,
  getM_2History
} from "../controllers/inventory.controller";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { generateDeliveryChallan } from "../controllers/pdf.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// GET /api/inventory/dashboard - Get Dashboard Stats
router.get("/dashboard", getDashboardStats);

// GET /api/inventory/companies - Get all companies for dropdown
router.get("/companies", getAllCompanies);

// GET /api/inventory/inventories - Get all inventories for dropdown
router.get("/inventories", getAllInventories);

// GET /api/inventory/:id - Get single laptop
router.get("/laptops:id", getInventoryFilter);
// POST /api/inventory - Add new laptop (protected)
// PUT /api/inventory/:id - Update laptop (protected)
router.post("/addLaptops", addLaptop);
router.post("/updateLaptop", updateLaptop);

// Laptop History
router.get("/history/laptop/:id", getLaptopHistory);

router.post("/addRam", addRam);
router.post("/updateRam", editRam);

router.post("/addSSD", addSSD);
router.post("/addNVMe", addNVMe);
router.post("/updateNvme", updateNvme);

router.post("/addHDD", addHDD);
router.post("/addMonitor", addMonitor);
router.post("/updateMonitor", updateMonitor);

router.post("/addDesktop", addDesktop);
router.post("/addWorkstation", addWorkstation);
router.post("/addMobileWorkstation", addMobileWorkstation);
router.post("/addGraphicsCard", addGraphicsCard);
router.post("/addBulkProducts", addBulkProducts);

// PDF Generation
router.post("/generate-challan", generateDeliveryChallan);
// DELETE /api/inventory/:id - Delete laptop (protected)
router.delete("/:id", authenticate, deleteLaptop);

// GET /api/inventory - Get all laptops with pagination

router.get("/history/ram/:id", getRamHistory);
router.get("/history/monitor/:id", getMonitorHistory);
router.get("/history/system/:id", getSystemHistory);
router.get("/history/ssd/:id", getSSDHistory);
router.get("/history/nvme/:id", getNVMeHistory);
router.get("/history/hdd/:id", getHDDHistory);
router.get("/history/graphicsCard/:id", getGraphicsCardHistory);
router.post("/history/graphicsCard/:id/pdf", getGraphicsCardHistoryPDF);
router.post("/history/:productType/:id/pdf", getProductHistoryPDF);
router.get("/history/workstation/:id", getWorkstationHistory);
router.get("/history/mobileWorkstation/:id", getMobileWorkstationHistory);
router.get("/history/m2/:id", getM_2History);

router.post("/getallLaptops", getAllLaptops);
router.post("/getallMobileWorkstation", getAllMobileWorkstation);
router.post("/getallMonitor", getAllMonitors);
router.post("/getAllSystems", getAllSystem);
router.post("/updateSystem", updateSystem);

router.post("/getAllRam", getAllRam);
router.post("/getAllSSD", getAllSSD);
router.post("/updateSSD", updateSSD);

router.post("/getAllnvme", getAllNVMe);
router.post("/getAllHDD", getAllHDD);
router.post("/updateHDD", updateHDD);

router.post("/getallGraphicsCard", getAllGraphicsCard);
router.post("/updateGraphicsCard", updateGraphicsCard);

router.post("/getAllWorkstation", getAllWorkstation);
router.post("/updateWorkstation", updateWorkstation);


router.post("/editLaptops", updateLaptops);
router.post("/editWorkstation", updateWorkstation);
router.post("/updateMobileWorkStation", updateMobileWorkstation);



// M.2 Routes
router.post("/addM_2", addM_2);
router.post("/editM_2", editM_2);
router.post("/deleteM_2", deleteM_2);
router.post("/getAllM_2", getAllM_2);
router.post("/updateM_2", updateM_2);

export default router;
