export interface Employee {
  _id: string;
  candidate: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string | null;
  notes?: string;
  hiredAt: string;
  birthdayAt?: string | null;
  terminatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}