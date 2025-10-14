import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import currency from 'currency.js';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Install: npm install currency.js


export async function convertCurrency(amount: number, to: string,from:string) {
  try {
    // If no conversion is needed (same currency)
    if (to === from) {
      return amount;
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/73b2fbd0a53e937c2c193985/latest/${from}`
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.result !== 'success' || !data.conversion_rates) {
      throw new Error('Invalid API response format');
    }
    
    const rate = data.conversion_rates[to];
    
    if (rate === undefined) {
      console.warn(`Currency ${to} not found in rates, using 1 as fallback`);
      return amount; // Return the original amount as fallback
    }
    
    return amount * rate;
  } catch (error) {
    console.error('Error in convertCurrency:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      amount,
      to
    });
    
    // Return the original amount as fallback
    return amount;
  }
}

export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  try {
    // If the target currency is already RWF, return 1 as the exchange rate
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/73b2fbd0a53e937c2c193985/latest/${fromCurrency}`
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.result === 'error') {
      throw new Error(data['error-type']);
    }
    
    // Get the exchange rate from the source currency to RWF
    const rate = data.conversion_rates[toCurrency];
    
    if (!rate) {
      throw new Error('RWF rate not found in the response');
    }
    
    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw new Error(`Failed to get exchange rate from ${fromCurrency} to RWF`);
  }
}

// Usage
// const amountInEUR = await convertCurrency(100, 'USD', 'EUR');