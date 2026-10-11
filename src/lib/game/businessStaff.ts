import {
  recordBusinessExpense,
} from "@/lib/game/businessFinance";

import {
  getBusinessLevel,
} from "@/lib/game/businessProgression";

export type BusinessStaffRole =
  | "manager"
  | "sales"
  | "cashier"
  | "chef"
  | "server"
  | "driver"
  | "security"
  | "cleaner"
  | "designer"
  | "technician"
  | "marketer"
  | "receptionist";

export type StaffMorale =
  | "excellent"
  | "good"
  | "normal"
  | "low"
  | "poor";

export interface BusinessStaffDefinition {
  id: string;
  name: string;
  role: BusinessStaffRole;
  description: string;
  icon: string;
  hiringCost: number;
  weeklySalary: number;
  baseProductivity: number;
  customerBonus: number;
  revenueBonus: number;
  reputationBonus: number;
  requiredBusinessLevel: number;
  tags: string[];
}

export interface BusinessEmployee {
  id: string;
  businessId: string;
  staffTypeId: string;
  name: string;
  role: BusinessStaffRole;
  skillLevel: number;
  experience: number;
  experienceToNextLevel: number;
  morale: StaffMorale;
  productivity: number;
  customerBonus: number;
  revenueBonus: number;
  reputationBonus: number;
  weeklySalary: number;
  hiredAt: number;
  lastPaidAt: number;
  totalSalaryPaid: number;
  daysWorked: number;
  active: boolean;
}

export interface BusinessStaffResult {
  success: boolean;
  employee: BusinessEmployee | null;
  cost: number;
  message: string;
}

export interface BusinessPayrollResult {
  success: boolean;
  employeesPaid: number;
  totalPaid: number;
  message: string;
}

const STORAGE_KEY =
  "abujaLifeBusinessStaff";

const MAX_STAFF_LEVEL = 20;

