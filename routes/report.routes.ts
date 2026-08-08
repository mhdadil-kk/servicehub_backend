import { Router } from "express";
import { reportService } from "../di/container"; 
import { ReportController } from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { uploadScreenshot } from "../middlewares/upload.middleware";
import {
  CreateReportSchema,
  ReportActionSchema,
  ReportIdParamSchema,
  ReportQuerySchema,
} from "../dtos/report.dto";
import { ROUTES } from "../constants/routes";

const router = Router();
const reportController = new ReportController(reportService);

router.use(authMiddleware);

router.post(
  ROUTES.REPORTS.CREATE,
  roleMiddleware(["user", "provider"]),
  uploadScreenshot.single("screenshot"),
  validate(CreateReportSchema),
  reportController.createReport
);

router.get(
  ROUTES.REPORTS.MY_REPORTS,
  roleMiddleware(["user", "provider"]),
  reportController.getMyReports
);

router.get(
  ROUTES.REPORTS.ALL,
  roleMiddleware("admin"),
  validate(ReportQuerySchema),
  reportController.getAllReports
);

router.get(
  ROUTES.REPORTS.BY_ID,
  validate(ReportIdParamSchema),
  reportController.getReportById
);

router.put(
  ROUTES.REPORTS.ACTION,
  roleMiddleware("admin"),
  validate(ReportActionSchema),
  reportController.takeAction
);

export default router;
