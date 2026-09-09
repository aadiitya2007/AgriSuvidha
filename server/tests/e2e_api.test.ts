import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { ensurePostgresRunning } from '../src/prisma/dbManager';
import { connectDatabase } from '../src/prisma/client';

describe('AgriSuvidha End-to-End API Integration Tests', () => {
  beforeAll(async () => {
    await ensurePostgresRunning();
    await connectDatabase();
  }, 20000);
  it('GET /health should return 200 UP status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('AgriSuvidha API');
  });

  it('GET /ready should confirm database is connected', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
    expect(res.body.database).toBe('CONNECTED');
  });

  it('GET /api/v1/centres should list procurement centres with active status and queue load', async () => {
    const res = await request(app).get('/api/v1/centres');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);

    const nagpur = res.body.data.find((c: any) => c.code === 'APMC-NGP-01');
    expect(nagpur).toBeDefined();
    expect(nagpur.operationalStatus).toBe('OPERATIONAL');
    expect(nagpur.commodities.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/auth/request-otp and verify-otp flow for Farmer', async () => {
    const reqRes = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+91 98230 11001' });

    expect(reqRes.status).toBe(200);
    expect(reqRes.body.success).toBe(true);
    expect(reqRes.body.data.phone).toBe('+91 98230 11001');

    // Verify OTP using DEMO_OTP '123456'
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+91 98230 11001', otp: '123456' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.tokens.accessToken).toBeDefined();
    expect(verifyRes.body.data.user.role).toBe('FARMER');
  });

  it('POST /api/v1/auth/register-farmer creates a new farmer account and returns tokens', async () => {
    const randomPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;
    const regRes = await request(app)
      .post('/api/v1/auth/register-farmer')
      .send({
        fullName: 'Aditya Agarwal',
        phone: randomPhone,
        email: `farmer_${Date.now()}@gmail.com`,
        village: 'Katol',
        district: 'Nagpur',
        state: 'Maharashtra',
        pincode: '440008',
        farmSizeAcres: 5.0,
        preferredLanguage: 'hi',
        bankAccountNumber: '9801234567',
        bankIfsc: 'SBIN0001234',
        consentCommunications: true,
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.tokens.accessToken).toBeDefined();
    expect(regRes.body.data.tokens.refreshToken).toBeDefined();
    expect(regRes.body.data.user.role).toBe('FARMER');
    expect(regRes.body.data.user.profile.fullName).toBe('Aditya Agarwal');
  });

  it('POST /api/v1/auth/register-farmer rejects invalid phone (< 10 digits) with descriptive error', async () => {
    const failRes = await request(app)
      .post('/api/v1/auth/register-farmer')
      .send({
        fullName: 'Aditya Agarwal',
        phone: '987654321', // 9 digits
        village: 'Katol',
        district: 'Nagpur',
        state: 'Maharashtra',
        pincode: '440008',
        farmSizeAcres: 5.0,
      });

    expect(failRes.status).toBe(400);
    expect(failRes.body.success).toBe(false);
    expect(failRes.body.error.message).toContain('Valid 10-digit mobile number is required');
  });

  it('POST /api/v1/auth/staff-login for Operator', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff-login')
      .send({
        email: 'operator.nagpur@agrisuvidha.gov.in',
        password: 'Operator@12345',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('CENTRE_OPERATOR');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.assignedCentres.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/queue/:centreId should return live queue tokens and wait times', async () => {
    const centresRes = await request(app).get('/api/v1/centres');
    const nagpurId = centresRes.body.data.find((c: any) => c.code === 'APMC-NGP-01').id;

    const res = await request(app).get(`/api/v1/queue/${nagpurId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.entries)).toBe(true);
    expect(res.body.data.centreId).toBe(nagpurId);
  });

  it('GET /api/v1/products and categories should return marketplace items', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const catRes = await request(app).get('/api/v1/products/categories');
    expect(catRes.status).toBe(200);
    expect(catRes.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/incidents should list active centre outages and logistics notices', async () => {
    const res = await request(app).get('/api/v1/incidents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});
