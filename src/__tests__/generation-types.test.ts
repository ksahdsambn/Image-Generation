import { describe, it, expect } from 'vitest'
import {
  IMAGE_SIZES,
  MODEL,
  RESPONSE_FORMAT,
  MIN_IMAGE_COUNT,
  MAX_IMAGE_COUNT,
  isValidSize,
  isValidCount,
  isValidQuality,
  isValidBackground,
  isValidOutputFormat,
  isCompressionApplicable,
  validatePrompt,
  COMPRESSION_FORMATS,
} from '../types/generation'

describe('generation types', () => {
  describe('isValidSize', () => {
    it('accepts valid sizes', () => {
      expect(isValidSize('1024x1024')).toBe(true)
      expect(isValidSize('1536x1024')).toBe(true)
      expect(isValidSize('1024x1536')).toBe(true)
    })

    it('rejects invalid sizes', () => {
      expect(isValidSize('512x512')).toBe(false)
      expect(isValidSize('2048x2048')).toBe(false)
      expect(isValidSize('')).toBe(false)
    })
  })

  describe('isValidCount', () => {
    it('accepts valid counts', () => {
      expect(isValidCount(1)).toBe(true)
      expect(isValidCount(5)).toBe(true)
      expect(isValidCount(MAX_IMAGE_COUNT)).toBe(true)
    })

    it('rejects counts below minimum', () => {
      expect(isValidCount(0)).toBe(false)
      expect(isValidCount(-1)).toBe(false)
    })

    it('rejects counts above maximum', () => {
      expect(isValidCount(MAX_IMAGE_COUNT + 1)).toBe(false)
      expect(isValidCount(100)).toBe(false)
    })

    it('rejects non-integer counts', () => {
      expect(isValidCount(1.5)).toBe(false)
    })
  })

  describe('isValidQuality', () => {
    it('accepts valid qualities', () => {
      expect(isValidQuality('auto')).toBe(true)
      expect(isValidQuality('low')).toBe(true)
      expect(isValidQuality('medium')).toBe(true)
      expect(isValidQuality('high')).toBe(true)
    })

    it('rejects invalid qualities', () => {
      expect(isValidQuality('standard')).toBe(false)
      expect(isValidQuality('')).toBe(false)
    })
  })

  describe('isValidBackground', () => {
    it('accepts valid backgrounds', () => {
      expect(isValidBackground('auto')).toBe(true)
      expect(isValidBackground('transparent')).toBe(true)
      expect(isValidBackground('opaque')).toBe(true)
    })

    it('rejects invalid backgrounds', () => {
      expect(isValidBackground('white')).toBe(false)
    })
  })

  describe('isValidOutputFormat', () => {
    it('accepts valid formats', () => {
      expect(isValidOutputFormat('png')).toBe(true)
      expect(isValidOutputFormat('webp')).toBe(true)
      expect(isValidOutputFormat('jpeg')).toBe(true)
    })

    it('rejects invalid formats', () => {
      expect(isValidOutputFormat('gif')).toBe(false)
      expect(isValidOutputFormat('bmp')).toBe(false)
    })
  })

  describe('isCompressionApplicable', () => {
    it('is applicable for webp and jpeg', () => {
      expect(isCompressionApplicable('webp')).toBe(true)
      expect(isCompressionApplicable('jpeg')).toBe(true)
    })

    it('is not applicable for png', () => {
      expect(isCompressionApplicable('png')).toBe(false)
    })
  })

  describe('validatePrompt', () => {
    it('returns null for valid prompt', () => {
      expect(validatePrompt('A beautiful sunset')).toBeNull()
    })

    it('returns error for empty prompt', () => {
      expect(validatePrompt('')).toContain('不能为空')
    })

    it('returns error for whitespace-only prompt', () => {
      expect(validatePrompt('   ')).toContain('不能为空')
    })
  })

  describe('constants', () => {
    it('MODEL is gpt-image-2', () => {
      expect(MODEL).toBe('gpt-image-2')
    })

    it('RESPONSE_FORMAT is b64_json', () => {
      expect(RESPONSE_FORMAT).toBe('b64_json')
    })

    it('IMAGE_SIZES has expected values', () => {
      expect(IMAGE_SIZES).toContain('1024x1024')
      expect(IMAGE_SIZES).toContain('1536x1024')
      expect(IMAGE_SIZES).toContain('1024x1536')
    })

    it('MIN_IMAGE_COUNT is 1', () => {
      expect(MIN_IMAGE_COUNT).toBe(1)
    })

    it('MAX_IMAGE_COUNT is 10', () => {
      expect(MAX_IMAGE_COUNT).toBe(10)
    })

    it('COMPRESSION_FORMATS includes webp and jpeg', () => {
      expect(COMPRESSION_FORMATS).toContain('webp')
      expect(COMPRESSION_FORMATS).toContain('jpeg')
    })
  })
})
