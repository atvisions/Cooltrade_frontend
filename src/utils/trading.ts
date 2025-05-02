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

/**
 * 从交易所URL中解析交易对符号
 * @param url 交易所URL
 * @returns 交易对符号，例如 'BTCUSDT'
 */
export const parseSymbolFromUrl = (url: string): string | null => {
  try {
    // Gate.io
    if (url.includes('gate.io')) {
      const matches = url.match(/\/(?:zh\/)?trade\/([A-Z0-9]+)_([A-Z0-9]+)/i);
      if (matches && matches[1] && matches[2]) {
        return `${matches[1]}${matches[2]}`;
      }
      return null;
    }

    // 币安
    if (url.includes('binance.com')) {
      // 提取交易对部分
      if (url.includes('/trade/')) {
        const symbol = url.split('/trade/')[1].split('_')[0].toUpperCase()
        // 如果不包含USDT后缀，添加它
        if (!symbol.endsWith('USDT')) {
          return `${symbol}USDT`
        }
        return symbol
      }
      return null
    }
    
    // OKX
    if (url.includes('okx.com')) {
      // 提取交易对部分
      if (url.includes('/trade-spot/')) {
        const pairs = url.split('/trade-spot/')[1].split('?')[0].split('-')
        if (pairs.length === 2) {
          const [base, quote] = pairs
          // 将 USD 转换为 USDT
          const quoteSymbol = quote.toUpperCase() === 'USD' ? 'USDT' : quote.toUpperCase()
          return `${base.toUpperCase()}${quoteSymbol}`
        }
      }
      return null
    }

    return null
  } catch (e) {
    console.error('解析交易对符号失败:', e)
    return null
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