/**
 * API Key 存储管理模块
 * 负责 News API Key 的本地存储、读取、验证和清除
 */

const STORAGE_KEY = 'newsapi_key';

/**
 * 保存 API Key 到 localStorage
 * @param {string} key - API Key
 * @returns {boolean} 保存是否成功
 */
export function saveApiKey(key) {
    try {
        if (!key || typeof key !== 'string') {
            console.error('Invalid API key');
            return false;
        }
        
        const trimmedKey = key.trim();
        if (!validateApiKey(trimmedKey)) {
            console.error('API key format invalid');
            return false;
        }
        
        localStorage.setItem(STORAGE_KEY, trimmedKey);
        console.log('API key saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving API key:', error);
        return false;
    }
}

/**
 * 从 localStorage 读取 API Key
 * @returns {string|null} API Key 或 null
 */
export function getApiKey() {
    try {
        const key = localStorage.getItem(STORAGE_KEY);
        return key ? key.trim() : null;
    } catch (error) {
        console.error('Error getting API key:', error);
        return null;
    }
}

/**
 * 检查是否已保存 API Key
 * @returns {boolean} 是否存在 API Key
 */
export function hasApiKey() {
    const key = getApiKey();
    return key !== null && key.length > 0;
}

/**
 * 清除保存的 API Key
 * @returns {boolean} 清除是否成功
 */
export function clearApiKey() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('API key cleared');
        return true;
    } catch (error) {
        console.error('Error clearing API key:', error);
        return false;
    }
}

/**
 * 验证 API Key 格式
 * News API Key 通常是32位十六进制字符串
 * @param {string} key - 待验证的 API Key
 * @returns {boolean} 格式是否有效
 */
export function validateApiKey(key) {
    if (!key || typeof key !== 'string') {
        return false;
    }
    
    // 移除空格
    const trimmedKey = key.trim();
    
    // 检查长度（News API key 通常是32位）
    if (trimmedKey.length < 20 || trimmedKey.length > 50) {
        return false;
    }
    
    // 检查是否只包含字母数字字符
    const validFormat = /^[a-zA-Z0-9]+$/;
    return validFormat.test(trimmedKey);
}

/**
 * 打码显示 API Key（用于UI显示）
 * 显示前3位和后3位，中间用星号替代
 * @param {string} key - API Key
 * @returns {string} 打码后的字符串
 */
export function maskApiKey(key) {
    if (!key || typeof key !== 'string') {
        return '';
    }
    
    const trimmedKey = key.trim();
    
    if (trimmedKey.length <= 6) {
        return '***';
    }
    
    const start = trimmedKey.substring(0, 3);
    const end = trimmedKey.substring(trimmedKey.length - 3);
    const middleLength = trimmedKey.length - 6;
    const middle = '*'.repeat(Math.min(middleLength, 10)); // 最多显示10个星号
    
    return `${start}${middle}${end}`;
}

/**
 * 测试 localStorage 是否可用
 * @returns {boolean} 是否可用
 */
export function isLocalStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        console.error('localStorage not available:', error);
        return false;
    }
}
