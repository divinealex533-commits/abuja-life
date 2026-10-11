import {
  NPCBusinessVisit,
  getSuccessfulNPCVisits,
} from "@/lib/game/npcBusinessCustomers";

export type BusinessExpenseCategory =
  | "staff"
  | "supplies"
  | "utilities"
  | "maintenance"
  | "marketing"
  | "rent"
  | "transport"
  | "tax"
  | "other";

export interface BusinessRevenueRecord {
  id: string;
  businessId: string;
  amount: number;
  source: "npc_customer" | "player_customer" | "contract" | "other";
  referenceId?: string;
  description: string;
  createdAt: number;
}

export interface BusinessExpenseRecord {
  id: string;
  businessId: string;
  amount: number;
  category: BusinessExpenseCategory;
  description: string;
  createdAt: number;
}

export interface BusinessFinance {
  businessId: string;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  customerCount: number;
  lastRevenueAt: number | null;
  lastExpenseAt: number | null;
}

export interface BusinessFinanceSummary {
  businessId: string;
  revenue: number;
  expenses: number;
  profit: number;
  customers: number;
  averageCustomerSpend: number;
  profitMargin: number;
}

const REVENUE_STORAGE_KEY =
  "abujaLifeBusinessRevenue";

const EXPENSE_STORAGE_KEY =
  "abujaLifeBusinessExpenses";

