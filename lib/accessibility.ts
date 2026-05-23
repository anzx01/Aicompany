/**
 * 无障碍工具函数
 * 提供 ARIA 标签和无障碍支持
 */

// ARIA 角色
export const ariaRoles = {
  navigation: 'navigation',
  main: 'main',
  complementary: 'complementary',
  contentinfo: 'contentinfo',
  banner: 'banner',
  search: 'search',
  form: 'form',
  dialog: 'dialog',
  alertdialog: 'alertdialog',
  alert: 'alert',
  status: 'status',
  progressbar: 'progressbar',
  tab: 'tab',
  tabpanel: 'tabpanel',
  tablist: 'tablist',
  menu: 'menu',
  menuitem: 'menuitem',
  button: 'button',
  link: 'link',
  listbox: 'listbox',
  option: 'option',
} as const;

// ARIA 属性生成器
export const aria = {
  label: (label: string) => ({ 'aria-label': label }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  selected: (selected: boolean) => ({ 'aria-selected': selected }),
  checked: (checked: boolean) => ({ 'aria-checked': checked }),
  disabled: (disabled: boolean) => ({ 'aria-disabled': disabled }),
  hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
  current: (current: string) => ({ 'aria-current': current }),
  live: (live: 'polite' | 'assertive' | 'off') => ({ 'aria-live': live }),
  atomic: (atomic: boolean) => ({ 'aria-atomic': atomic }),
  busy: (busy: boolean) => ({ 'aria-busy': busy }),
  controls: (id: string) => ({ 'aria-controls': id }),
  owns: (id: string) => ({ 'aria-owns': id }),
  haspopup: (popup: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog') => ({ 'aria-haspopup': popup }),
  invalid: (invalid: boolean) => ({ 'aria-invalid': invalid }),
  required: (required: boolean) => ({ 'aria-required': required }),
  valueNow: (value: number) => ({ 'aria-valuenow': value }),
  valueMin: (value: number) => ({ 'aria-valuemin': value }),
  valueMax: (value: number) => ({ 'aria-valuemax': value }),
  valueText: (text: string) => ({ 'aria-valuetext': text }),
};

// 键盘导航辅助
export const keyboard = {
  // 处理 Enter 和 Space 键
  activateOnEnterOrSpace: (callback: () => void) => ({
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback();
      }
    },
  }),

  // 处理 Escape 键
  closeOnEscape: (callback: () => void) => ({
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        callback();
      }
    },
  }),

  // 箭头键导航
  arrowNavigation: (handlers: {
    onUp?: () => void;
    onDown?: () => void;
    onLeft?: () => void;
    onRight?: () => void;
  }) => ({
    onKeyDown: (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handlers.onUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlers.onDown?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlers.onLeft?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handlers.onRight?.();
          break;
      }
    },
  }),
};

// 焦点管理
export const focus = {
  // 焦点陷阱（用于模态框）
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => {
    const focusableElements = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    return {
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      },
    };
  },

  // 自动聚焦
  autoFocus: (ref: React.RefObject<HTMLElement>) => {
    setTimeout(() => ref.current?.focus(), 0);
  },
};

// 屏幕阅读器专用文本
export const srOnly = 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

// 跳过导航链接
export const skipLink = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-background focus:text-foreground';

// 颜色对比度检查（WCAG AA 标准）
export const checkContrast = (foreground: string, background: string): boolean => {
  // 简化版本，实际应用中应使用完整的对比度计算
  // 这里只是示例
  return true;
};

// 无障碍表单标签
export const formAccessibility = {
  // 必填字段标记
  required: {
    ...aria.required(true),
    'aria-label': '必填字段',
  },

  // 错误提示
  error: (errorId: string) => ({
    ...aria.invalid(true),
    ...aria.describedBy(errorId),
  }),

  // 帮助文本
  help: (helpId: string) => ({
    ...aria.describedBy(helpId),
  }),
};

// 实时区域（用于动态内容更新）
export const liveRegion = {
  polite: {
    ...aria.live('polite'),
    ...aria.atomic(true),
  },
  assertive: {
    ...aria.live('assertive'),
    ...aria.atomic(true),
  },
};

// 进度条无障碍
export const progressAccessibility = (value: number, max: number = 100, label?: string) => ({
  role: 'progressbar',
  ...aria.valueNow(value),
  ...aria.valueMin(0),
  ...aria.valueMax(max),
  ...aria.valueText(`${Math.round((value / max) * 100)}%`),
  ...(label && aria.label(label)),
});

// 对话框无障碍
export const dialogAccessibility = (labelId: string, descriptionId?: string) => ({
  role: 'dialog',
  ...aria.labelledBy(labelId),
  ...(descriptionId && aria.describedBy(descriptionId)),
  'aria-modal': true,
});

// 菜单无障碍
export const menuAccessibility = {
  menu: {
    role: 'menu',
  },
  menuItem: (index: number) => ({
    role: 'menuitem',
    tabIndex: index === 0 ? 0 : -1,
  }),
};

// 标签页无障碍
export const tabAccessibility = {
  tabList: {
    role: 'tablist',
  },
  tab: (selected: boolean, controls: string) => ({
    role: 'tab',
    ...aria.selected(selected),
    ...aria.controls(controls),
    tabIndex: selected ? 0 : -1,
  }),
  tabPanel: (labelledBy: string, hidden: boolean) => ({
    role: 'tabpanel',
    ...aria.labelledBy(labelledBy),
    ...aria.hidden(hidden),
    tabIndex: 0,
  }),
};
