import { PrismaClient, Role, OperationalStatus, BookingStatus, QueueStatus, QualityGrade, ProcurementStatus, PaymentStatus, PaymentMode, TokenType, IncidentType, IncidentSeverity, IncidentStatus, OrderStatus, TicketPriority, TicketStatus, NotificationCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateNumericOtp, hashValue, signQrToken } from '../utils/crypto';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting KrishiSetu database seeding...');

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.ticketComment.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.incidentUpdate.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.procurementLineItem.deleteMany({});
  await prisma.procurementRecord.deleteMany({});
  await prisma.queueEntry.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.slot.deleteMany({});
  await prisma.centreCommodity.deleteMany({});
  await prisma.commodity.deleteMany({});
  await prisma.centreStaffAssignment.deleteMany({});
  await prisma.centre.deleteMany({});
  await prisma.farmerProfile.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const managerPasswordHash = await bcrypt.hash('Manager@12345', 10);
  const operatorPasswordHash = await bcrypt.hash('Operator@12345', 10);

  // 1. Create Staff Users
  const adminUser = await prisma.user.create({
    data: {
      phone: '+91 99000 00001',
      email: 'admin@krishisetu.gov.in',
      passwordHash: defaultPasswordHash,
      role: Role.PLATFORM_ADMIN,
    },
  });

  const managerNagpur = await prisma.user.create({
    data: {
      phone: '+91 99000 00002',
      email: 'manager.nagpur@krishisetu.gov.in',
      passwordHash: managerPasswordHash,
      role: Role.CENTRE_MANAGER,
    },
  });

  const operatorNagpur = await prisma.user.create({
    data: {
      phone: '+91 99000 00003',
      email: 'operator.nagpur@krishisetu.gov.in',
      passwordHash: operatorPasswordHash,
      role: Role.CENTRE_OPERATOR,
    },
  });

  const operatorNashik = await prisma.user.create({
    data: {
      phone: '+91 99000 00004',
      email: 'operator.nashik@krishisetu.gov.in',
      passwordHash: operatorPasswordHash,
      role: Role.CENTRE_OPERATOR,
    },
  });

  // 2. Create Centres
  const nagpurCentre = await prisma.centre.create({
    data: {
      name: 'Nagpur Central APMC Grain Hub',
      code: 'APMC-NGP-01',
      district: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440008',
      address: 'Kalamna Market Yard, Ring Road, Nagpur',
      latitude: 21.1685,
      longitude: 79.1364,
      operatingHours: '08:00 AM - 06:00 PM',
      dailyCapacity: 250,
      operationalStatus: OperationalStatus.OPERATIONAL,
      statusNotice: 'All gates open. Weighbridge 1 & 2 fully operational.',
      phone: '+91 712 258 9011',
      email: 'apmc.nagpur@krishisetu.gov.in',
    },
  });

  const nashikCentre = await prisma.centre.create({
    data: {
      name: 'Nashik Onion & Agri Yard',
      code: 'APMC-NSK-02',
      district: 'Nashik',
      state: 'Maharashtra',
      pincode: '422003',
      address: 'Panchavati Agro Yard, Mumbai-Agra Highway, Nashik',
      latitude: 19.9975,
      longitude: 73.7898,
      operatingHours: '08:30 AM - 05:30 PM',
      dailyCapacity: 200,
      operationalStatus: OperationalStatus.LIMITED_SERVICE,
      statusNotice: 'Weighbridge Sensor Calibration in progress. Gate 3 operating with 50% capacity.',
      phone: '+91 253 251 4099',
      email: 'apmc.nashik@krishisetu.gov.in',
    },
  });

  const amravatiCentre = await prisma.centre.create({
    data: {
      name: 'Amravati Cotton & Soybean Terminal',
      code: 'APMC-AMR-03',
      district: 'Amravati',
      state: 'Maharashtra',
      pincode: '444601',
      address: 'Badnera Road, APMC Yard, Amravati',
      latitude: 20.9374,
      longitude: 77.7796,
      operatingHours: '09:00 AM - 05:00 PM',
      dailyCapacity: 180,
      operationalStatus: OperationalStatus.LOGISTICS_DELAYED,
      statusNotice: 'Freight logistics backlog on NH53. Offloading turnaround extended by 45 mins.',
      phone: '+91 721 267 1120',
      email: 'apmc.amravati@krishisetu.gov.in',
    },
  });

  const puneCentre = await prisma.centre.create({
    data: {
      name: 'Pune District Kisan Procurement Centre',
      code: 'APMC-PUN-04',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411037',
      address: 'Market Yard, Gultekdi, Pune',
      latitude: 18.4892,
      longitude: 73.8643,
      operatingHours: '08:00 AM - 06:00 PM',
      dailyCapacity: 300,
      operationalStatus: OperationalStatus.OPERATIONAL,
      statusNotice: 'Full operations. Express lane active for bookings under 30 quintals.',
      phone: '+91 20 2426 8000',
      email: 'apmc.pune@krishisetu.gov.in',
    },
  });

  // Assign staff to centres
  await prisma.centreStaffAssignment.createMany({
    data: [
      { centreId: nagpurCentre.id, userId: managerNagpur.id, role: Role.CENTRE_MANAGER },
      { centreId: nagpurCentre.id, userId: operatorNagpur.id, role: Role.CENTRE_OPERATOR },
      { centreId: nashikCentre.id, userId: operatorNashik.id, role: Role.CENTRE_OPERATOR },
    ],
  });

  // 3. Create Commodities
  const commoditiesData = [
    {
      name: 'Wheat (Sharbati / Lokwan)',
      code: 'WHT-01',
      category: 'Food Grains',
      minMspPrice: 2275.0,
      unit: 'Quintal',
      qualityGradingSpecs: 'Grade A: Moisture <= 12%, Foreign <= 0.75%. Grade B: Moisture <= 14%.',
    },
    {
      name: 'Soybean (Yellow)',
      code: 'SOY-02',
      category: 'Oilseeds',
      minMspPrice: 4892.0,
      unit: 'Quintal',
      qualityGradingSpecs: 'Grade A: Moisture <= 10%, Foreign <= 1.0%. Grade B: Moisture <= 12%.',
    },
    {
      name: 'Cotton (Medium Staple)',
      code: 'COT-03',
      category: 'Fibre Crops',
      minMspPrice: 7121.0,
      unit: 'Quintal',
      qualityGradingSpecs: 'Grade A: Moisture <= 8%, Trash <= 2.0%. Grade B: Moisture <= 10%.',
    },
    {
      name: 'Paddy (Common)',
      code: 'PDY-04',
      category: 'Food Grains',
      minMspPrice: 2300.0,
      unit: 'Quintal',
      qualityGradingSpecs: 'Grade A: Moisture <= 14%, Discoloured <= 1.5%. Grade B: Moisture <= 17%.',
    },
    {
      name: 'Maize (Kharif)',
      code: 'MAZ-05',
      category: 'Coarse Cereals',
      minMspPrice: 2225.0,
      unit: 'Quintal',
      qualityGradingSpecs: 'Grade A: Moisture <= 13%, Damaged <= 2.0%.',
    },
    {
      name: 'Onion (Rabi / Kharif)',
      code: 'ONN-06',
      category: 'Vegetables',
      minMspPrice: 1850.0,
      unit: 'Quintal',
      qualityGradingSpecs: 'Grade A: Size >= 45mm, Dry skin, No sprouting. Grade B: 35-45mm.',
    },
  ];

  const createdCommodities: Record<string, any> = {};
  for (const c of commoditiesData) {
    createdCommodities[c.code] = await prisma.commodity.create({ data: c });
  }

  // Link Commodities to Centres
  for (const centre of [nagpurCentre, nashikCentre, amravatiCentre, puneCentre]) {
    for (const c of Object.values(createdCommodities)) {
      await prisma.centreCommodity.create({
        data: {
          centreId: centre.id,
          commodityId: c.id,
          isAccepted: true,
          dailyQuota: 800,
        },
      });
    }
  }

  // 4. Create 14 Farmers
  const farmersRaw = [
    { name: 'Rameshwar Patil', phone: '+91 98230 11001', village: 'Saoner', district: 'Nagpur', state: 'Maharashtra', pincode: '441107', acres: 6.5, reg: 'MH-NGP-2024-001', crop: 'WHT-01' },
    { name: 'Suresh Deshmukh', phone: '+91 98230 11002', village: 'Katol', district: 'Nagpur', state: 'Maharashtra', pincode: '441302', acres: 8.0, reg: 'MH-NGP-2024-002', crop: 'SOY-02' },
    { name: 'Sunita Tai Shinde', phone: '+91 98230 11003', village: 'Niphad', district: 'Nashik', state: 'Maharashtra', pincode: '422303', acres: 4.2, reg: 'MH-NSK-2024-003', crop: 'ONN-06' },
    { name: 'Tukaram Kale', phone: '+91 98230 11004', village: 'Dindori', district: 'Nashik', state: 'Maharashtra', pincode: '422202', acres: 5.0, reg: 'MH-NSK-2024-004', crop: 'ONN-06' },
    { name: 'Ganesh Bhau Wankhede', phone: '+91 98230 11005', village: 'Achalpur', district: 'Amravati', state: 'Maharashtra', pincode: '444806', acres: 10.5, reg: 'MH-AMR-2024-005', crop: 'COT-03' },
    { name: 'Kisanrao Jadhav', phone: '+91 98230 11006', village: 'Chandur Bazar', district: 'Amravati', state: 'Maharashtra', pincode: '444704', acres: 7.2, reg: 'MH-AMR-2024-006', crop: 'SOY-02' },
    { name: 'Anandrao Gaikwad', phone: '+91 98230 11007', village: 'Baramati', district: 'Pune', state: 'Maharashtra', pincode: '413102', acres: 9.0, reg: 'MH-PUN-2024-007', crop: 'WHT-01' },
    { name: 'Pooja Deepak More', phone: '+91 98230 11008', village: 'Shirur', district: 'Pune', state: 'Maharashtra', pincode: '412210', acres: 3.5, reg: 'MH-PUN-2024-008', crop: 'MAZ-05' },
    { name: 'Balasaheb Shinde', phone: '+91 98230 11009', village: 'Hingna', district: 'Nagpur', state: 'Maharashtra', pincode: '441110', acres: 5.8, reg: 'MH-NGP-2024-009', crop: 'WHT-01' },
    { name: 'Vithalrao Joshi', phone: '+91 98230 11010', village: 'Umred', district: 'Nagpur', state: 'Maharashtra', pincode: '441203', acres: 12.0, reg: 'MH-NGP-2024-010', crop: 'PDY-04' },
    { name: 'Radhabai Thombre', phone: '+91 98230 11011', village: 'Yeola', district: 'Nashik', state: 'Maharashtra', pincode: '423401', acres: 4.0, reg: 'MH-NSK-2024-011', crop: 'ONN-06' },
    { name: 'Dilip Mahale', phone: '+91 98230 11012', village: 'Morshi', district: 'Amravati', state: 'Maharashtra', pincode: '444905', acres: 6.0, reg: 'MH-AMR-2024-012', crop: 'COT-03' },
    { name: 'Santosh Chavan', phone: '+91 98230 11013', village: 'Indapur', district: 'Pune', state: 'Maharashtra', pincode: '413106', acres: 7.5, reg: 'MH-PUN-2024-013', crop: 'MAZ-05' },
    { name: 'Babanrao Kadam', phone: '+91 98230 11014', village: 'Bhiwapur', district: 'Nagpur', state: 'Maharashtra', pincode: '441201', acres: 8.5, reg: 'MH-NGP-2024-014', crop: 'SOY-02' },
  ];

  const createdFarmers: any[] = [];
  for (const f of farmersRaw) {
    const user = await prisma.user.create({
      data: {
        phone: f.phone,
        email: `${f.name.toLowerCase().replace(/[^a-z]/g, '')}@kisanmail.in`,
        role: Role.FARMER,
        farmerProfile: {
          create: {
            fullName: f.name,
            village: f.village,
            district: f.district,
            state: f.state,
            pincode: f.pincode,
            farmSizeAcres: f.acres,
            preferredLanguage: 'hi',
            farmerRegistrationNumber: f.reg,
            bankAccountNumber: `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`,
            bankIfsc: 'SBIN0004512',
            consentCommunications: true,
          },
        },
        notificationPref: {
          create: {
            inAppEnabled: true,
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
      },
      include: { farmerProfile: true },
    });
    createdFarmers.push({ ...user, primaryCrop: f.crop });
  }

  // 5. Create Time Slots (Today and Tomorrow)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const slotTimes = [
    { start: '08:30 AM', end: '10:00 AM' },
    { start: '10:00 AM', end: '11:30 AM' },
    { start: '11:30 AM', end: '01:00 PM' },
    { start: '01:30 PM', end: '03:00 PM' },
    { start: '03:00 PM', end: '04:30 PM' },
  ];

  const createdSlots: any[] = [];
  for (const centre of [nagpurCentre, nashikCentre, amravatiCentre, puneCentre]) {
    for (const commodity of Object.values(createdCommodities)) {
      for (const dateStr of [todayStr, tomorrowStr]) {
        for (const t of slotTimes) {
          const slot = await prisma.slot.create({
            data: {
              centreId: centre.id,
              commodityId: commodity.id,
              slotDate: dateStr,
              startTime: t.start,
              endTime: t.end,
              maxCapacity: 15,
              bookedCapacity: 0,
            },
          });
          createdSlots.push(slot);
        }
      }
    }
  }

  // 6. Create Realistic Bookings, Queues, Procurements & Payments
  // Farmer 1 (Rameshwar Patil) - Currently at Nagpur APMC in Live Queue!
  const farmer1 = createdFarmers[0];
  const slot1 = createdSlots.find(
    (s) => s.centreId === nagpurCentre.id && s.commodityId === createdCommodities['WHT-01'].id && s.slotDate === todayStr && s.startTime === '08:30 AM'
  ) || createdSlots[0];

  const booking1 = await prisma.booking.create({
    data: {
      bookingReference: 'KS-2026-NGP-001',
      farmerId: farmer1.id,
      slotId: slot1.id,
      centreId: nagpurCentre.id,
      commodityId: createdCommodities['WHT-01'].id,
      estimatedQuantity: 45.0,
      status: BookingStatus.CHECKED_IN,
    },
  });

  // Create Queue Entry for Farmer 1
  await prisma.queueEntry.create({
    data: {
      centreId: nagpurCentre.id,
      bookingId: booking1.id,
      farmerId: farmer1.id,
      tokenNumber: 4,
      tokenDisplay: 'NGP-W-004',
      status: QueueStatus.IN_INSPECTION,
      peopleAhead: 0,
      estimatedWaitMinutes: 0,
      calledAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  });

  // Create Signed QR Token and OTP for Farmer 1
  const rawOtp1 = '482910';
  const qrPayload1 = {
    bookingId: booking1.id,
    farmerId: farmer1.id,
    centreId: nagpurCentre.id,
    nonce: 'n1-ngp-001',
    expiresAt: Date.now() + 3600 * 1000,
  };
  const signedQr1 = signQrToken(qrPayload1);

  await prisma.verificationToken.create({
    data: {
      tokenType: TokenType.COLLECTION_OTP,
      codeHash: hashValue(rawOtp1),
      displayCode: rawOtp1,
      bookingId: booking1.id,
      farmerId: farmer1.id,
      centreId: nagpurCentre.id,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      isUsed: true,
      usedAt: new Date(),
      usedByUserId: operatorNagpur.id,
    },
  });

  // Farmer 2 (Suresh Deshmukh) - Waiting in Queue behind Farmer 1
  const farmer2 = createdFarmers[1];
  const booking2 = await prisma.booking.create({
    data: {
      bookingReference: 'KS-2026-NGP-002',
      farmerId: farmer2.id,
      slotId: slot1.id,
      centreId: nagpurCentre.id,
      commodityId: createdCommodities['SOY-02'].id,
      estimatedQuantity: 60.0,
      status: BookingStatus.CHECKED_IN,
    },
  });

  await prisma.queueEntry.create({
    data: {
      centreId: nagpurCentre.id,
      bookingId: booking2.id,
      farmerId: farmer2.id,
      tokenNumber: 5,
      tokenDisplay: 'NGP-S-005',
      status: QueueStatus.WAITING,
      peopleAhead: 1,
      estimatedWaitMinutes: 12,
    },
  });

  const rawOtp2 = '739201';
  await prisma.verificationToken.create({
    data: {
      tokenType: TokenType.COLLECTION_OTP,
      codeHash: hashValue(rawOtp2),
      displayCode: rawOtp2,
      bookingId: booking2.id,
      farmerId: farmer2.id,
      centreId: nagpurCentre.id,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      isUsed: false,
    },
  });

  // Farmer 9 & 10 waiting in Nagpur queue
  const farmer9 = createdFarmers[8];
  const booking9 = await prisma.booking.create({
    data: {
      bookingReference: 'KS-2026-NGP-003',
      farmerId: farmer9.id,
      slotId: slot1.id,
      centreId: nagpurCentre.id,
      commodityId: createdCommodities['WHT-01'].id,
      estimatedQuantity: 30.0,
      status: BookingStatus.CHECKED_IN,
    },
  });
  await prisma.queueEntry.create({
    data: {
      centreId: nagpurCentre.id,
      bookingId: booking9.id,
      farmerId: farmer9.id,
      tokenNumber: 6,
      tokenDisplay: 'NGP-W-006',
      status: QueueStatus.WAITING,
      peopleAhead: 2,
      estimatedWaitMinutes: 24,
    },
  });

  // Farmer 3 (Sunita Tai Shinde) - Completed Procurement & Paid
  const farmer3 = createdFarmers[2];
  const slotNashik = createdSlots.find((s) => s.centreId === nashikCentre.id) || createdSlots[1];
  const booking3 = await prisma.booking.create({
    data: {
      bookingReference: 'KS-2026-NSK-001',
      farmerId: farmer3.id,
      slotId: slotNashik.id,
      centreId: nashikCentre.id,
      commodityId: createdCommodities['ONN-06'].id,
      estimatedQuantity: 50.0,
      status: BookingStatus.COMPLETED,
    },
  });

  const procurement3 = await prisma.procurementRecord.create({
    data: {
      bookingId: booking3.id,
      centreId: nashikCentre.id,
      farmerId: farmer3.id,
      commodityId: createdCommodities['ONN-06'].id,
      operatorId: operatorNashik.id,
      managerId: managerNagpur.id,
      receiptNumber: 'REC-2026-NSK-8841',
      submittedWeight: 52.5,
      acceptedWeight: 51.0,
      rejectedWeight: 1.5,
      unit: 'Quintal',
      qualityGrade: QualityGrade.GRADE_A,
      moistureContent: 11.2,
      foreignMatterPercent: 0.8,
      ratePerUnit: 1850.0,
      grossPayable: 94350.0,
      deductions: 500.0,
      netPayable: 93850.0,
      deductionReason: 'Minor sorting & packaging tare weight variance',
      status: ProcurementStatus.PAID,
      inspectionNotes: 'Clean, mature red onions. Moisture optimal.',
    },
  });

  // Line items
  await prisma.procurementLineItem.createMany({
    data: [
      { procurementRecordId: procurement3.id, bagBatchNumber: 'BATCH-NSK-A1', bagCount: 50, grossWeightKg: 2600.0, tareWeightKg: 50.0, netWeightKg: 2550.0, sampleQualityGrade: QualityGrade.GRADE_A },
      { procurementRecordId: procurement3.id, bagBatchNumber: 'BATCH-NSK-A2', bagCount: 50, grossWeightKg: 2600.0, tareWeightKg: 50.0, netWeightKg: 2550.0, sampleQualityGrade: QualityGrade.GRADE_A },
    ],
  });

  // Payment for Farmer 3
  await prisma.payment.create({
    data: {
      procurementId: procurement3.id,
      farmerId: farmer3.id,
      centreId: nashikCentre.id,
      amount: 93850.0,
      paymentMode: PaymentMode.DIRECT_BENEFIT_TRANSFER,
      transactionReference: 'DBT-MH-2026-9812401',
      status: PaymentStatus.SUCCESS,
      paidAt: new Date(Date.now() - 2 * 3600 * 1000),
      idempotencyKey: 'idemp-pay-nsk-001',
    },
  });

  // Farmer 5 (Ganesh Bhau Wankhede) - Cotton at Amravati, Under Approval / Payment Initiated
  const farmer5 = createdFarmers[4];
  const slotAmravati = createdSlots.find((s) => s.centreId === amravatiCentre.id) || createdSlots[2];
  const booking5 = await prisma.booking.create({
    data: {
      bookingReference: 'KS-2026-AMR-001',
      farmerId: farmer5.id,
      slotId: slotAmravati.id,
      centreId: amravatiCentre.id,
      commodityId: createdCommodities['COT-03'].id,
      estimatedQuantity: 40.0,
      status: BookingStatus.COMPLETED,
    },
  });

  const procurement5 = await prisma.procurementRecord.create({
    data: {
      bookingId: booking5.id,
      centreId: amravatiCentre.id,
      farmerId: farmer5.id,
      commodityId: createdCommodities['COT-03'].id,
      receiptNumber: 'REC-2026-AMR-4421',
      submittedWeight: 42.0,
      acceptedWeight: 41.5,
      rejectedWeight: 0.5,
      unit: 'Quintal',
      qualityGrade: QualityGrade.GRADE_A,
      moistureContent: 7.8,
      foreignMatterPercent: 1.2,
      ratePerUnit: 7121.0,
      grossPayable: 295521.5,
      deductions: 1200.0,
      netPayable: 294321.5,
      deductionReason: 'Standard moisture drying compensation',
      status: ProcurementStatus.PAYMENT_INITIATED,
      inspectionNotes: 'Good staple length. Moisture well within 8% standard.',
    },
  });

  await prisma.payment.create({
    data: {
      procurementId: procurement5.id,
      farmerId: farmer5.id,
      centreId: amravatiCentre.id,
      amount: 294321.5,
      paymentMode: PaymentMode.BANK_TRANSFER_NEFT,
      transactionReference: 'NEFT-RBIS-2026-339102',
      status: PaymentStatus.INITIATED,
    },
  });

  // Confirmed upcoming bookings for other farmers
  for (let i = 5; i < 12; i++) {
    const f = createdFarmers[i];
    const s = createdSlots[(i * 3) % createdSlots.length];
    await prisma.booking.create({
      data: {
        bookingReference: `KS-2026-BK-${100 + i}`,
        farmerId: f.id,
        slotId: s.id,
        centreId: s.centreId,
        commodityId: s.commodityId,
        estimatedQuantity: 25.0 + (i % 5) * 5,
        status: BookingStatus.CONFIRMED,
      },
    });
  }

  // 7. Create Incidents (One server outage & one logistics delay)
  const incidentNashik = await prisma.incident.create({
    data: {
      centreId: nashikCentre.id,
      title: 'Weighbridge Sensor Calibration & Local Network Outage',
      incidentType: IncidentType.SERVER_OUTAGE,
      severity: IncidentSeverity.HIGH,
      impactStatement: 'Electronic weighbridge scale 2 connection dropped. Gate 3 slot intake operating at 50% throughput.',
      status: IncidentStatus.ACTIVE,
      affectedBookingsCount: 18,
      expectedRecoveryTime: new Date(Date.now() + 4 * 3600 * 1000),
      pauseBookings: true,
      reportedByUserId: operatorNashik.id,
      updates: {
        create: [
          {
            userId: operatorNashik.id,
            message: 'National Informatics Centre technician on-site replacing fiber optic switch and load-cell sensor unit.',
          },
          {
            userId: managerNagpur.id,
            message: 'SMS & in-app alerts sent to all 18 affected farmers with priority fast-track reschedule options.',
          },
        ],
      },
    },
  });

  const incidentAmravati = await prisma.incident.create({
    data: {
      centreId: amravatiCentre.id,
      title: 'Highway NH53 Freight Transit Congestion & Offloading Delay',
      incidentType: IncidentType.LOGISTICS_DELAY,
      severity: IncidentSeverity.MEDIUM,
      impactStatement: 'Heavy vehicle diversion on NH53 causing 45-minute turnaround delay for incoming tractors and trucks.',
      status: IncidentStatus.INVESTIGATING,
      affectedBookingsCount: 12,
      expectedRecoveryTime: new Date(Date.now() + 2 * 3600 * 1000),
      pauseBookings: false,
      reportedByUserId: managerNagpur.id,
      updates: {
        create: [
          {
            userId: managerNagpur.id,
            message: 'Traffic police clearance in progress. Additional holding yard opened at gate 4.',
          },
        ],
      },
    },
  });

  // 8. Create Targeted Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: farmer1.id,
        title: 'Your Token NGP-W-004 is Now Called!',
        body: 'Please proceed immediately to Weighbridge Gate 2 with your tractor/truck.',
        category: NotificationCategory.QUEUE,
        isRead: false,
      },
      {
        userId: farmer2.id,
        title: 'Queue Alert: Only 1 Farmer Ahead',
        body: 'Your estimated wait time is 12 mins at Nagpur Central APMC. Please keep your QR code ready.',
        category: NotificationCategory.QUEUE,
        isRead: false,
      },
      {
        userId: farmer3.id,
        title: 'Payment Credited: ₹93,850 via DBT',
        body: 'Your procurement payment for Onion has been successfully credited. Ref: DBT-MH-2026-9812401.',
        category: NotificationCategory.PAYMENT,
        isRead: true,
      },
      {
        userId: farmer5.id,
        title: 'Quality Graded: Grade A Certified',
        body: 'Your 41.5 Quintals of Cotton has been graded Grade A. Net payable ₹2,94,321.50 initiated.',
        category: NotificationCategory.PROCUREMENT,
        isRead: false,
      },
      {
        userId: farmer3.id,
        title: 'Alert: Service Delay at Nashik Centre',
        body: 'Weighbridge maintenance is underway. You can reschedule your slot without penalty.',
        category: NotificationCategory.INCIDENT,
        isRead: false,
      },
    ],
  });

  // 9. Marketplace Products & Categories
  const catSeeds = await prisma.productCategory.create({
    data: { name: 'Certified Hybrid Seeds', slug: 'seeds', description: 'ICAR and NSC certified high-yield seed varieties' },
  });
  const catFertilizers = await prisma.productCategory.create({
    data: { name: 'Bio-Fertilizers & Nutrients', slug: 'fertilizers', description: 'Govt subsidized organic and bio-fertilizers' },
  });
  const catPackaging = await prisma.productCategory.create({
    data: { name: 'Storage & Packaging', slug: 'packaging', description: 'Standard 50kg jute bags, tarpaulins, and moisture meters' },
  });
  const catTools = await prisma.productCategory.create({
    data: { name: 'Agri Equipment & Sprayers', slug: 'tools', description: 'Battery sprayers, soil testing kits, and protective gear' },
  });

  const productsData = [
    { categoryId: catSeeds.id, name: 'Certified Wheat Seeds (DBW-187 Karan Vandana)', description: 'High-protein, rust-resistant wheat seed variety certified by NSC.', price: 1250.0, unit: '40kg Bag', stockQuantity: 150 },
    { categoryId: catSeeds.id, name: 'Soybean Seeds (JS-335 Certified)', description: 'High-oil content certified soybean seeds with 98% germination rate.', price: 2100.0, unit: '30kg Bag', stockQuantity: 120 },
    { categoryId: catFertilizers.id, name: 'Nano Urea Liquid (IFFCO Subsidized)', description: '500ml bottle replaces one 45kg urea bag, improves nitrogen use efficiency.', price: 225.0, unit: '500ml Bottle', stockQuantity: 300 },
    { categoryId: catFertilizers.id, name: 'Bio-DAP & Potash Organic Granules', description: 'Enriched organic DAP granule formulated for soil health revitalization.', price: 850.0, unit: '50kg Bag', stockQuantity: 200 },
    { categoryId: catPackaging.id, name: 'Grade-A Standard Jute Gunny Bags (50kg)', description: 'ISI marked 50kg capacity breathable jute packaging bags.', price: 45.0, unit: 'Pack of 5', stockQuantity: 500 },
    { categoryId: catTools.id, name: '16-Litre Solar Knapsack Battery Sprayer', description: 'Dual battery and solar panel operated pesticide sprayer with brass nozzle.', price: 2450.0, unit: 'Unit', stockQuantity: 40 },
    { categoryId: catTools.id, name: 'Digital Grain Moisture Meter', description: 'Calibrated for wheat, soybean, maize, and paddy with instant LCD readout.', price: 1850.0, unit: 'Unit', stockQuantity: 25 },
  ];

  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    // Inventory at centres
    await prisma.inventoryItem.create({
      data: {
        centreId: nagpurCentre.id,
        productId: prod.id,
        stockQuantity: Math.floor(p.stockQuantity / 2),
        reorderLevel: 15,
      },
    });
  }

  // Sample Order for Farmer 1
  const allProds = await prisma.product.findMany();
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-9811',
      farmerId: farmer1.id,
      centreId: nagpurCentre.id,
      totalAmount: 2500.0,
      status: OrderStatus.READY_FOR_PICKUP,
      pickupOtp: '812490',
      pickupQr: 'QR-ORD-9811',
      items: {
        create: [
          { productId: allProds[0].id, quantity: 2, unitPrice: allProds[0].price, totalPrice: allProds[0].price * 2 },
        ],
      },
    },
  });

  // 10. Support Tickets and Comments
  const ticket1 = await prisma.supportTicket.create({
    data: {
      ticketNumber: 'TCK-2026-0042',
      userId: farmer2.id,
      centreId: nagpurCentre.id,
      category: 'Slot Reschedule Request',
      priority: TicketPriority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      subject: 'Tractor tyre puncture on highway, request afternoon slot shift',
      description: 'My trolley had a breakdown near Saoner toll plaza. I need my 10:00 AM slot shifted to 01:30 PM today.',
      comments: {
        create: [
          { userId: farmer2.id, message: 'Attaching mechanic repair slip. Can the centre operator accommodate me in afternoon batch?', isStaff: false },
          { userId: operatorNagpur.id, message: 'Request approved. Slot buffer adjusted for 01:30 PM. Token queue priority reserved.', isStaff: true },
        ],
      },
    },
  });

  const ticket2 = await prisma.supportTicket.create({
    data: {
      ticketNumber: 'TCK-2026-0039',
      userId: farmer3.id,
      centreId: nashikCentre.id,
      category: 'Quality Grade Inquiry',
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.RESOLVED,
      subject: 'Clarification regarding tare weight deduction on onion batch',
      description: 'Wanted verification on the ₹500 bag deduction on receipt REC-2026-NSK-8841.',
      comments: {
        create: [
          { userId: farmer3.id, message: 'Can you please provide the weight slip breakdown for the 50kg bags?', isStaff: false },
          { userId: managerNagpur.id, message: 'Resolution provided: Attached electronic weighbridge calibration slip. ₹500 represents tare weight of 100 jute bags @ 500g each as per standard APMC mandate.', isStaff: true },
        ],
      },
    },
  });

  // 11. Feedbacks
  await prisma.feedback.createMany({
    data: [
      {
        userId: farmer3.id,
        centreId: nashikCentre.id,
        bookingId: booking3.id,
        rating: 5,
        category: 'Fair Procurement & Payment',
        comments: 'Prompt grading and instant DBT credit to my bank account. Very transparent digital process!',
        aspectScores: JSON.stringify({ queue: 4, staff: 5, transparency: 5, facilities: 4 }),
      },
      {
        userId: farmer1.id,
        centreId: nagpurCentre.id,
        bookingId: booking1.id,
        rating: 4,
        category: 'Queue Management',
        comments: 'Live token board on mobile helped me wait under the shade instead of standing in sun.',
        aspectScores: JSON.stringify({ queue: 5, staff: 4, transparency: 4, facilities: 4 }),
      },
    ],
  });

  // 12. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        userRole: 'PLATFORM_ADMIN',
        action: 'SYSTEM_BOOTSTRAP',
        resourceType: 'PLATFORM',
        metadata: JSON.stringify({ version: '1.0.0', centresCount: 4, commoditiesCount: 6 }),
      },
      {
        userId: operatorNagpur.id,
        userRole: 'CENTRE_OPERATOR',
        action: 'QR_CHECK_IN',
        resourceType: 'BOOKING',
        resourceId: booking1.id,
        metadata: JSON.stringify({ tokenNumber: 4, farmer: farmer1.farmerProfile?.fullName }),
      },
      {
        userId: managerNagpur.id,
        userRole: 'CENTRE_MANAGER',
        action: 'PAYMENT_DISBURSED',
        resourceType: 'PAYMENT',
        resourceId: procurement3.id,
        metadata: JSON.stringify({ amount: 93850.0, mode: 'DBT' }),
      },
    ],
  });

  logger.info('KrishiSetu seed data successfully populated in PostgreSQL!');
}

main()
  .catch((e) => {
    logger.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
