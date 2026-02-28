import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import { AddCompany, AddReplace, AddReturn, AddScrap, getAllCompany, getCompanyDetails, getActivityLogs, getScrapHistory, companyUpdateLaptops, companyUpdateSystems, companyUpdateMonitor, companyUpdateRam, companyUpdateSSD, companyUpdateHDD, companyUpdateNVMe, companyUpdateWorkstation, companyUpdateGraphicsCard, companyUpdateM_2, updateScrapSalesStatus, generateScrapHistoryPDF, generateActivityHistoryPDF, generateCurrentProductsPDF, updateCompany, deleteCompany } from "../controllers/companyController";

const router = Router();

// GET /api/inventory/companies - Get all companies for dropdown
router.post("/company", getAllCompany);
router.post("/AddCompany", AddCompany);
router.put("/updateCompany/:id", updateCompany);
router.delete("/deleteCompany/:id", deleteCompany);
router.post("/getCompanyDetails", getCompanyDetails);
router.post("/AddScrap", AddScrap);
router.post("/AddReplace", AddReplace);
router.post("/AddReturn", AddReturn);

router.post("/getScrapHistory", getScrapHistory);
router.post("/update-scrap-sales-status", updateScrapSalesStatus);
router.post("/generateScrapHistoryPDF", generateScrapHistoryPDF);
router.post("/getActivityLogs", getActivityLogs);
router.post("/generateActivityHistoryPDF", generateActivityHistoryPDF);
router.post("/generateCurrentProductsPDF", generateCurrentProductsPDF);

router.post("/companyUpdateLaptops", companyUpdateLaptops);
router.post("/companyUpdateSystems", companyUpdateSystems);
router.post("/companyUpdateMonitor", companyUpdateMonitor);
router.post("/companyUpdateRam", companyUpdateRam);
router.post("/companyUpdateSSD", companyUpdateSSD);
router.post("/companyUpdateHDD", companyUpdateHDD);
router.post("/companyUpdateNVMe", companyUpdateNVMe);
router.post("/companyUpdateWorkstation", companyUpdateWorkstation);
router.post("/companyUpdateGraphicsCard", companyUpdateGraphicsCard);
router.post("/companyUpdateM_2", companyUpdateM_2);



export default router;
