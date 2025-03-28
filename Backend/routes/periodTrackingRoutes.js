import express from "express";
import {
  periodTrackingController,
  trackerDataController,
} from "../controllers/periodTrackingController.js";

const route = express.Router();

route.post("/trackerdata", trackerDataController);
route.get("/periodtracking/:userId", periodTrackingController);

export default route;
