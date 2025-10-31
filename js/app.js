/**
 * 主应用控制器
 * 协调各模块工作，管理应用状态和事件
 */

import * as storage from './storage.js';
import { fetchNews, formatRelativeTime } from './api.js';
import { generateSummary } from './summarizer.js';

// 应用状态
const APP_STATE = {
    NEEDS_API_KEY: 'needsApiKey',
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

// 当前状态
let currentState = APP_STATE.IDLE;
let lastKeyword = '';

// DOM 元素引用
const elements = {};

/**
 * 初始化应用
 */
function init() {
    // 检查 localStorage 可用性
    if (!storage.isLocalStorageAvailable()) {
        showToast('⚠️ 浏览器不支持本地存储', 'error');
        return;
    }

    // 获取 DOM 元素
    cacheElements();

    // 绑定事件
    bindEvents();

    // 检查 API Key
    checkApiKey();

    console.log('App initialized');
}

/**
 * 缓存 DOM 元素引用
 */
function cacheElements() {
    elements.apiKeyModal = document.getElementById('apiKeyModal');
    elements.apiKeyInput = document.getElementById('apiKeyInput');
    elements.toggleApiKey = document.getElementById('toggleApiKey');
    elements.saveApiKey = document.getElementById('saveApiKey');
    elements.clearApiKey = document.getElementById('clearApiKey');
    elements.closeModal = document.getElementById('closeModal');
    elements.settingsBtn = document.getElementById('settingsBtn');
    
    elements.searchInput = document.getElementById('searchInput');
    elements.searchBtn = document.getElementById('searchBtn');
    
    elements.loadingIndicator = document.getElementById('loadingIndicator');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.errorText = elements.errorMessage?.querySelector('.error-text');
    elements.retryBtn = document.getElementById('retryBtn');
    
    elements.resultContainer = document.getElementById('resultContainer');
    elements.overviewContent = document.getElementById('overviewContent');
    elements.keypointsList = document.getElementById('keypointsList');
    elements.keywordsContainer = document.getElementById('keywordsContainer');
    elements.sourcesList = document.getElementById('sourcesList');
    
    elements.toast = document.getElementById('toast');
}

/**
 * 绑定事件监听器
 */
function bindEvents() {
    // API Key 相关
    elements.settingsBtn?.addEventListener('click', openApiKeyModal);
    elements.closeModal?.addEventListener('click', closeApiKeyModal);
    elements.toggleApiKey?.addEventListener('click', toggleApiKeyVisibility);
    elements.saveApiKey?.addEventListener('click', handleSaveApiKey);
    elements.clearApiKey?.addEventListener('click', handleClearApiKey);
    
    // 点击模态框外部关闭
    elements.apiKeyModal?.addEventListener('click', (e) => {
        if (e.target === elements.apiKeyModal) {
            closeApiKeyModal();
        }
    });
    
    // 搜索相关
    elements.searchBtn?.addEventListener('click', handleSearch);
    elements.searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // 重试按钮
    elements.retryBtn?.addEventListener('click', () => {
        if (lastKeyword) {
            performSearch(lastKeyword);
        }
    });
}

/**
 * 检查 API Key 状态
 */
function checkApiKey() {
    if (!storage.hasApiKey()) {
        setState(APP_STATE.NEEDS_API_KEY);
        showToast('💡 请先设置 News API Key', 'info');
        setTimeout(() => openApiKeyModal(), 1000);
    } else {
        setState(APP_STATE.IDLE);
        const maskedKey = storage.maskApiKey(storage.getApiKey());
        console.log('API Key已设置:', maskedKey);
    }
}

/**
 * 打开 API Key 设置模态框
 */
function openApiKeyModal() {
    elements.apiKeyModal?.classList.remove('hidden');
    
    // 如果已有 API Key，显示打码后的值
    if (storage.hasApiKey()) {
        elements.apiKeyInput.type = 'text';
        elements.apiKeyInput.value = storage.maskApiKey(storage.getApiKey());
        elements.apiKeyInput.type = 'password';
    }
    
    elements.apiKeyInput?.focus();
}

/**
 * 关闭 API Key 设置模态框
 */
function closeApiKeyModal() {
    elements.apiKeyModal?.classList.add('hidden');
    elements.apiKeyInput.value = '';
    elements.apiKeyInput.type = 'password';
}

/**
 * 切换 API Key 显示/隐藏
 */
function toggleApiKeyVisibility() {
    const input = elements.apiKeyInput;
    if (input.type === 'password') {
        input.type = 'text';
        elements.toggleApiKey.textContent = '🙈';
    } else {
        input.type = 'password';
        elements.toggleApiKey.textContent = '👁️';
    }
}

/**
 * 保存 API Key
 */
function handleSaveApiKey() {
    const key = elements.apiKeyInput.value.trim();
    
    if (!key) {
        showToast('⚠️ 请输入 API Key', 'error');
        return;
    }
    
    if (!storage.validateApiKey(key)) {
        showToast('⚠️ API Key 格式不正确', 'error');
        return;
    }
    
    if (storage.saveApiKey(key)) {
        showToast('✅ API Key 保存成功', 'success');
        closeApiKeyModal();
        setState(APP_STATE.IDLE);
    } else {
        showToast('❌ 保存失败，请重试', 'error');
    }
}

/**
 * 清除 API Key
 */
function handleClearApiKey() {
    if (confirm('确定要清除保存的 API Key 吗？')) {
        if (storage.clearApiKey()) {
            showToast('✅ API Key 已清除', 'success');
            elements.apiKeyInput.value = '';
            closeApiKeyModal();
            setState(APP_STATE.NEEDS_API_KEY);
        }
    }
}

/**
 * 处理搜索
 */
function handleSearch() {
    const keyword = elements.searchInput.value.trim();
    
    if (!keyword) {
        showToast('⚠️ 请输入搜索关键词', 'error');
        elements.searchInput.focus();
        return;
    }
    
    if (!storage.hasApiKey()) {
        showToast('⚠️ 请先设置 API Key', 'error');
        openApiKeyModal();
        return;
    }
    
    performSearch(keyword);
}

/**
 * 执行搜索
 * @param {string} keyword - 搜索关键词
 */
async function performSearch(keyword) {
    lastKeyword = keyword;
    setState(APP_STATE.LOADING);
    
    try {
        // 调用 API 获取新闻
        const result = await fetchNews(keyword, {
            hours: 24,
            pageSize: 10
        });
        
        if (result.status === 'error') {
            handleSearchError(result);
            return;
        }
        
        // 生成总结
        const summary = generateSummary(result.data.articles);
        
        // 显示结果
        displayResults(summary);
        setState(APP_STATE.SUCCESS);
        
    } catch (error) {
        console.error('Search error:', error);
        showError('未知错误，请稍后重试');
        setState(APP_STATE.ERROR);
    }
}

/**
 * 处理搜索错误
 * @param {Object} result - 错误结果
 */
function handleSearchError(result) {
    const errorMessages = {
        'API_KEY_MISSING': '请先设置 API Key',
        'API_KEY_INVALID': 'API Key 无效，请检查设置',
        'RATE_LIMIT_EXCEEDED': '今日请求次数已达上限（100次），请明天再试',
        'NO_RESULTS': '未找到相关资讯，试试其他关键词',
        'TIMEOUT': '请求超时，请稍后重试',
        'NETWORK_ERROR': '网络连接失败，请检查网络',
        'INVALID_KEYWORD': '请输入有效的搜索关键词'
    };
    
    const message = errorMessages[result.error] || result.message || '获取资讯失败';
    showError(message);
    setState(APP_STATE.ERROR);
    
    // 如果是 API Key 问题，打开设置
    if (result.error === 'API_KEY_INVALID' || result.error === 'API_KEY_MISSING') {
        setTimeout(() => openApiKeyModal(), 1500);
    }
}

/**
 * 显示结果
 * @param {Object} summary - 总结对象
 */
function displayResults(summary) {
    // 隐藏加载和错误
    hideLoading();
    hideError();
    
    // 显示结果容器
    elements.resultContainer?.classList.remove('hidden');
    
    // 渲染概述
    if (elements.overviewContent) {
        elements.overviewContent.textContent = summary.overview;
    }
    
    // 渲染关键要点
    renderKeyPoints(summary.keyPoints);
    
    // 渲染热门关键词
    renderKeywords(summary.topKeywords);
    
    // 渲染信息源
    renderSources(summary.sources);
    
    // 滚动到结果区域
    elements.resultContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 渲染关键要点
 * @param {Array} keyPoints - 要点数组
 */
function renderKeyPoints(keyPoints) {
    if (!elements.keypointsList) return;
    
    elements.keypointsList.innerHTML = '';
    
    if (!keyPoints || keyPoints.length === 0) {
        elements.keypointsList.innerHTML = '<li>暂无关键要点</li>';
        return;
    }
    
    keyPoints.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.point;
        elements.keypointsList.appendChild(li);
    });
}

