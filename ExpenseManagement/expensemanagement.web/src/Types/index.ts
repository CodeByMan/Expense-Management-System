export interface RegisterFormInputs {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginFormInputs {
  email: string
  password: string
}

export interface UserData {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  token: string;
  email: string;
  profileImageUrl?: string | null;
  expiresOn: string;
  is2FactorRequired: boolean;
  provider?: string;
}

export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Category  {
  id: number;
  categoryName: string;
  categoryDescription: string;
  icon: string;  
  color: string;  
};

export type CreateCategory = Omit<Category, "id">;

export interface CategoryList {
  Id: number;
  CategoryName: string;
  Icon: string;
  color: string;
  CategoryDescription: string;
  CreatedAt: string;
}

export interface CreateExpense {
  Title: string;
  Amount: number;
  CategoryId: number;
  Date: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  categoryId: number; 
  categoryName: string;
  date: string;
}



interface ExpenseShort {
  title: string;
  amount: number;
  categoryName: string;
}

// Savings Goals
export type SavingsGoalDto = {
  id: number;
  name: string;
  target: number;
  saved: number;
  color: string;
  percentageComplete: number;
  remaining: number;
  isComplete: boolean;
};

export type CreateSavingsGoalDto = {
  name: string;
  target: number;
  saved: number;
  color: string;
};

// category budget


export interface CategoryBudgetDto {
  id: number;
  categoryId: number;
  categoryName: string;
  icon: string;
  color: string;
  month: number;
  year: number;
  amount: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
};


export interface MonthlySummaryDto  {
  month: number;
  year: number;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  totalAllocatedToSavings: number; 
  availableSurplus: number;        
  isOverBudget: boolean;
  categories: CategoryBudgetDto[];
};

export interface RecurringExpenseDto {
  id: number;
  title: string;
  amount: number;
  interval: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  dayOfPeriod: number;
  startDate: string;
  endDate?: string;
  nextDue: string;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
};

export interface CreateRecurringExpenseDto {
  title: string;
  amount: number;
  interval: number; // 0=Daily,1=Weekly,2=Monthly,3=Yearly
  dayOfPeriod: number;
  startDate: string;
  endDate?: string;
  categoryId: number;
};


export interface TopCategoryDto {
  categoryId: number;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface AlertDto  {
  type: "warning" | "success" | "info" | "danger";
  message: string;
};

export interface DashboardData {
  summary: {
    totalExpense: number;
    thisMonthExpense: number;
    percentageChange: number;
    topCategoryName: string;
    topCategoryAmount: number;
    lastMonthTotal: number;
  };
  alerts: AlertDto[];
  topCategories: TopCategoryDto[];
  monthlyCharts: { label: string; total: number }[];
  yearlyCharts: { label: string; total: number }[];
  recentExpenses: {
    today: ExpenseShort[];
    yesterday: ExpenseShort[];
  };
}


export interface UserSession {
  id: number;
  ipAddress: string;
  browser: string;
  os: string;
  deviceInfo: string;
  loginAt: string;
  lastActiveAt: string | null;
  isActive: boolean;
};