const STAFF_DEFINITIONS:
  BusinessStaffDefinition[] = [
    {
      id: "manager",
      name: "Business Manager",
      role: "manager",
      description:
        "Runs daily operations and keeps the business performing efficiently.",
      icon: "👔",
      hiringCost: 250_000,
      weeklySalary: 120_000,
      baseProductivity: 85,
      customerBonus: 8,
      revenueBonus: 7,
      reputationBonus: 5,
      requiredBusinessLevel: 5,
      tags: [
        "leadership",
        "operations",
        "premium",
      ],
    },
    {
      id: "sales",
      name: "Sales Representative",
      role: "sales",
      description:
        "Brings in customers and increases business sales.",
      icon: "💼",
      hiringCost: 100_000,
      weeklySalary: 65_000,
      baseProductivity: 75,
      customerBonus: 12,
      revenueBonus: 8,
      reputationBonus: 2,
      requiredBusinessLevel: 2,
      tags: [
        "sales",
        "customers",
      ],
    },
    {
      id: "cashier",
      name: "Cashier",
      role: "cashier",
      description:
        "Handles payments and keeps customer transactions moving.",
      icon: "💳",
      hiringCost: 60_000,
      weeklySalary: 45_000,
      baseProductivity: 72,
      customerBonus: 5,
      revenueBonus: 3,
      reputationBonus: 2,
      requiredBusinessLevel: 1,
      tags: [
        "payments",
        "service",
      ],
    },
    {
      id: "chef",
      name: "Professional Chef",
      role: "chef",
      description:
        "Improves food quality and attracts more restaurant customers.",
      icon: "👨‍🍳",
      hiringCost: 150_000,
      weeklySalary: 90_000,
      baseProductivity: 82,
      customerBonus: 10,
      revenueBonus: 10,
      reputationBonus: 6,
      requiredBusinessLevel: 3,
      tags: [
        "food",
        "quality",
      ],
    },
    {
      id: "server",
      name: "Service Attendant",
      role: "server",
      description:
        "Improves customer service and helps the business handle busy periods.",
      icon: "🧑‍💼",
      hiringCost: 50_000,
      weeklySalary: 40_000,
      baseProductivity: 70,
      customerBonus: 8,
      revenueBonus: 3,
      reputationBonus: 4,
      requiredBusinessLevel: 1,
      tags: [
        "service",
        "customers",
      ],
    },
    {
      id: "driver",
      name: "Business Driver",
      role: "driver",
      description:
        "Handles deliveries, transportation and business errands.",
      icon: "🚗",
      hiringCost: 80_000,
      weeklySalary: 55_000,
      baseProductivity: 76,
      customerBonus: 5,
      revenueBonus: 7,
      reputationBonus: 2,
      requiredBusinessLevel: 2,
      tags: [
        "delivery",
        "transport",
      ],
    },
    {
      id: "security",
      name: "Security Officer",
      role: "security",
      description:
        "Protects customers, employees and business property.",
      icon: "🛡️",
      hiringCost: 70_000,
      weeklySalary: 50_000,
      baseProductivity: 78,
      customerBonus: 3,
      revenueBonus: 2,
      reputationBonus: 5,
      requiredBusinessLevel: 2,
      tags: [
        "security",
        "protection",
      ],
    },
    {
      id: "cleaner",
      name: "Cleaning Staff",
      role: "cleaner",
      description:
        "Keeps the business clean and improves customer satisfaction.",
      icon: "🧹",
      hiringCost: 40_000,
      weeklySalary: 35_000,
      baseProductivity: 68,
      customerBonus: 4,
      revenueBonus: 2,
      reputationBonus: 4,
      requiredBusinessLevel: 1,
      tags: [
        "cleaning",
        "service",
      ],
    },
    {
      id: "designer",
      name: "Creative Designer",
      role: "designer",
      description:
        "Creates branding, visuals and premium customer experiences.",
      icon: "🎨",
      hiringCost: 120_000,
      weeklySalary: 75_000,
      baseProductivity: 80,
      customerBonus: 6,
      revenueBonus: 7,
      reputationBonus: 7,
      requiredBusinessLevel: 3,
      tags: [
        "creative",
        "branding",
      ],
    },
    {
      id: "technician",
      name: "Technical Specialist",
      role: "technician",
      description:
        "Maintains equipment and improves operational efficiency.",
      icon: "🔧",
      hiringCost: 130_000,
      weeklySalary: 80_000,
      baseProductivity: 83,
      customerBonus: 4,
      revenueBonus: 8,
      reputationBonus: 4,
      requiredBusinessLevel: 4,
      tags: [
        "technical",
        "equipment",
      ],
    },
    {
      id: "marketer",
      name: "Marketing Specialist",
      role: "marketer",
      description:
        "Promotes the business and attracts new customers.",
      icon: "📣",
      hiringCost: 110_000,
      weeklySalary: 70_000,
      baseProductivity: 79,
      customerBonus: 15,
      revenueBonus: 6,
      reputationBonus: 4,
      requiredBusinessLevel: 4,
      tags: [
        "marketing",
        "growth",
      ],
    },
    {
      id: "receptionist",
      name: "Receptionist",
      role: "receptionist",
      description:
        "Welcomes customers and manages appointments and enquiries.",
      icon: "📞",
      hiringCost: 55_000,
      weeklySalary: 42_000,
      baseProductivity: 73,
      customerBonus: 7,
      revenueBonus: 3,
      reputationBonus: 4,
      requiredBusinessLevel: 1,
      tags: [
        "front-desk",
        "service",
      ],
    },
  ];

const FIRST_NAMES = [
  "Daniel",
  "David",
  "Emeka",
  "Chinedu",
  "Ibrahim",
  "Yusuf",
  "Musa",
  "Samuel",
  "Victor",
  "Michael",
  "Joshua",
  "Tunde",
  "Femi",
  "Kelechi",
  "Ada",
  "Amaka",
  "Chioma",
  "Blessing",
  "Mary",
  "Esther",
  "Aisha",
  "Fatima",
  "Hauwa",
  "Zainab",
];

function loadAllStaff(): Record<
  string,
  BusinessEmployee[]
> {
  if (
    typeof window === "undefined"
  ) {
    return {};
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return {};
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as Record<
      string,
      BusinessEmployee[]
    >;
  } catch {
    return {};
  }
}

function saveAllStaff(
  staff: Record<
    string,
    BusinessEmployee[]
  >
): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(staff)
  );
}

