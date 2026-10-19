import { test, describe } from 'node:test'
import assert from 'node:assert'
import {
  verifySlipWithThunder,
  ThunderApiResponse,
} from '../thunder-slip.service.js'

describe('Thunder Slip Verification Service Tests', () => {
  const dummySlipUrl = 'https://supabase.co/storage/v1/object/public/petbuddy-images/slips/41/slip.png'
  const expectedAmount = 1500

  const createMockFetch = (responseBody: ThunderApiResponse, status = 200) => {
    return async () =>
      ({
        status,
        ok: status >= 200 && status < 300,
        json: async () => responseBody,
      }) as unknown as Response
  }

  describe('Scenario 1: Valid Slip (Happy Path)', () => {
    test('should verify successfully when all conditions are met', async () => {
      const now = new Date()
      const mockSuccessResponse: ThunderApiResponse = {
        success: true,
        data: {
          isDuplicate: false,
          isAmountMatched: true,
          amountInSlip: 1500,
          amountInOrder: 1500,
          rawSlip: {
            transRef: '20261019001THUNDER',
            date: now.toISOString(),
            amount: { amount: 1500 },
            sender: {
              name: { th: 'นาย สมชาย ใจดี', en: 'SOMCHAI JAIDEE' },
              bank: { nameTh: 'ธนาคารกสิกรไทย', shortCode: 'KBANK' },
            },
            receiver: {
              name: { th: 'นาย ธนิน รักสัตว์', en: 'TANIN RAKSATP' },
              bank: { nameTh: 'ธนาคารไทยพาณิชย์', shortCode: 'SCB' },
            },
          },
        },
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: createMockFetch(mockSuccessResponse),
      })

      assert.strictEqual(result.isValid, true)
      assert.strictEqual(result.isDuplicate, false)
      assert.strictEqual(result.isFallback, false)
      assert.strictEqual(result.amount, 1500)
      assert.strictEqual(result.transRef, '20261019001THUNDER')
      assert.strictEqual(result.senderName?.th, 'นาย สมชาย ใจดี')
      assert.strictEqual(result.receiverName?.th, 'นาย ธนิน รักสัตว์')
      assert.strictEqual(result.senderBank, 'ธนาคารกสิกรไทย')
      assert.strictEqual(result.receiverBank, 'ธนาคารไทยพาณิชย์')
    })
  })

  describe('Scenario 2: Amount Mismatch', () => {
    test('should reject when slip amount does not match expected amount', async () => {
      const mockAmountMismatchResponse: ThunderApiResponse = {
        success: true,
        data: {
          isDuplicate: false,
          isAmountMatched: false,
          amountInSlip: 1000,
          amountInOrder: 1500,
          rawSlip: {
            transRef: '20261019002MISMATCH',
            date: new Date().toISOString(),
            amount: { amount: 1000 },
            sender: { name: { th: 'นาย สมชาย ใจดี' } },
            receiver: { name: { th: 'นาย ธนิน รักสัตว์' } },
          },
        },
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: createMockFetch(mockAmountMismatchResponse),
      })

      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.isFallback, false)
      assert.ok(result.errorReason?.includes('ไม่ตรงกับยอดที่ต้องชำระ'))
    })
  })

  describe('Scenario 3: Duplicate Slip', () => {
    test('should reject when isDuplicate is true', async () => {
      const mockDuplicateResponse: ThunderApiResponse = {
        success: true,
        data: {
          isDuplicate: true,
          isAmountMatched: true,
          amountInSlip: 1500,
          rawSlip: {
            transRef: '20261019001THUNDER',
            date: new Date().toISOString(),
            amount: { amount: 1500 },
            sender: { name: { th: 'นาย สมชาย ใจดี' } },
            receiver: { name: { th: 'นาย ธนิน รักสัตว์' } },
          },
        },
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: createMockFetch(mockDuplicateResponse),
      })

      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.isDuplicate, true)
      assert.strictEqual(result.isFallback, false)
      assert.ok(result.errorReason?.includes('สลิปซ้ำ'))
    })
  })

  describe('Scenario 4: Transfer Date Validation', () => {
    test('should reject when slip transfer date is too old (> 3 days)', async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      const mockOutdatedResponse: ThunderApiResponse = {
        success: true,
        data: {
          isDuplicate: false,
          isAmountMatched: true,
          amountInSlip: 1500,
          rawSlip: {
            transRef: '20261019003OLD',
            date: fiveDaysAgo.toISOString(),
            amount: { amount: 1500 },
            sender: { name: { th: 'นาย สมชาย' } },
            receiver: { name: { th: 'นาย ธนิน' } },
          },
        },
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        maxDaysOld: 3,
        fetchFn: createMockFetch(mockOutdatedResponse),
      })

      assert.strictEqual(result.isValid, false)
      assert.ok(result.errorReason?.includes('หมดอายุ'))
    })

    test('should reject when slip date is in the future (> 5 mins)', async () => {
      const oneHourFuture = new Date(Date.now() + 60 * 60 * 1000)
      const mockFutureResponse: ThunderApiResponse = {
        success: true,
        data: {
          isDuplicate: false,
          isAmountMatched: true,
          amountInSlip: 1500,
          rawSlip: {
            transRef: '20261019004FUTURE',
            date: oneHourFuture.toISOString(),
            amount: { amount: 1500 },
            sender: { name: { th: 'นาย สมชาย' } },
            receiver: { name: { th: 'นาย ธนิน' } },
          },
        },
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: createMockFetch(mockFutureResponse),
      })

      assert.strictEqual(result.isValid, false)
      assert.ok(result.errorReason?.includes('อนาคต'))
    })
  })

  describe('Scenario 5: Sender / Receiver Information', () => {
    test('should extract sender and receiver names from account.name structure (Thunder v2 standard)', async () => {
      const mockThunderV2Response: ThunderApiResponse = {
        success: true,
        data: {
          isDuplicate: false,
          isAmountMatched: true,
          amountInSlip: 1500,
          rawSlip: {
            transRef: '20261019005V2ACC',
            date: new Date().toISOString(),
            amount: { amount: 1500 },
            sender: {
              account: {
                name: { th: 'นาย สุภณัฐ ผู้โอน', en: 'MR. SUPHANAT' },
              },
              bank: { name: 'ธนาคารไทยพาณิชย์', short: 'SCB' },
            },
            receiver: {
              account: {
                name: { th: 'นาย ธนิน ผู้รับ', en: 'MR. TANIN' },
              },
              bank: { name: 'ธนาคารกสิกรไทย', short: 'KBANK' },
            },
          },
        },
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: createMockFetch(mockThunderV2Response),
      })

      assert.strictEqual(result.isValid, true)
      assert.strictEqual(result.senderName?.th, 'นาย สุภณัฐ ผู้โอน')
      assert.strictEqual(result.senderName?.en, 'MR. SUPHANAT')
      assert.strictEqual(result.receiverName?.th, 'นาย ธนิน ผู้รับ')
      assert.strictEqual(result.receiverName?.en, 'MR. TANIN')
      assert.strictEqual(result.senderBank, 'ธนาคารไทยพาณิชย์')
      assert.strictEqual(result.receiverBank, 'ธนาคารกสิกรไทย')
    })

    test('should extract receiver name from matchedAccount when receiver in rawSlip is missing', async () => {
      const mockMatchedAccountResponse: ThunderApiResponse = {
        success: true,
        data: {
          isDuplicate: false,
          isAmountMatched: true,
          amountInSlip: 1500,
          matchedAccount: {
            nameTh: 'บจก. เพ็ทบัดดี้ เซอร์วิส',
            nameEn: 'PETBUDDY SERVICE CO., LTD.',
            bank: { nameTh: 'ธนาคารกรุงเทพ' },
          },
          rawSlip: {
            transRef: '20261019005MATCH',
            date: new Date().toISOString(),
            amount: { amount: 1500 },
            sender: {
              displayName: 'นาย สุภณัฐ',
            },
            receiver: {},
          },
        },
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: createMockFetch(mockMatchedAccountResponse),
      })

      assert.strictEqual(result.isValid, true)
      assert.strictEqual(result.senderName?.th, 'นาย สุภณัฐ')
      assert.strictEqual(result.receiverName?.th, 'บจก. เพ็ทบัดดี้ เซอร์วิส')
      assert.strictEqual(result.receiverName?.en, 'PETBUDDY SERVICE CO., LTD.')
      assert.strictEqual(result.receiverBank, 'ธนาคารกรุงเทพ')
    })

    test('should reject when both sender and receiver names are missing', async () => {
      const mockMissingNamesResponse: ThunderApiResponse = {
        success: true,
        data: {
          isDuplicate: false,
          isAmountMatched: true,
          amountInSlip: 1500,
          rawSlip: {
            transRef: '20261019005NONAME',
            date: new Date().toISOString(),
            amount: { amount: 1500 },
            sender: {},
            receiver: {},
          },
        },
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: createMockFetch(mockMissingNamesResponse),
      })

      assert.strictEqual(result.isValid, false)
      assert.ok(result.errorReason?.includes('ไม่พบข้อมูลชื่อผู้รับหรือผู้โอนเงิน'))
    })
  })

  describe('Scenario 6: Fallback and Upstream Errors', () => {
    test('should fallback to manual review when apiKey is missing', async () => {
      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: '',
      })

      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.isFallback, true)
    })

    test('should fallback to manual review when network error occurs', async () => {
      const mockFailingFetch = async () => {
        throw new Error('Connection refused to api.thunder.in.th')
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: mockFailingFetch as unknown as typeof fetch,
      })

      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.isFallback, true)
      assert.ok(result.errorReason?.includes('network error'))
    })

    test('should fallback to manual review when server returns HTTP 500', async () => {
      const mock500Fetch = async () =>
        ({
          status: 500,
          ok: false,
          json: async () => ({ message: 'Internal Server Error' }),
        }) as unknown as Response

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: mock500Fetch as unknown as typeof fetch,
      })

      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.isFallback, true)
      assert.ok(result.errorReason?.includes('HTTP 500'))
    })

    test('should fail fast (not fallback) when Thunder rejects slip as invalid', async () => {
      const mockInvalidSlipResponse: ThunderApiResponse = {
        success: false,
        error: {
          code: 'INVALID_SLIP',
          message: 'รูปภาพไม่ใช่สลิปธนาคาร หรือไม่พบ QR Code',
        },
      }

      const result = await verifySlipWithThunder(dummySlipUrl, expectedAmount, {
        apiKey: 'test-thunder-api-key',
        fetchFn: createMockFetch(mockInvalidSlipResponse, 400),
      })

      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.isFallback, false)
      assert.ok(result.errorReason?.includes('ไม่ใช่สลิปธนาคาร'))
    })
  })
})