function createId(
  prefix: string
): string {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function loadRevenueRecords(): BusinessRevenueRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(
      REVENUE_STORAGE_KEY
    );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveRevenueRecords(
  records: BusinessRevenueRecord[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    REVENUE_STORAGE_KEY,
    JSON.stringify(records)
  );
}

function loadExpenseRecords(): BusinessExpenseRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(
      EXPENSE_STORAGE_KEY
    );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveExpenseRecords(
  records: BusinessExpenseRecord[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    EXPENSE_STORAGE_KEY,
    JSON.stringify(records)
  );
}

export function recordBusinessRevenue(
  businessId: string,
  amount: number,
  source:
    | "npc_customer"
    | "player_customer"
    | "contract"
    | "other",
  description: string,
  referenceId?: string
): BusinessRevenueRecord {
  const safeAmount = Math.max(
    0,
    Math.floor(amount)
  );

  const record: BusinessRevenueRecord = {
    id: createId("revenue"),
    businessId,
    amount: safeAmount,
    source,
    referenceId,
    description,
    createdAt: Date.now(),
  };

  const records =
    loadRevenueRecords();

  records.push(record);

  saveRevenueRecords(records);

  return record;
}

export function recordBusinessExpense(
  businessId: string,
  amount: number,
  category: BusinessExpenseCategory,
  description: string
): BusinessExpenseRecord {
  const safeAmount = Math.max(
    0,
    Math.floor(amount)
  );

  const record: BusinessExpenseRecord = {
    id: createId("expense"),
    businessId,
    amount: safeAmount,
    category,
    description,
    createdAt: Date.now(),
  };

  const records =
    loadExpenseRecords();

  records.push(record);

  saveExpenseRecords(records);

  return record;
}

export function recordNPCBusinessRevenue(
  visit: NPCBusinessVisit
): BusinessRevenueRecord | null {
  if (!visit.successful) {
    return null;
  }

  if (visit.amountSpent <= 0) {
    return null;
  }

  return recordBusinessRevenue(
    visit.businessId,
    visit.amountSpent,
    "npc_customer",
    `${visit.businessName} customer purchase`,
    visit.npcId
  );
}

export function recordNPCBusinessVisits(
  visits: NPCBusinessVisit[]
): BusinessRevenueRecord[] {
  const records: BusinessRevenueRecord[] =
    [];

  for (const visit of visits) {
    const record =
      recordNPCBusinessRevenue(
        visit
      );

    if (record) {
      records.push(record);
    }
  }

  return records;
}

export function getBusinessRevenue(
  businessId: string
): number {
  return loadRevenueRecords()
    .filter(
      (record) =>
        record.businessId ===
        businessId
    )
    .reduce(
      (total, record) =>
        total + record.amount,
      0
    );
}

export function getBusinessExpenses(
  businessId: string
): number {
  return loadExpenseRecords()
    .filter(
      (record) =>
        record.businessId ===
        businessId
    )
    .reduce(
      (total, record) =>
        total + record.amount,
      0
    );
}

export function getBusinessProfit(
  businessId: string
): number {
  return (
    getBusinessRevenue(
      businessId
    ) -
    getBusinessExpenses(
      businessId
    )
  );
}

export function getBusinessCustomerCount(
  businessId: string
): number {
  return getSuccessfulNPCVisits()
    .filter(
      (visit) =>
        visit.businessId ===
        businessId
    ).length;
}

export function getBusinessAverageCustomerSpend(
  businessId: string
): number {
  const customers =
    getBusinessCustomerCount(
      businessId
    );

  if (customers === 0) {
    return 0;
  }

  return Math.floor(
    getBusinessRevenue(
      businessId
    ) / customers
  );
}

export function getBusinessProfitMargin(
  businessId: string
): number {
  const revenue =
    getBusinessRevenue(
      businessId
    );

  if (revenue <= 0) {
    return 0;
  }

  const profit =
    getBusinessProfit(
      businessId
    );

  return Number(
    ((profit / revenue) * 100).toFixed(
      2
    )
  );
}

export function getBusinessFinance(
  businessId: string
): BusinessFinance {
  const revenueRecords =
    loadRevenueRecords().filter(
      (record) =>
        record.businessId ===
        businessId
    );

  const expenseRecords =
    loadExpenseRecords().filter(
      (record) =>
        record.businessId ===
        businessId
    );

  const totalRevenue =
    revenueRecords.reduce(
      (total, record) =>
        total + record.amount,
      0
    );

  const totalExpenses =
    expenseRecords.reduce(
      (total, record) =>
        total + record.amount,
      0
    );

  return {
    businessId,
    totalRevenue,
    totalExpenses,
    totalProfit:
      totalRevenue -
      totalExpenses,
    customerCount:
      getBusinessCustomerCount(
        businessId
      ),
    lastRevenueAt:
      revenueRecords.length > 0
        ? Math.max(
            ...revenueRecords.map(
              (record) =>
                record.createdAt
            )
          )
        : null,
    lastExpenseAt:
      expenseRecords.length > 0
        ? Math.max(
            ...expenseRecords.map(
              (record) =>
                record.createdAt
            )
          )
        : null,
  };
}

export function getBusinessFinanceSummary(
  businessId: string
): BusinessFinanceSummary {
  const finance =
    getBusinessFinance(
      businessId
    );

  return {
    businessId,
    revenue:
      finance.totalRevenue,
    expenses:
      finance.totalExpenses,
    profit:
      finance.totalProfit,
    customers:
      finance.customerCount,
    averageCustomerSpend:
      getBusinessAverageCustomerSpend(
        businessId
      ),
    profitMargin:
      getBusinessProfitMargin(
        businessId
      ),
  };
}

export function getBusinessRevenueRecords(
  businessId?: string
): BusinessRevenueRecord[] {
  const records =
    loadRevenueRecords();

  if (!businessId) {
    return records;
  }

  return records.filter(
    (record) =>
      record.businessId ===
      businessId
  );
}

export function getBusinessExpenseRecords(
  businessId?: string
): BusinessExpenseRecord[] {
  const records =
    loadExpenseRecords();

  if (!businessId) {
    return records;
  }

  return records.filter(
    (record) =>
      record.businessId ===
      businessId
  );
}

export function getBusinessRevenueBySource(
  businessId: string
): Record<
  "npc_customer" |
  "player_customer" |
  "contract" |
  "other",
  number
> {
  const records =
    getBusinessRevenueRecords(
      businessId
    );

  return {
    npc_customer:
      records
        .filter(
          (record) =>
            record.source ===
            "npc_customer"
        )
        .reduce(
          (total, record) =>
            total + record.amount,
          0
        ),

    player_customer:
      records
        .filter(
          (record) =>
            record.source ===
            "player_customer"
        )
        .reduce(
          (total, record) =>
            total + record.amount,
          0
        ),

    contract:
      records
        .filter(
          (record) =>
            record.source ===
            "contract"
        )
        .reduce(
          (total, record) =>
            total + record.amount,
          0
        ),

    other:
      records
        .filter(
          (record) =>
            record.source ===
            "other"
        )
        .reduce(
          (total, record) =>
            total + record.amount,
          0
        ),
  };
}

export function getBusinessExpensesByCategory(
  businessId: string
): Record<
  BusinessExpenseCategory,
  number
> {
  const records =
    getBusinessExpenseRecords(
      businessId
    );

  const result: Record<
    BusinessExpenseCategory,
    number
  > = {
    staff: 0,
    supplies: 0,
    utilities: 0,
    maintenance: 0,
    marketing: 0,
    rent: 0,
    transport: 0,
    tax: 0,
    other: 0,
  };

  for (const record of records) {
    result[record.category] +=
      record.amount;
  }

  return result;
}

export function getBusinessesWithRevenue(): string[] {
  const records =
    loadRevenueRecords();

  return Array.from(
    new Set(
      records.map(
        (record) =>
          record.businessId
      )
    )
  );
}

export function getTopBusinessesByRevenue(
  limit = 10
): BusinessFinance[] {
  return getBusinessesWithRevenue()
    .map((businessId) =>
      getBusinessFinance(
        businessId
      )
    )
    .sort(
      (a, b) =>
        b.totalRevenue -
        a.totalRevenue
    )
    .slice(0, limit);
}

export function getTopBusinessesByProfit(
  limit = 10
): BusinessFinance[] {
  return getBusinessesWithRevenue()
    .map((businessId) =>
      getBusinessFinance(
        businessId
      )
    )
    .sort(
      (a, b) =>
        b.totalProfit -
        a.totalProfit
    )
    .slice(0, limit);
}

export function getBusinessDailyRevenue(
  businessId: string,
  dayStart: number
): number {
  return getBusinessRevenueRecords(
    businessId
  )
    .filter(
      (record) =>
        record.createdAt >=
        dayStart
    )
    .reduce(
      (total, record) =>
        total + record.amount,
      0
    );
}

export function getBusinessDailyExpenses(
  businessId: string,
  dayStart: number
): number {
  return getBusinessExpenseRecords(
    businessId
  )
    .filter(
      (record) =>
        record.createdAt >=
        dayStart
    )
    .reduce(
      (total, record) =>
        total + record.amount,
      0
    );
}

export function getBusinessDailyProfit(
  businessId: string,
  dayStart: number
): number {
  return (
    getBusinessDailyRevenue(
      businessId,
      dayStart
    ) -
    getBusinessDailyExpenses(
      businessId,
      dayStart
    )
  );
}

export function clearBusinessFinance(
  businessId: string
): void {
  const revenue =
    loadRevenueRecords().filter(
      (record) =>
        record.businessId !==
        businessId
    );

  const expenses =
    loadExpenseRecords().filter(
      (record) =>
        record.businessId !==
        businessId
    );

  saveRevenueRecords(
    revenue
  );

  saveExpenseRecords(
    expenses
  );
}

export function clearAllBusinessFinance(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    REVENUE_STORAGE_KEY
  );

  localStorage.removeItem(
    EXPENSE_STORAGE_KEY
  );
}