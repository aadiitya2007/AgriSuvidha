import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AgriSuvidha API Documentation',
    version: '1.0.0',
    description:
      'Production REST API for AgriSuvidha Digital Farmer Procurement and Collection Platform (Problem Statement SIH26032).',
  },
  servers: [{ url: '/api/v1', description: 'Version 1 API Endpoint' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register-farmer': {
      post: {
        summary: 'Register new farmer profile with phone and identity data',
        tags: ['Authentication'],
        responses: { 201: { description: 'Farmer registered successfully' } },
      },
    },
    '/auth/request-otp': {
      post: {
        summary: 'Request 6-digit login OTP for mobile number',
        tags: ['Authentication'],
        responses: { 200: { description: 'OTP dispatched via SMS/mock' } },
      },
    },
    '/auth/verify-otp': {
      post: {
        summary: 'Verify OTP and issue JWT access/refresh tokens',
        tags: ['Authentication'],
        responses: { 200: { description: 'Tokens issued' } },
      },
    },
    '/auth/staff-login': {
      post: {
        summary: 'Staff authentication for Operator, Manager, and Admin',
        tags: ['Authentication'],
        responses: { 200: { description: 'Staff logged in' } },
      },
    },
    '/centres': {
      get: {
        summary: 'Discover and search procurement centres with geolocation distance',
        tags: ['Centres'],
        responses: { 200: { description: 'List of matching centres' } },
      },
    },
    '/bookings': {
      post: {
        summary: 'Create slot booking with concurrency lock and QR token generation',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Booking confirmed with signed QR' } },
      },
    },
    '/queue/{centreId}': {
      get: {
        summary: 'Get live queue entries, people ahead, and estimated wait',
        tags: ['Queue'],
        responses: { 200: { description: 'Queue status' } },
      },
    },
    '/queue/{centreId}/stream': {
      get: {
        summary: 'Server-Sent Events (SSE) stream for zero-latency live token updates',
        tags: ['Queue'],
        responses: { 200: { description: 'SSE stream connected' } },
      },
    },
    '/verification/verify': {
      post: {
        summary: 'Redeem HMAC-signed QR token or 6-digit OTP for farmer check-in',
        tags: ['Verification'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Token verified and farmer checked in' } },
      },
    },
    '/procurement': {
      get: {
        summary: 'List procurement inspection records and digital receipts',
        tags: ['Procurement'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Procurement records' } },
      },
    },
    '/payments/disburse': {
      post: {
        summary: 'Disburse payment to farmer via DBT/NEFT with idempotency safeguards',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Payment disbursed' } },
      },
    },
    '/incidents': {
      get: {
        summary: 'List active centre outages, logistics delays, and resolution updates',
        tags: ['Incidents'],
        responses: { 200: { description: 'Incidents list' } },
      },
    },
  },
};

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));

export default router;
