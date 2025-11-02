import z from "zod";

export const dashboardTransactionsQuerySchema = z.object({
    page: z
        .string()
        .default("1")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, { message: "page must be greater than 0" }),

    perPage: z
        .string()
        .default("10")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, { message: "perPage must be greater than 0" }),

    payment_method: z.string().optional(),
    type: z
        .enum(["all", "order", "refund"])
        .optional()
        .default('all'),
    dateFilter: z
        .enum(["7days", "30days", "15days", "all", "custom"])
        .optional()
        .default("all"),

    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
}).refine(
    (data) => {
        if (data.dateFilter === "custom") {
            return data.startDate && data.endDate;
        }
        return true;
    },
    { message: "startDate and endDate are required when dateFilter is 'custom'" }
);

export const withdrawQuerySchema = z.object({
    page: z
        .string()
        .default("1")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, { message: "page must be greater than 0" }),

    perPage: z
        .string()
        .default("10")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, { message: "perPage must be greater than 0" }),
    status: z
        .enum(["all", "succeeded", "pending", "cancelled"])
        .optional()
        .default('all'),
    dateRange: z
        .enum(["7d", "30d", "90d", "365d", "all", "custom"])
        .optional()
        .default("7d"),

    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
}).refine(
    (data) => {
        if (data.dateRange === "custom") {
            return data.startDate && data.endDate;
        }
        return true;
    },
    { message: "startDate and endDate are required when dateRange is 'custom'" }
);

export const packageSearchQuerySchema = z.object({
    q: z.string().optional(),
    type: z.string().optional(),

    duration_start: z
        .string()
        .optional()
        .transform((val) => (val ? Number(val) : undefined))
        .refine((val) => val === undefined || !isNaN(val), {
            message: "duration_start must be a number",
        }),

    duration_end: z
        .string()
        .optional()
        .transform((val) => (val ? Number(val) : undefined))
        .refine((val) => val === undefined || !isNaN(val), {
            message: "duration_end must be a number",
        }),

    budget_start: z
        .string()
        .optional()
        .transform((val) => (val ? Number(val) : undefined))
        .refine((val) => val === undefined || !isNaN(val), {
            message: "budget_start must be a number",
        }),

    budget_end: z
        .string()
        .optional()
        .transform((val) => (val ? Number(val) : undefined))
        .refine((val) => val === undefined || !isNaN(val), {
            message: "budget_end must be a number",
        }),

    ratings: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((val) => {
            if (!val) return []
            return Array.isArray(val) ? val.map(Number) : [Number(val)]
        })
        .refine((arr) => arr.every((n) => !isNaN(n)), {
            message: "ratings must be an array of numbers",
        }),

    free_cancellation: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((val) => (val ? (Array.isArray(val) ? val : [val]) : [])),

    destinations: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((val) => (val ? (Array.isArray(val) ? val : [val]) : [])),
    popular_area: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((val) => (val ? (Array.isArray(val) ? val : [val]) : [])),

    languages: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((val) => (val ? (Array.isArray(val) ? val : [val]) : [])),

    // Optional date range filters for availability search
    start_date: z.string().optional(),
    end_date: z.string().optional(),

    cursor: z.string().optional(),

    limit: z
        .string()
        .optional()
        .transform((val) => (val ? Number(val) : 10))
        .refine((val) => val > 0 && val <= 100, {
            message: "limit must be between 1 and 100",
        }),

    page: z
        .string()
        .optional()
        .transform((val) => (val ? Number(val) : 1))
        .refine((val) => val > 0, {
            message: "page must be greater than 0",
        }),
});
