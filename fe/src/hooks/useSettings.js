import { useState, useEffect } from 'react';

const STORAGE_KEY_CURRENCY = 'dali_preferred_currency';
const STORAGE_KEY_UNIT = 'dali_preferred_unit';

/**
 * Hook to manage global settings for currency and size unit.
 * Persists settings to localStorage.
 */
export const useSettings = () => {
    const [currency, setCurrency] = useState(() => {
        return localStorage.getItem(STORAGE_KEY_CURRENCY) || 'USD';
    });

    const [unit, setUnit] = useState(() => {
        return localStorage.getItem(STORAGE_KEY_UNIT) || 'sqm';
    });

    const updateCurrency = (newCurrency) => {
        setCurrency(newCurrency);
        localStorage.setItem(STORAGE_KEY_CURRENCY, newCurrency);
        // Dispatch custom event to notify other components in same tab
        window.dispatchEvent(new Event('dali_settings_changed'));
    };

    const updateUnit = (newUnit) => {
        setUnit(newUnit);
        localStorage.setItem(STORAGE_KEY_UNIT, newUnit);
        // Dispatch custom event to notify other components in same tab
        window.dispatchEvent(new Event('dali_settings_changed'));
    };

    useEffect(() => {
        const handleStorageChange = () => {
            setCurrency(localStorage.getItem(STORAGE_KEY_CURRENCY) || 'USD');
            setUnit(localStorage.getItem(STORAGE_KEY_UNIT) || 'sqm');
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('dali_settings_changed', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('dali_settings_changed', handleStorageChange);
        };
    }, []);

    return {
        currency,
        unit,
        updateCurrency,
        updateUnit
    };
};
