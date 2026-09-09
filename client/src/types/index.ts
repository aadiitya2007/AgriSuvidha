export type Role = 'FARMER' | 'CENTRE_OPERATOR' | 'CENTRE_MANAGER' | 'PLATFORM_ADMIN';

export type OperationalStatus =
  | 'OPERATIONAL'
  | 'LIMITED_SERVICE'
  | 'TEMPORARILY_CLOSED'
  | 'SYSTEM_OUTAGE'
  | 'LOGISTICS_DELAYED';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_INSPECTION' | 'SERVED' | 'NO_SHOW' | 'CANCELLED';

export type QualityGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECTED';

export type ProcurementStatus =
  | 'SUBMITTED'
  | 'UNDER_INSPECTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_INITIATED'
  | 'PAID';

export type PaymentStatus = 'PENDING' | 'INITIATED' | 'SUCCESS' | 'FAILED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: Role;
  profile?: FarmerProfile;
  assignedCentres?: Array<{
    centreId: string;
    centreName: string;
    role: Role;
  }>;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  fullName: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  farmSizeAcres: number;
  preferredLanguage: string;
  farmerRegistrationNumber: string;
  bankAccountNumber: string;
  bankIfsc: string;
  consentCommunications: boolean;
}

export interface Centre {
  id: string;
  name: string;
  code: string;
  district: string;
  state: string;
  pincode: string;
  address: string;
  latitude: number;
  longitude: number;
  operatingHours: string;
  dailyCapacity: number;
  operationalStatus: OperationalStatus;
  statusNotice?: string;
  phone: string;
  email: string;
  distanceKm?: number;
  activeQueueCount?: number;
  commodities?: Array<{
    id: string;
    name: string;
    code: string;
    category: string;
    minMspPrice: number;
    unit: string;
  }>;
  activeIncidents?: Array<{
    id: string;
    title: string;
    severity: IncidentSeverity;
    impactStatement: string;
    pauseBookings: boolean;
  }>;
}

export interface Slot {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCapacity: number;
  remainingCapacity: number;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  bookingReference: string;
  farmerId: string;
  slotId: string;
  centreId: string;
  commodityId: string;
  estimatedQuantity: number;
  status: BookingStatus;
  createdAt: string;
  centre: Centre;
  commodity: { id: string; name: string; code: string; minMspPrice: number; unit: string };
  slot: Slot;
  farmer?: { phone: string; farmerProfile?: FarmerProfile };
  queueEntry?: QueueEntry;
  activeOtp?: string;
  activeQr?: string;
  procurementRecord?: ProcurementRecord;
  isCancellable?: boolean;
  cancellationDeadline?: string | null;
  cancellationBlockedReason?: string | null;
  cancellationReason?: string | null;
}

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  tokenDisplay: string;
  status: QueueStatus;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  calledAt?: string;
  farmerName?: string;
  farmerPhone?: string;
  commodityName?: string;
  estimatedQuantity?: number;
}

export interface ProcurementRecord {
  id: string;
  bookingId?: string;
  receiptNumber: string;
  submittedWeight: number;
  acceptedWeight: number;
  rejectedWeight: number;
  unit: string;
  qualityGrade: QualityGrade;
  moistureContent: number;
  foreignMatterPercent: number;
  ratePerUnit: number;
  grossPayable: number;
  deductions: number;
  netPayable: number;
  deductionReason?: string;
  status: ProcurementStatus;
  inspectionNotes?: string;
  createdAt: string;
  commodity: { name: string; code: string; unit: string };
  centre: { name: string; code: string; address: string };
  farmer: { phone: string; farmerProfile?: FarmerProfile };
  payment?: Payment;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  paymentMode: string;
  transactionReference?: string;
  status: PaymentStatus;
  paidAt?: string;
}

export interface Incident {
  id: string;
  centreId: string;
  title: string;
  incidentType: string;
  severity: IncidentSeverity;
  impactStatement: string;
  status: IncidentStatus;
  affectedBookingsCount: number;
  expectedRecoveryTime?: string;
  pauseBookings: boolean;
  createdAt: string;
  centre: { name: string; code: string; district: string };
  updates?: Array<{ id: string; message: string; createdAt: string }>;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stockQuantity: number;
  imageUrl?: string;
  category: { name: string };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  pickupOtp?: string;
  pickupQr?: string;
  createdAt: string;
  centreId?: string;
  centre: { id?: string; name: string; address: string };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: Product;
  }>;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  createdAt: string;
  centre?: { name: string };
  comments: Array<{
    id: string;
    message: string;
    isStaff: boolean;
    createdAt: string;
    user: { farmerProfile?: { fullName: string }; role: string };
  }>;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}
