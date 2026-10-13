import { Router, Request, Response, NextFunction } from 'express';
import {
  AVAILABLE_RIDERS,
  DEFAULT_BONUS_RATES,
  MIN_SA_CAP,
  MIN_SA_MULTIPLIER,
  PREMIUM_OPTIONS,
  SUPPORTED_POLICY_TYPES,
} from '../services/calculation.js';
import {
  MAX_AGE,
  MAX_MODAL_PREMIUM,
  MAX_PT,
  MAX_PPT,
  MIN_AGE,
  MIN_MODAL_PREMIUM,
  MIN_PT,
  MIN_PPT,
  VALID_FREQUENCIES,
} from '../services/validation.js';
import { fetchBonusRates } from '../services/illustrationService.js';

export const policyRouter = Router();

// GET /api/policy/config
policyRouter.get(
  '/config',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bonusRates = await fetchBonusRates();

      res.status(200).json({
        pptRange: { min: MIN_PPT, max: MAX_PPT },
        ptRange: { min: MIN_PT, max: MAX_PT },
        modalPremiumRange: { min: MIN_MODAL_PREMIUM, max: MAX_MODAL_PREMIUM },
        ageRange: { min: MIN_AGE, max: MAX_AGE },
        frequencies: VALID_FREQUENCIES,
        minSaMultiplier: MIN_SA_MULTIPLIER,
        minSaCap: MIN_SA_CAP,
        bonusRates,
        policyTypes: SUPPORTED_POLICY_TYPES,
        riders: AVAILABLE_RIDERS,
        premiumOptions: PREMIUM_OPTIONS,
      });
    } catch (err) {
      next(err);
    }
  }
);