function createEmployeeName(): string {
  const firstName =
    FIRST_NAMES[
      Math.floor(
        Math.random() *
          FIRST_NAMES.length
      )
    ];

  const number =
    Math.floor(
      Math.random() * 900
    ) + 100;

  return `${firstName} ${number}`;
}

function getExperienceRequired(
  level: number
): number {
  return Math.floor(
    500 *
      Math.pow(
        1.25,
        Math.max(
          0,
          level - 1
        )
      )
  );
}

function calculateMorale(
  productivity: number
): StaffMorale {
  if (productivity >= 90) {
    return "excellent";
  }

  if (productivity >= 75) {
    return "good";
  }

  if (productivity >= 60) {
    return "normal";
  }

  if (productivity >= 40) {
    return "low";
  }

  return "poor";
}

function calculateProductivity(
  employee: BusinessEmployee
): number {
  const moraleBonus =
    employee.morale ===
    "excellent"
      ? 10
      : employee.morale ===
          "good"
        ? 5
        : employee.morale ===
            "low"
          ? -10
          : employee.morale ===
              "poor"
            ? -20
            : 0;

  return Math.max(
    0,
    Math.min(
      100,
      employee.productivity +
        moraleBonus +
        employee.skillLevel * 2
    )
  );
}

export function getStaffDefinitions(): BusinessStaffDefinition[] {
  return [
    ...STAFF_DEFINITIONS,
  ];
}

export function getStaffDefinition(
  staffTypeId: string
): BusinessStaffDefinition | null {
  return (
    STAFF_DEFINITIONS.find(
      (staff) =>
        staff.id ===
        staffTypeId
    ) ?? null
  );
}

export function getStaffDefinitionsByRole(
  role: BusinessStaffRole
): BusinessStaffDefinition[] {
  return STAFF_DEFINITIONS.filter(
    (staff) =>
      staff.role === role
  );
}

export function getBusinessStaff(
  businessId: string
): BusinessEmployee[] {
  const all =
    loadAllStaff();

  return all[businessId]
    ? [...all[businessId]]
    : [];
}

export function getActiveBusinessStaff(
  businessId: string
): BusinessEmployee[] {
  return getBusinessStaff(
    businessId
  ).filter(
    (employee) =>
      employee.active
  );
}

export function getBusinessEmployee(
  businessId: string,
  employeeId: string
): BusinessEmployee | null {
  return (
    getBusinessStaff(
      businessId
    ).find(
      (employee) =>
        employee.id ===
        employeeId
    ) ?? null
  );
}

export function getBusinessStaffCount(
  businessId: string
): number {
  return getActiveBusinessStaff(
    businessId
  ).length;
}

export function getBusinessStaffByRole(
  businessId: string,
  role: BusinessStaffRole
): BusinessEmployee[] {
  return getBusinessStaff(
    businessId
  ).filter(
    (employee) =>
      employee.role === role
  );
}

export function getAvailableStaff(
  businessId: string
): BusinessStaffDefinition[] {
  const businessLevel =
    getBusinessLevel(
      businessId
    );

  return STAFF_DEFINITIONS.filter(
    (staff) =>
      businessLevel >=
      staff.requiredBusinessLevel
  );
}

export function getLockedStaff(
  businessId: string
): BusinessStaffDefinition[] {
  const businessLevel =
    getBusinessLevel(
      businessId
    );

  return STAFF_DEFINITIONS.filter(
    (staff) =>
      businessLevel <
      staff.requiredBusinessLevel
  );
}

export function getStaffCapacity(
  businessId: string
): number {
  const baseCapacity = 2;

  const managerCount =
    getBusinessStaffByRole(
      businessId,
      "manager"
    ).length;

  const staffCount =
    getBusinessStaffCount(
      businessId
    );

  return (
    baseCapacity +
    staffCount +
    managerCount * 3
  );
}

