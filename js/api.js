/**
 * News API 客户端模块
 * 负责调用 News API 获取最新新闻
 */

import { getApiKey } from './storage.js';

const API_BASE_URL = 'https://newsapi.org/v2/everything';
const DEFAULT_TIMEOUT = 10000; // 10秒超时

/**
 * 获取最新新闻
 * @param {string} keyword - 搜索关键词
 * @param {Object} options - 可选参数
 * @param {number} options.hours - 时间范围（小时），默认24
 * @param {number} options.pageSize - 结果数量，默认10
 * @param {string} options.language - 语言，默认不限（支持中英文）
 * @returns {Promise<Object>} { status, data, error }
 */
export async function fetchNews(keyword, options = {}) {
    // 验证参数
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
        return {
            status: 'error',
            data: null,
            error: 'INVALID_KEYWORD',
            message: '请输入有效的搜索关键词'
        };
    }

    // 获取 API Key
    const apiKey = getApiKey();
    if (!apiKey) {
        return {
            status: 'error',
            data: null,
            error: 'API_KEY_MISSING',
            message: '请先设置 News API Key'
        };
    }

    // 构建请求参数
    const {
        hours = 24,
        pageSize = 10,
        language = '' // 不限制语言，支持中英文
    } = options;

    // 计算时间范围
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - hours * 60 * 60 * 1000);

    const params = new URLSearchParams({
        q: keyword.trim(),
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        sortBy: 'publishedAt',
        pageSize: Math.min(pageSize, 100).toString(),
        apiKey: apiKey
    });

    // 如果指定了语言，添加语言参数
    if (language) {
        params.append('language', language);
    }

    const url = `${API_BASE_URL}?${params.toString()}`;

    try {
        // 创建带超时的 fetch 请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // 解析响应
        const data = await response.json();

        // 处理 API 错误
        if (!response.ok) {
            return handleApiError(response.status, data);
        }

        // 检查返回状态
        if (data.status !== 'ok') {
            return {
                status: 'error',
                data: null,
                error: 'API_ERROR',
                message: data.message || 'API 返回错误'
            };
        }

        // 检查是否有结果
        if (!data.articles || data.articles.length === 0) {
            return {
                status: 'error',
                data: null,
                error: 'NO_RESULTS',
                message: '未找到相关资讯，试试其他关键词'
            };
        }

        // 过滤和清洗数据
        const cleanedArticles = cleanArticles(data.articles);

        return {
            status: 'success',
            data: {
                totalResults: data.totalResults,
                articles: cleanedArticles
            },
            error: null
        };

    } catch (error) {
        console.error('Fetch news error:', error);

        // 区分不同类型的错误
        if (error.name === 'AbortError') {
            return {
                status: 'error',
                data: null,
                error: 'TIMEOUT',
                message: '请求超时，请稍后重试'
            };
        }

        if (!navigator.onLine) {
            return {
                status: 'error',
                data: null,
                error: 'NETWORK_ERROR',
                message: '网络连接失败，请检查网络'
            };
        }

        return {
            status: 'error',
            data: null,
            error: 'UNKNOWN_ERROR',
            message: '获取资讯失败，请稍后重试'
        };
    }
}

/**
 * 处理 API 错误响应
 * @param {number} status - HTTP 状态码
 * @param {Object} data - 响应数据
 * @returns {Object} 错误对象
 */
function handleApiError(status, data) {
    const errorMap = {
        400: {
            error: 'BAD_REQUEST',
            message: '请求参数错误'
        },
        401: {
            error: 'API_KEY_INVALID',
            message: 'API Key 无效，请检查设置'
        },
        429: {
            error: 'RATE_LIMIT_EXCEEDED',
            message: '请求次数超限，请稍后再试'
        },
        500: {
            error: 'SERVER_ERROR',
            message: 'API 服务器错误，请稍后重试'
        }
    };

    const errorInfo = errorMap[status] || {
        error: 'API_ERROR',
        message: data.message || `请求失败 (${status})`
    };

    return {
        status: 'error',
        data: null,
        ...errorInfo
    };
}

/**
 * 清洗和过滤文章数据
 * @param {Array} articles - 原始文章数组
 * @returns {Array} 清洗后的文章数组
 */
function cleanArticles(articles) {
    return articles
        .filter(article => {
            // 过滤掉无效文章
            return article.title && 
                   article.title !== '[Removed]' &&
                   article.description &&
                   article.url;
        })
        .map(article => ({
            source: {
                name: article.source?.name || '未知来源'
            },
            title: sanitizeText(article.title),
            description: sanitizeText(article.description),
            content: sanitizeText(article.content || article.description),
            url: article.url,
            urlToImage: article.urlToImage || null,
            publishedAt: article.publishedAt,
            author: article.author || null
        }));
}

/**
 * 清理文本内容（移除HTML标签等）
 * @param {string} text - 原始文本
 * @returns {string} 清理后的文本
 */
function sanitizeText(text) {
    if (!text) return '';
    
    // 移除HTML标签
    const withoutHtml = text.replace(/<[^>]*>/g, '');
    
    // 解码HTML实体
    const textarea = document.createElement('textarea');
    textarea.innerHTML = withoutHtml;
    const decoded = textarea.value;
    
    // 清理多余空格和换行
    return decoded.trim().replace(/\s+/g, ' ');
}

/**
 * 格式化发布时间为相对时间
 * @param {string} dateString - ISO 8601 时间字符串
 * @returns {string} 相对时间描述
 */
export function formatRelativeTime(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        
        // 超过7天显示具体日期
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Format time error:', error);
        return '未知时间';
    }
}

/**
 * 验证 URL 格式
 * @param {string} url - URL字符串
 * @returns {boolean} 是否有效
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
