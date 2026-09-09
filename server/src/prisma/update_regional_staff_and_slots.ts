import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Provisioning Regional Operators, Managers, and Slots ---');

  const operatorHash = await bcrypt.hash('Operator@12345', 10);
  const managerHash = await bcrypt.hash('Manager@12345', 10);

  // 1. Fetch Centres
  const centres = await prisma.centre.findMany();
  const nagpur = centres.find((c) => c.code === 'APMC-NGP-01') || centres[0];
  const nashik = centres.find((c) => c.code === 'APMC-NSK-02');
  const amravati = centres.find((c) => c.code === 'APMC-AMR-03');
  const pune = centres.find((c) => c.code === 'APMC-PUN-04');

  const centreMap: Record<string, any> = {
    nagpur,
    nashik,
    amravati,
    pune,
  };

  // 2. Provision Staff for all regions
  const staffConfigs = [
    { email: 'operator.nagpur@agrisuvidha.gov.in', phone: '+91 99000 00003', role: Role.CENTRE_OPERATOR, centre: nagpur, pass: operatorHash },
    { email: 'manager.nagpur@agrisuvidha.gov.in', phone: '+91 99000 00002', role: Role.CENTRE_MANAGER, centre: nagpur, pass: managerHash },
    { email: 'operator.nashik@agrisuvidha.gov.in', phone: '+91 99000 00004', role: Role.CENTRE_OPERATOR, centre: nashik, pass: operatorHash },
    { email: 'manager.nashik@agrisuvidha.gov.in', phone: '+91 99000 00012', role: Role.CENTRE_MANAGER, centre: nashik, pass: managerHash },
    { email: 'operator.amravati@agrisuvidha.gov.in', phone: '+91 99000 00005', role: Role.CENTRE_OPERATOR, centre: amravati, pass: operatorHash },
    { email: 'manager.amravati@agrisuvidha.gov.in', phone: '+91 99000 00013', role: Role.CENTRE_MANAGER, centre: amravati, pass: managerHash },
    { email: 'operator.pune@agrisuvidha.gov.in', phone: '+91 99000 00006', role: Role.CENTRE_OPERATOR, centre: pune, pass: operatorHash },
    { email: 'manager.pune@agrisuvidha.gov.in', phone: '+91 99000 00014', role: Role.CENTRE_MANAGER, centre: pune, pass: managerHash },
  ];

  for (const s of staffConfigs) {
    if (!s.centre) continue;
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        role: s.role,
        passwordHash: s.pass,
        phone: s.phone,
      },
      create: {
        email: s.email,
        phone: s.phone,
        passwordHash: s.pass,
        role: s.role,
      },
    });

    // Assign to their specific primary centre
    await prisma.centreStaffAssignment.upsert({
      where: {
        centreId_userId: {
          centreId: s.centre.id,
          userId: user.id,
        },
      },
      update: { role: s.role },
      create: {
        centreId: s.centre.id,
        userId: user.id,
        role: s.role,
      },
    });

    // Also assign to all other centres for seamless cross-region operations/testing
    for (const c of centres) {
      if (c.id === s.centre.id) continue;
      await prisma.centreStaffAssignment.upsert({
        where: {
          centreId_userId: {
            centreId: c.id,
            userId: user.id,
          },
        },
        update: { role: s.role },
        create: {
          centreId: c.id,
          userId: user.id,
          role: s.role,
        },
      });
    }

    console.log(`✓ Provisioned ${s.role} for ${s.centre.name}: ${s.email}`);
  }

  // 3. Provision Slots for the next 14 days for ALL centres and ALL commodities
  const commodities = await prisma.commodity.findMany();
  const slotTimes = [
    { start: '08:30 AM', end: '10:00 AM' },
    { start: '10:00 AM', end: '11:30 AM' },
    { start: '11:30 AM', end: '01:00 PM' },
    { start: '01:30 PM', end: '03:00 PM' },
    { start: '03:00 PM', end: '04:30 PM' },
  ];

  let slotsCreatedCount = 0;
  const today = new Date();

  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    const dateStr = d.toISOString().split('T')[0];

    for (const centre of centres) {
      for (const commodity of commodities) {
        for (const t of slotTimes) {
          try {
            await prisma.slot.upsert({
              where: {
                centreId_commodityId_slotDate_startTime: {
                  centreId: centre.id,
                  commodityId: commodity.id,
                  slotDate: dateStr,
                  startTime: t.start,
                },
              },
              update: {},
              create: {
                centreId: centre.id,
                commodityId: commodity.id,
                slotDate: dateStr,
                startTime: t.start,
                endTime: t.end,
                maxCapacity: 15,
                bookedCapacity: 0,
              },
            });
            slotsCreatedCount++;
          } catch (e) {
            // ignore
          }
        }
      }
    }
  }

  console.log(`✓ Verified and ensured slots for next 14 days across ${centres.length} centres and ${commodities.length} commodities. Total checked/created: ${slotsCreatedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
