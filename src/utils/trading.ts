interface ExchangeInfo {
  name: string;
  baseUrl: string;
  tradeUrlPatterns: string[];
  symbolRegexes: RegExp[];
}

const exchanges: ExchangeInfo[] = [
  {
    name: 'Gate.io',
    baseUrl: 'gate.io',
    tradeUrlPatterns: ['/zh/trade/', '/en/trade/', '/trade/'],
    symbolRegexes: [
      /\/trade\/([A-Z0-9]+)_USDT/i,
      /\/[a-z]{2}\/trade\/([A-Z0-9]+)_USDT/i,
      /\/([A-Z0-9]+)_USDT$/i
    ]
  },
  {
    name: 'Binance',
    baseUrl: 'binance.com',
    tradeUrlPatterns: ['/*/trade/', '/trade/'],
    symbolRegexes: [
      /\/([A-Z0-9]+)USDT$/i,
      /\/trade\/([A-Z0-9]+)_USDT/i,
      /\/trading\/([A-Z0-9]+)USDT/i
    ]
  },
  {
    name: 'OKX',
    baseUrl: 'okx.com',
    tradeUrlPatterns: ['/*/trade-spot/', '/*/trade/', '/trade-spot/', '/trade/'],
    symbolRegexes: [
      /\/([A-Z0-9]+)-USDT$/i,
      /\/trade\/([A-Z0-9]+)-USDT/i,
      /\/spot\/([A-Z0-9]+)-USDT/i
    ]
  }
];

export function parseSymbolFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // 查找匹配的交易所
    const exchange = exchanges.find(ex => urlObj.hostname.includes(ex.baseUrl));
    if (!exchange) {
      console.log('不支持的交易所:', urlObj.hostname);
      return null;
    }

    // 检查是否是交易页面
    const isTradeUrl = exchange.tradeUrlPatterns.some(pattern => 
      urlObj.pathname.includes(pattern)
    );
    if (!isTradeUrl) {
      console.log('不是交易页面:', urlObj.pathname);
      return null;
    }

    // 尝试所有可能的正则表达式来匹配交易对
    for (const regex of exchange.symbolRegexes) {
      const match = urlObj.pathname.match(regex);
      if (match && match[1]) {
        // 统一转换为大写并添加 USDT 后缀
        const symbol = `${match[1].toUpperCase()}USDT`;
        console.log('解析到交易对:', symbol);
        return symbol;
      }
    }

    console.log('未能从 URL 解析出交易对:', url);
    return null;
  } catch (error) {
    console.error('解析 URL 时出错:', error);
    return null;
  }
}

export function isExchangeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return exchanges.some(exchange => 
      urlObj.hostname.includes(exchange.baseUrl) &&
      exchange.tradeUrlPatterns.some(pattern => 
        urlObj.pathname.includes(pattern)
      )
    );
  } catch {
    return false;
  }
}

// 导出交易所信息，以便其他模块使用
export const supportedExchanges = exchanges.map(ex => ({
  name: ex.name,
  baseUrl: ex.baseUrl
})); 