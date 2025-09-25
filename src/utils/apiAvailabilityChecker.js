let _router = null;


const getRouterInstance = async () => {
  if (_router) return _router;
  const mod = await import('@/router');
  _router = mod.default || mod.router || mod;
  return _router;
};



function shouldCheckApiAvailability() {
  if (typeof window === 'undefined' || !window.EZ_CONFIG) return false;
  
  if (window.EZ_CONFIG.API_MIDDLEWARE_ENABLED === true) return false;
  
  const apiConfig = window.EZ_CONFIG.API_CONFIG;
  if (!apiConfig || apiConfig.urlMode !== 'static') return false;
  
  if (apiConfig.showCheckBackend === false) return false;
  
  const staticBaseUrls = apiConfig.staticBaseUrl;
  return Array.isArray(staticBaseUrls) && staticBaseUrls.length > 1;
};



function getAvailableApiUrl() {
  if (!shouldCheckApiAvailability()) {
    if (window.EZ_CONFIG?.API_CONFIG?.staticBaseUrl) {
      const urls = window.EZ_CONFIG.API_CONFIG.staticBaseUrl;
      return Array.isArray(urls) ? urls[0] : urls;
    }
    return '';
  }
  
  const availableUrl = sessionStorage.getItem('ez_api_available_url');
  if (availableUrl) {
    return availableUrl;
  }
  
  return window.EZ_CONFIG.API_CONFIG.staticBaseUrl[0];
}



async function initApiAvailabilityChecker(redirect = true) {
  if (!shouldCheckApiAvailability()) {
    return null;
  }
  
  try {
    const storedUrl = sessionStorage.getItem('ez_api_available_url');
    if (storedUrl) {
      console.log('使用已验证的API URL:', storedUrl);
      return storedUrl;
    }
    
    if (redirect) {
      const router = await getRouterInstance();
      if (router.currentRoute.value.name !== 'ApiValidation') {
        const { path: currentPath, query: currentQuery } = router.currentRoute.value;

        const apiValidationQuery = {
          redirect: currentPath !== '/api-validation' ? currentPath : '/',
          ...currentQuery
        };

        router.push({
          path: '/api-validation',
          query: apiValidationQuery
        });
        return null;
      }
    }
  } catch (error) {
    console.error('API可用性检测初始化失败:', error);
  }
  
  return null;
}

export {
  getAvailableApiUrl,
  initApiAvailabilityChecker,
  shouldCheckApiAvailability
};
