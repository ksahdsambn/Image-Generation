import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ErrorAlert from '@/components/ErrorAlert.vue'

describe('ErrorAlert', () => {
  it('renders an error message in a visible alert region', () => {
    const wrapper = mount(ErrorAlert, {
      props: {
        title: '错误',
        message: 'API Key 无效或已失效',
      },
    })

    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.text()).toContain('API Key 无效或已失效')
  })
})
