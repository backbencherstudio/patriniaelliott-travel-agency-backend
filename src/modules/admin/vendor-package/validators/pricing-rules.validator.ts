import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Custom validator to ensure pricing rules business logic constraints
 */
export function IsValidPricingRules(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPricingRules',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value !== 'object') {
            return false;
          }

          const {
            base_price,
            weekend_price,
            flat_discount,
            min_stay_nights,
            max_stay_nights,
            weekend_days
          } = value;

          // 1. Ensure minimum stay is not greater than maximum stay
          if (min_stay_nights > max_stay_nights) {
            return false;
          }

          // 2. Ensure flat discount doesn't make prices negative
          if (flat_discount > Math.min(base_price, weekend_price)) {
            return false;
          }

          // 3. Ensure weekend days are valid (0-6)
          if (Array.isArray(weekend_days)) {
            for (const day of weekend_days) {
              if (!Number.isInteger(day) || day < 0 || day > 6) {
                return false;
              }
            }
          }

          // 4. Ensure prices are reasonable (base and weekend prices should be positive after discount)
          const effectiveBasePrice = base_price - flat_discount;
          const effectiveWeekendPrice = weekend_price - flat_discount;
          
          if (effectiveBasePrice <= 0 || effectiveWeekendPrice <= 0) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value;
          if (!value || typeof value !== 'object') {
            return 'Pricing rules must be a valid object';
          }

          const {
            base_price,
            weekend_price,
            flat_discount,
            min_stay_nights,
            max_stay_nights,
            weekend_days
          } = value;

          // Check specific validation failures
          if (min_stay_nights > max_stay_nights) {
            return 'Minimum stay nights cannot be greater than maximum stay nights';
          }

          if (flat_discount > Math.min(base_price, weekend_price)) {
            return 'Flat discount cannot be greater than the minimum of base price or weekend price';
          }

          if (Array.isArray(weekend_days)) {
            for (const day of weekend_days) {
              if (!Number.isInteger(day) || day < 0 || day > 6) {
                return 'Weekend days must be integers between 0-6 (0=Sunday, 6=Saturday)';
              }
            }
          }

          const effectiveBasePrice = base_price - flat_discount;
          const effectiveWeekendPrice = weekend_price - flat_discount;
          
          if (effectiveBasePrice <= 0 || effectiveWeekendPrice <= 0) {
            return 'Effective prices (after flat discount) must be greater than $0';
          }

          return 'Pricing rules validation failed';
        }
      }
    });
  };
}

/**
 * Custom validator to ensure date ranges are valid
 */
export function IsValidDateRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidDateRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value !== 'object') {
            return false;
          }

          const { start_date, end_date } = value;

          if (!start_date || !end_date) {
            return false;
          }

          const start = new Date(start_date);
          const end = new Date(end_date);

          // Check if dates are valid
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return false;
          }

          // Check if start date is before end date
          if (start >= end) {
            return false;
          }

          // Check if dates are not too far in the past (more than 1 year ago)
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          if (start < oneYearAgo) {
            return false;
          }

          // Check if dates are not too far in the future (more than 2 years)
          const twoYearsFromNow = new Date();
          twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
          
          if (end > twoYearsFromNow) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value;
          if (!value || typeof value !== 'object') {
            return 'Date range must be a valid object with start_date and end_date';
          }

          const { start_date, end_date } = value;

          if (!start_date || !end_date) {
            return 'Both start_date and end_date are required';
          }

          const start = new Date(start_date);
          const end = new Date(end_date);

          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 'Invalid date format';
          }

          if (start >= end) {
            return 'Start date must be before end date';
          }

          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          if (start < oneYearAgo) {
            return 'Start date cannot be more than 1 year in the past';
          }

          const twoYearsFromNow = new Date();
          twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
          
          if (end > twoYearsFromNow) {
            return 'End date cannot be more than 2 years in the future';
          }

          return 'Date range validation failed';
        }
      }
    });
  };
}
