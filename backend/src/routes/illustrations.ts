import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  calculateAndSaveIllustration,
  getLatestIllustrationForUser,
} from '../services/illustrationService.js';

export const illustrationRouter = Router();

// POST /api/illustrations/calculate
illustrationRouter.post(
  '/calculate',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dob, gender, sumAssured, modalPremium, premiumFrequency, pt, ppt, policyType, riders } = req.body;

      const result = await calculateAndSaveIllustration(req.user!.userId, {
        dob,
        gender,
        sumAssured: Number(sumAssured),
        modalPremium: Number(modalPremium),
        premiumFrequency,
        pt: Number(pt),
        ppt: Number(ppt),
        policyType,
        riders,
      });

      if (!result.success) {
        res.status(400).json({
          message: 'Policy validation failed. Please correct the highlighted errors.',
          errors: result.errors,
        });
        return;
      }

      res.status(200).json({
        message: 'Benefit illustration calculated successfully',
        illustration: result.data,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/illustrations/latest
illustrationRouter.get(
  '/latest',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const illustration = await getLatestIllustrationForUser(req.user!.userId);
      if (!illustration) {
        res.status(404).json({ message: 'No illustrations found for this user.' });
        return;
      }

      res.status(200).json({ illustration });
    } catch (err) {
      next(err);
    }
  }
);
