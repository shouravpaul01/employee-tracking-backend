import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { QuoteValidation } from "./quote.validation";
import { QuoteController } from "./quote.controller";

const router = express.Router();

router.post("/send-email",(req,res,next)=>{console.log(req.body,"dkdkkd"),next()}, validateRequest(QuoteValidation.sendQuoteSchema),QuoteController.sendQuoteClient);

export const QuoteRoute = router;
