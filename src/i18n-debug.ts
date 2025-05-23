/**
 * i18n 调试工具
 * 用于在扩展环境中调试 i18n 相关问题
 */

// 初始化调试对象
export const initI18nDebug = () => {
  // 添加调试信息，帮助确认语言文件是否正确加载
  (window as any).i18nDebug = {
    loaded: false,
    languages: [],
    currentLocale: '',
    error: null,
    logs: []
  };

  // 添加日志函数
  const log = (message: string, data?: any) => {
    console.log(`[I18n Debug] ${message}`, data || '');
    if ((window as any).i18nDebug) {
      (window as any).i18nDebug.logs.push({
        time: new Date().toISOString(),
        message,
        data
      });
    }
  };

  // 在控制台中输出调试信息
  log('I18n debug initialized');

  // 添加调试开关
  // 强制启用调试模式
  localStorage.setItem('i18n_debug', 'true');
  log('I18n debug mode enabled (forced)');

  // 监听语言变更事件
  window.addEventListener('language-changed', (event) => {
    const newLang = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US';
    log(`语言已变更为: ${newLang}`);
    if ((window as any).i18nDebug) {
      const oldLocale = (window as any).i18nDebug.currentLocale;
      (window as any).i18nDebug.currentLocale = newLang;
      log(`调试工具语言从 ${oldLocale} 更新为 ${newLang}`);

      // 检查 vue-i18n 全局实例的语言
      try {
        const vueI18n = (window as any).__VUE_I18N__;
        if (vueI18n && vueI18n.global) {
          log(`Vue I18n 全局语言: ${vueI18n.global.locale.value}`);
        }
      } catch (e) {
        log(`获取 Vue I18n 全局语言失败: ${e}`);
      }
    }
  });

  // 监听强制刷新事件
  window.addEventListener('force-refresh-i18n', () => {
    const newLang = localStorage.getItem('language') || 'en-US';
    log(`收到强制刷新事件，更新语言为: ${newLang}`);
    if ((window as any).i18nDebug) {
      const oldLocale = (window as any).i18nDebug.currentLocale;
      (window as any).i18nDebug.currentLocale = newLang;
      log(`调试工具语言从 ${oldLocale} 更新为 ${newLang} (强制刷新)`);

      // 检查 vue-i18n 全局实例的语言
      try {
        const vueI18n = (window as any).__VUE_I18N__;
        if (vueI18n && vueI18n.global) {
          log(`Vue I18n 全局语言 (强制刷新): ${vueI18n.global.locale.value}`);
        }
      } catch (e) {
        log(`获取 Vue I18n 全局语言失败 (强制刷新): ${e}`);
      }
    }
  });

  return {
    log,
    updateStatus: (status: { loaded: boolean, languages: string[], currentLocale: string }) => {
      if ((window as any).i18nDebug) {
        (window as any).i18nDebug.loaded = status.loaded;
        (window as any).i18nDebug.languages = status.languages;

        // 更新当前语言，并记录变更
        if ((window as any).i18nDebug.currentLocale !== status.currentLocale) {
          log(`当前语言从 ${(window as any).i18nDebug.currentLocale} 更新为 ${status.currentLocale}`);
        }
        (window as any).i18nDebug.currentLocale = status.currentLocale;

        log('I18n status updated', status);
      }
    },
    setError: (error: any) => {
      if ((window as any).i18nDebug) {
        (window as any).i18nDebug.error = error;
        log('I18n error', error);
      }
    },
    // 添加更新当前语言的方法
    updateCurrentLocale: (locale: string) => {
      if ((window as any).i18nDebug) {
        if ((window as any).i18nDebug.currentLocale !== locale) {
          log(`当前语言从 ${(window as any).i18nDebug.currentLocale} 更新为 ${locale}`);
        }
        (window as any).i18nDebug.currentLocale = locale;
      }
    }
  };
};

// 导出默认对象
export default { initI18nDebug };
