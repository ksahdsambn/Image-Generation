import { describe, it, expect } from 'vitest'
import {
  IMAGE_SIZES,
  IMAGE_SIZE_OPTIONS,
  MODEL,
  RESPONSE_FORMAT,
  DEFAULT_IMAGE_SIZE,
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
      expect(isValidSize('auto')).toBe(true)
      expect(isValidSize('1024x1024')).toBe(true)
      expect(isValidSize('1536x1024')).toBe(true)
      expect(isValidSize('1024x1536')).toBe(true)
      expect(isValidSize('2048x2048')).toBe(true)
      expect(isValidSize('2048x1152')).toBe(true)
      expect(isValidSize('1152x2048')).toBe(true)
      expect(isValidSize('3840x2160')).toBe(true)
      expect(isValidSize('2160x3840')).toBe(true)
      expect(isValidSize('2880x2880')).toBe(true)
    })

    it('rejects invalid sizes', () => {
      expect(isValidSize('512x512')).toBe(false)
      expect(isValidSize('2048x1536')).toBe(false)
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
      expect(IMAGE_SIZES).toContain('auto')
      expect(IMAGE_SIZES).toContain('1024x1024')
      expect(IMAGE_SIZES).toContain('1536x1024')
      expect(IMAGE_SIZES).toContain('1024x1536')
      expect(IMAGE_SIZES).toContain('2048x2048')
      expect(IMAGE_SIZES).toContain('2048x1152')
      expect(IMAGE_SIZES).toContain('1152x2048')
      expect(IMAGE_SIZES).toContain('3840x2160')
      expect(IMAGE_SIZES).toContain('2160x3840')
      expect(IMAGE_SIZES).toContain('2880x2880')
    })

    it('IMAGE_SIZE_OPTIONS exposes user-facing labels', () => {
      expect(DEFAULT_IMAGE_SIZE).toBe('auto')
      expect(IMAGE_SIZE_OPTIONS).toEqual([
        { value: 'auto', label: '自动' },
        { value: '1024x1024', label: '1K 方形 1:1      1024x1024' },
        { value: '1536x1024', label: '1K 横版 3:2      1536x1024' },
        { value: '1024x1536', label: '1K 竖版 2:3      1024x1536' },
        { value: '2048x2048', label: '2K 方形 1:1      2048x2048' },
        { value: '2048x1152', label: '2K 宽屏 16:9     2048x1152' },
        { value: '1152x2048', label: '2K 故事版 9:16   1152x2048' },
        { value: '3840x2160', label: '4K 横版 16:9     3840x2160' },
        { value: '2160x3840', label: '4K 竖版 9:16     2160x3840' },
        { value: '2880x2880', label: '4K 方形 1:1      2880x2880' },
      ])
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