export function canHireStaff(
  businessId: string,
  staffTypeId: string
): {
  allowed: boolean;
  reason: string;
  cost: number;
} {
  const definition =
    getStaffDefinition(
      staffTypeId
    );

  if (!definition) {
    return {
      allowed: false,
      reason:
        "This staff position does not exist.",
      cost: 0,
    };
  }

  const businessLevel =
    getBusinessLevel(
      businessId
    );

  if (
    businessLevel <
    definition.requiredBusinessLevel
  ) {
    return {
      allowed: false,
      reason:
        `Business level ${definition.requiredBusinessLevel} is required.`,
      cost:
        definition.hiringCost,
    };
  }

  const currentStaff =
    getBusinessStaffCount(
      businessId
    );

  const capacity =
    getStaffCapacity(
      businessId
    );

  if (
    currentStaff >=
    capacity
  ) {
    return {
      allowed: false,
      reason:
        "Your business has reached its staff capacity.",
      cost:
        definition.hiringCost,
    };
  }

  return {
    allowed: true,
    reason:
      "Staff member can be hired.",
    cost:
      definition.hiringCost,
  };
}

export function hireBusinessStaff(
  businessId: string,
  staffTypeId: string
): BusinessStaffResult {
  const check =
    canHireStaff(
      businessId,
      staffTypeId
    );

  if (!check.allowed) {
    return {
      success: false,
      employee: null,
      cost: check.cost,
      message: check.reason,
    };
  }

  const definition =
    getStaffDefinition(
      staffTypeId
    );

  if (!definition) {
    return {
      success: false,
      employee: null,
      cost: 0,
      message:
        "Staff definition not found.",
    };
  }

  const now =
    Date.now();

  const employee: BusinessEmployee =
    {
      id:
        `employee-${now}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      businessId,

      staffTypeId,

      name:
        createEmployeeName(),

      role:
        definition.role,

      skillLevel: 1,

      experience: 0,

      experienceToNextLevel:
        getExperienceRequired(1),

      morale: "good",

      productivity:
        definition.baseProductivity,

      customerBonus:
        definition.customerBonus,

      revenueBonus:
        definition.revenueBonus,

      reputationBonus:
        definition.reputationBonus,

      weeklySalary:
        definition.weeklySalary,

      hiredAt: now,

      lastPaidAt: now,

      totalSalaryPaid: 0,

      daysWorked: 0,

      active: true,
    };

  const all =
    loadAllStaff();

  if (!all[businessId]) {
    all[businessId] =
      [];
  }

  all[businessId].push(
    employee
  );

  saveAllStaff(all);

  recordBusinessExpense(
    businessId,
    definition.hiringCost,
    "staff",
    `Hired ${employee.name} as ${definition.name}.`
  );

  return {
    success: true,
    employee,
    cost:
      definition.hiringCost,
    message:
      `${employee.name} has joined your business as ${definition.name}.`,
  };
}

export function fireBusinessStaff(
  businessId: string,
  employeeId: string
): BusinessStaffResult {
  const all =
    loadAllStaff();

  const employees =
    all[businessId];

  if (!employees) {
    return {
      success: false,
      employee: null,
      cost: 0,
      message:
        "Business staff not found.",
    };
  }

  const index =
    employees.findIndex(
      (employee) =>
        employee.id ===
        employeeId
    );

  if (index === -1) {
    return {
      success: false,
      employee: null,
      cost: 0,
      message:
        "Employee not found.",
    };
  }

  const employee =
    employees[index];

  employee.active =
    false;

  all[businessId] =
    employees;

  saveAllStaff(all);

  return {
    success: true,
    employee,
    cost: 0,
    message:
      `${employee.name} has been removed from active staff.`,
  };
}

export function setEmployeeActive(
  businessId: string,
  employeeId: string,
  active: boolean
): BusinessStaffResult {
  const all =
    loadAllStaff();

  const employees =
    all[businessId];

  if (!employees) {
    return {
      success: false,
      employee: null,
      cost: 0,
      message:
        "Business staff not found.",
    };
  }

  const employee =
    employees.find(
      (item) =>
        item.id ===
        employeeId
    );

  if (!employee) {
    return {
      success: false,
      employee: null,
      cost: 0,
      message:
        "Employee not found.",
    };
  }

  employee.active =
    active;

  saveAllStaff(all);

  return {
    success: true,
    employee,
    cost: 0,
    message: active
      ? `${employee.name} is now active.`
      : `${employee.name} is now inactive.`,
  };
}

export function addEmployeeExperience(
  businessId: string,
  employeeId: string,
  experience: number
): BusinessEmployee | null {
  if (experience <= 0) {
    return getBusinessEmployee(
      businessId,
      employeeId
    );
  }

  const all =
    loadAllStaff();

  const employees =
    all[businessId];

  if (!employees) {
    return null;
  }

  const employee =
    employees.find(
      (item) =>
        item.id ===
        employeeId
    );

  if (!employee) {
    return null;
  }

  employee.experience +=
    experience;

  while (
    employee.skillLevel <
      MAX_STAFF_LEVEL &&
    employee.experience >=
      employee.experienceToNextLevel
  ) {
    employee.experience -=
      employee.experienceToNextLevel;

    employee.skillLevel +=
      1;

    employee.experienceToNextLevel =
      getExperienceRequired(
        employee.skillLevel
      );

    employee.productivity =
      Math.min(
        100,
        employee.productivity +
          2
      );

    employee.customerBonus +=
      1;

    employee.revenueBonus +=
      1;

    employee.reputationBonus +=
      1;
  }

  saveAllStaff(all);

  return employee;
}

export function updateEmployeeMorale(
  businessId: string,
  employeeId: string,
  morale: StaffMorale
): BusinessEmployee | null {
  const all =
    loadAllStaff();

  const employees =
    all[businessId];

  if (!employees) {
    return null;
  }

  const employee =
    employees.find(
      (item) =>
        item.id ===
        employeeId
    );

  if (!employee) {
    return null;
  }

  employee.morale =
    morale;

  saveAllStaff(all);

  return employee;
}

export function trainEmployee(
  businessId: string,
  employeeId: string
): BusinessStaffResult {
  const employee =
    getBusinessEmployee(
      businessId,
      employeeId
    );

  if (!employee) {
    return {
      success: false,
      employee: null,
      cost: 0,
      message:
        "Employee not found.",
    };
  }

  const trainingCost =
    Math.floor(
      50_000 *
        Math.pow(
          1.25,
          employee.skillLevel - 1
        )
    );

  if (
    employee.skillLevel >=
    MAX_STAFF_LEVEL
  ) {
    return {
      success: false,
      employee,
      cost: 0,
      message:
        "This employee has reached maximum skill level.",
    };
  }

  const updated =
    addEmployeeExperience(
      businessId,
      employeeId,
      Math.floor(
        employee.experienceToNextLevel *
          0.5
      )
    );

  if (!updated) {
    return {
      success: false,
      employee,
      cost: trainingCost,
      message:
        "Employee training could not be completed.",
    };
  }

  recordBusinessExpense(
    businessId,
    trainingCost,
    "staff",
    `Professional training for ${employee.name}.`
  );

  return {
    success: true,
    employee: updated,
    cost: trainingCost,
    message:
      `${employee.name} completed professional training.`,
  };
}

export function calculateStaffProductivity(
  businessId: string
): number {
  const employees =
    getActiveBusinessStaff(
      businessId
    );

  if (employees.length === 0) {
    return 0;
  }

  const total =
    employees.reduce(
      (sum, employee) =>
        sum +
        calculateProductivity(
          employee
        ),
      0
    );

  return Math.round(
    total /
      employees.length
  );
}

export function calculateStaffCustomerBonus(
  businessId: string
): number {
  return getActiveBusinessStaff(
    businessId
  ).reduce(
    (total, employee) =>
      total +
      employee.customerBonus *
        (calculateProductivity(
          employee
        ) / 100),
    0
  );
}

export function calculateStaffRevenueBonus(
  businessId: string
): number {
  return getActiveBusinessStaff(
    businessId
  ).reduce(
    (total, employee) =>
      total +
      employee.revenueBonus *
        (calculateProductivity(
          employee
        ) / 100),
    0
  );
}

export function calculateStaffReputationBonus(
  businessId: string
): number {
  return getActiveBusinessStaff(
    businessId
  ).reduce(
    (total, employee) =>
      total +
      employee.reputationBonus *
        (calculateProductivity(
          employee
        ) / 100),
    0
  );
}

export function calculateWeeklyPayroll(
  businessId: string
): number {
  return getActiveBusinessStaff(
    businessId
  ).reduce(
    (total, employee) =>
      total +
      employee.weeklySalary,
    0
  );
}

export function calculateDailyPayroll(
  businessId: string
): number {
  return Math.floor(
    calculateWeeklyPayroll(
      businessId
    ) / 7
  );
}

export function payBusinessPayroll(
  businessId: string
): BusinessPayrollResult {
  const all =
    loadAllStaff();

  const employees =
    all[businessId] ?? [];

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.active
    );

  if (
    activeEmployees.length ===
    0
  ) {
    return {
      success: true,
      employeesPaid: 0,
      totalPaid: 0,
      message:
        "There are no active employees to pay.",
    };
  }

  const now =
    Date.now();

  let totalPaid = 0;

  for (const employee of activeEmployees) {
    totalPaid +=
      employee.weeklySalary;

    employee.lastPaidAt =
      now;

    employee.totalSalaryPaid +=
      employee.weeklySalary;

    employee.daysWorked +=
      7;

    addEmployeeExperience(
      businessId,
      employee.id,
      100
    );
  }

  saveAllStaff(all);

  recordBusinessExpense(
    businessId,
    totalPaid,
    "staff",
    `Weekly payroll for ${activeEmployees.length} employees.`
  );

  return {
    success: true,
    employeesPaid:
      activeEmployees.length,
    totalPaid,
    message:
      `Paid ₦${totalPaid.toLocaleString()} in weekly staff salaries.`,
  };
}

export function getStaffSummary(
  businessId: string
): {
  totalStaff: number;
  activeStaff: number;
  managers: number;
  averageSkillLevel: number;
  averageProductivity: number;
  customerBonus: number;
  revenueBonus: number;
  reputationBonus: number;
  weeklyPayroll: number;
  dailyPayroll: number;
  staffCapacity: number;
} {
  const staff =
    getBusinessStaff(
      businessId
    );

  const active =
    staff.filter(
      (employee) =>
        employee.active
    );

  const averageSkillLevel =
    active.length === 0
      ? 0
      : active.reduce(
          (total, employee) =>
            total +
            employee.skillLevel,
          0
        ) /
        active.length;

  return {
    totalStaff:
      staff.length,

    activeStaff:
      active.length,

    managers:
      active.filter(
        (employee) =>
          employee.role ===
          "manager"
      ).length,

    averageSkillLevel:
      Number(
        averageSkillLevel.toFixed(
          1
        )
      ),

    averageProductivity:
      calculateStaffProductivity(
        businessId
      ),

    customerBonus:
      Number(
        calculateStaffCustomerBonus(
          businessId
        ).toFixed(1)
      ),

    revenueBonus:
      Number(
        calculateStaffRevenueBonus(
          businessId
        ).toFixed(1)
      ),

    reputationBonus:
      Number(
        calculateStaffReputationBonus(
          businessId
        ).toFixed(1)
      ),

    weeklyPayroll:
      calculateWeeklyPayroll(
        businessId
      ),

    dailyPayroll:
      calculateDailyPayroll(
        businessId
      ),

    staffCapacity:
      getStaffCapacity(
        businessId
      ),
  };
}

export function getEmployeeMoraleLabel(
  morale: StaffMorale
): string {
  switch (morale) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "normal":
      return "Normal";
    case "low":
      return "Low";
    case "poor":
      return "Poor";
    default:
      return "Normal";
  }
}

export function getEmployeeSkillProgress(
  employee: BusinessEmployee
): number {
  if (
    employee.experienceToNextLevel <=
    0
  ) {
    return 100;
  }

  return Math.min(
    100,
    Math.round(
      (employee.experience /
        employee.experienceToNextLevel) *
        100
    )
  );
}

export function getTopEmployees(
  businessId: string,
  limit = 5
): BusinessEmployee[] {
  return getBusinessStaff(
    businessId
  )
    .sort(
      (a, b) =>
        calculateProductivity(b) -
        calculateProductivity(a)
    )
    .slice(0, limit);
}

export function resetBusinessStaff(
  businessId: string
): void {
  const all =
    loadAllStaff();

  delete all[businessId];

  saveAllStaff(all);
}

export function resetAllBusinessStaff(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );
}