/**
 * 渲染热门关键词
 * @param {Array} keywords - 关键词数组
 */
function renderKeywords(keywords) {
    if (!elements.keywordsContainer) return;
    
    elements.keywordsContainer.innerHTML = '';
    
    if (!keywords || keywords.length === 0) {
        elements.keywordsContainer.innerHTML = '<span>暂无关键词</span>';
        return;
    }
    
    keywords.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = `${item.word} (${item.frequency})`;
        elements.keywordsContainer.appendChild(tag);
    });
}

/**
 * 渲染信息源
 * @param {Array} sources - 信息源数组
 */
function renderSources(sources) {
    if (!elements.sourcesList) return;
    
    elements.sourcesList.innerHTML = '';
    
    if (!sources || sources.length === 0) {
        elements.sourcesList.innerHTML = '<p>暂无信息源</p>';
        return;
    }
    
    sources.forEach(source => {
        const card = createSourceCard(source);
        elements.sourcesList.appendChild(card);
    });
}

/**
 * 创建信息源卡片
 * @param {Object} source - 信息源对象
 * @returns {HTMLElement} 卡片元素
 */
function createSourceCard(source) {
    const card = document.createElement('div');
    card.className = 'source-card';
    
    const title = document.createElement('h3');
    title.className = 'source-title';
    title.textContent = source.title;
    
    const meta = document.createElement('div');
    meta.className = 'source-meta';
    meta.textContent = `${source.source} · ${formatRelativeTime(source.publishedAt)}`;
    
    const link = document.createElement('a');
    link.className = 'source-link';
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '阅读原文 →';
    
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(link);
    
    return card;
}

