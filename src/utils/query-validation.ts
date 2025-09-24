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
