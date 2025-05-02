import type { Directive, DirectiveBinding } from 'vue'
import tippy, { Instance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'

// 扩展全局的HTMLElement接口
declare global {
  interface HTMLElement {
    _tippy?: Instance
  }
}

export const vTooltip: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    tippy(el, {
      content: binding.value,
      placement: 'top',
      theme: 'dark',
      arrow: true,
      animation: 'scale',
      duration: [200, 150],
      offset: [0, 8]
    })
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const instance = el._tippy
    if (instance) {
      instance.setContent(binding.value)
    }
  },
  beforeUnmount(el: HTMLElement) {
    const instance = el._tippy
    if (instance) {
      instance.destroy()
    }
  }
}