/**
 * 设置应用状态
 * @param {string} state - 状态
 */
function setState(state) {
    currentState = state;
    
    switch (state) {
        case APP_STATE.LOADING:
            showLoading();
            hideError();
            elements.searchBtn.disabled = true;
            break;
            
        case APP_STATE.IDLE:
        case APP_STATE.SUCCESS:
            hideLoading();
            hideError();
            elements.searchBtn.disabled = false;
            break;
            
        case APP_STATE.ERROR:
            hideLoading();
            elements.searchBtn.disabled = false;
            break;
            
        case APP_STATE.NEEDS_API_KEY:
            hideLoading();
            hideError();
            elements.searchBtn.disabled = false;
            break;
    }
}

/**
 * 显示加载状态
 */
function showLoading() {
    elements.loadingIndicator?.classList.remove('hidden');
    elements.resultContainer?.classList.add('hidden');
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    elements.loadingIndicator?.classList.add('hidden');
}

/**
 * 显示错误
 * @param {string} message - 错误消息
 */
function showError(message) {
    if (elements.errorText) {
        elements.errorText.textContent = message;
    }
    elements.errorMessage?.classList.remove('hidden');
    elements.retryBtn?.classList.remove('hidden');
    elements.resultContainer?.classList.add('hidden');
}

/**
 * 隐藏错误
 */
function hideError() {
    elements.errorMessage?.classList.add('hidden');
}

/**
 * 显示 Toast 通知
 * @param {string} message - 消息内容
 * @param {string} type - 类型 (success, error, info)
 */
function showToast(message, type = 'info') {
    if (!elements.toast) return;
    
    const iconMap = {
        success: '✅',
        error: '❌',
        info: '💡'
    };
    
    const icon = elements.toast.querySelector('.toast-icon');
    const messageEl = elements.toast.querySelector('.toast-message');
    
    if (icon) icon.textContent = iconMap[type] || iconMap.info;
    if (messageEl) messageEl.textContent = message;
    
    elements.toast.classList.remove('hidden');
    
    // 5秒后自动隐藏
    setTimeout(() => {
        elements.toast?.classList.add('hidden');
    }, 5000);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 导出供测试使用
export { init, performSearch, showToast };
