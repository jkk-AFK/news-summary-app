/**
 * 总结引擎模块
 * 负责分析和总结新闻文章
 */

/**
 * 中文停用词列表
 */
const STOP_WORDS = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很',
    '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '他', '她',
    '中', '为', '与', '及', '等', '但', '而', '或', '因', '于', '由', '从', '以', '被', '将',
    '可以', '对', '还', '里', '来', '多', '之', '已', '已经', '就是', '这个', '那个', '什么',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
]);

/**
 * 生成新闻总结
 * @param {Array} articles - 文章数组
 * @returns {Object} 总结对象 { overview, keyPoints, topKeywords, sources, timestamp }
 */
export function generateSummary(articles) {
    if (!articles || articles.length === 0) {
        return {
            overview: '暂无数据',
            keyPoints: [],
            topKeywords: [],
            sources: [],
            timestamp: new Date().toISOString()
        };
    }

    try {
        // 1. 提取所有文本内容
        const allText = extractAllText(articles);
        
        // 2. 提取关键词并计算频率
        const wordFrequency = extractKeywords(allText);
        
        // 3. 获取热门关键词（Top 10）
        const topKeywords = getTopKeywords(wordFrequency, 10);
        
        // 4. 生成概述
        const overview = generateOverview(articles, topKeywords);
        
        // 5. 提取关键要点
        const keyPoints = extractKeyPoints(articles, topKeywords);
        
        // 6. 构建信息源列表
        const sources = formatSources(articles);
        
        return {
            overview,
            keyPoints,
            topKeywords,
            sources,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Generate summary error:', error);
        return {
            overview: '总结生成失败',
            keyPoints: [],
            topKeywords: [],
            sources: formatSources(articles),
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * 提取所有文本内容
 * @param {Array} articles - 文章数组
 * @returns {Object} { titles, descriptions, contents }
 */
function extractAllText(articles) {
    const titles = [];
    const descriptions = [];
    const contents = [];

    articles.forEach(article => {
        if (article.title) titles.push(article.title);
        if (article.description) descriptions.push(article.description);
        if (article.content) contents.push(article.content);
    });

    return {
        titles: titles.join(' '),
        descriptions: descriptions.join(' '),
        contents: contents.join(' ')
    };
}

/**
 * 提取关键词并计算频率
 * @param {Object} allText - 所有文本对象
 * @returns {Map} 词频Map
 */
function extractKeywords(allText) {
    const wordFrequency = new Map();

    // 处理标题（权重3倍）
    processText(allText.titles, wordFrequency, 3);
    
    // 处理描述（权重2倍）
    processText(allText.descriptions, wordFrequency, 2);
    
    // 处理内容（权重1倍）
    processText(allText.contents, wordFrequency, 1);

    return wordFrequency;
}

/**
 * 处理文本并更新词频
 * @param {string} text - 文本
 * @param {Map} wordFrequency - 词频Map
 * @param {number} weight - 权重
 */
function processText(text, wordFrequency, weight) {
    if (!text) return;

    // 分词：支持中英文
    const words = tokenize(text);

    words.forEach(word => {
        // 过滤停用词和短词
        if (STOP_WORDS.has(word.toLowerCase()) || word.length < 2) {
            return;
        }

        const normalizedWord = word.toLowerCase();
        const currentCount = wordFrequency.get(normalizedWord) || 0;
        wordFrequency.set(normalizedWord, currentCount + weight);
    });
}

/**
 * 分词函数（简单版）
 * @param {string} text - 文本
 * @returns {Array} 词数组
 */
function tokenize(text) {
    // 匹配中文字符、英文单词、数字
    const regex = /[\u4e00-\u9fa5]+|[a-zA-Z]+|[0-9]+/g;
    const matches = text.match(regex);
    
    if (!matches) return [];

    // 对中文进行简单的二元分词
    const words = [];
    matches.forEach(match => {
        if (/[\u4e00-\u9fa5]/.test(match)) {
            // 中文：提取2-4字词组
            if (match.length >= 2) {
                // 提取2字词
                for (let i = 0; i < match.length - 1; i++) {
                    words.push(match.substr(i, 2));
                }
                // 提取3字词
                if (match.length >= 3) {
                    for (let i = 0; i < match.length - 2; i++) {
                        words.push(match.substr(i, 3));
                    }
                }
                // 提取4字词
                if (match.length >= 4) {
                    for (let i = 0; i < match.length - 3; i++) {
                        words.push(match.substr(i, 4));
                    }
                }
            }
        } else {
            // 英文和数字
            words.push(match);
        }
    });

    return words;
}

/**
 * 获取热门关键词
 * @param {Map} wordFrequency - 词频Map
 * @param {number} count - 返回数量
 * @returns {Array} 关键词数组
 */
function getTopKeywords(wordFrequency, count) {
    // 转换为数组并排序
    const sorted = Array.from(wordFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count);

    return sorted.map(([word, frequency]) => ({
        word,
        frequency
    }));
}

/**
 * 生成概述
 * @param {Array} articles - 文章数组
 * @param {Array} topKeywords - 热门关键词
 * @returns {string} 概述文本
 */
function generateOverview(articles, topKeywords) {
    const totalArticles = articles.length;
    
    // 提取最热门的3个关键词
    const hotWords = topKeywords.slice(0, 3).map(k => k.word).join('、');
    
    // 获取最新文章的时间
    const latestDate = articles[0]?.publishedAt;
    const timeDesc = latestDate ? getTimeDescription(latestDate) : '最近';
    
    // 生成概述
    let overview = `根据${totalArticles}条${timeDesc}的最新资讯分析，`;
    
    if (hotWords) {
        overview += `当前热点主要集中在${hotWords}等方面。`;
    }
    
    // 添加内容概括
    const firstArticle = articles[0];
    if (firstArticle && firstArticle.description) {
        const desc = firstArticle.description.substring(0, 100);
        overview += ` ${desc}${firstArticle.description.length > 100 ? '...' : ''}`;
    }

    return overview;
}

/**
 * 提取关键要点
 * @param {Array} articles - 文章数组
 * @param {Array} topKeywords - 热门关键词
 * @returns {Array} 要点数组
 */
function extractKeyPoints(articles, topKeywords) {
    const keyPoints = [];
    const keywordSet = new Set(topKeywords.map(k => k.word));

    // 按时间排序（最新优先）
    const sortedArticles = [...articles].sort((a, b) => {
        return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    // 选择最具代表性的3-5条
    const maxPoints = Math.min(5, sortedArticles.length);
    const selectedArticles = [];

    for (const article of sortedArticles) {
        if (selectedArticles.length >= maxPoints) break;

        // 检查标题是否包含热门关键词
        const title = article.title.toLowerCase();
        const hasKeyword = Array.from(keywordSet).some(keyword => 
            title.includes(keyword.toLowerCase())
        );

        if (hasKeyword || selectedArticles.length < 3) {
            // 避免重复
            const isDuplicate = selectedArticles.some(selected => 
                similarity(selected.title, article.title) > 0.6
            );

            if (!isDuplicate) {
                selectedArticles.push(article);
            }
        }
    }

    // 生成要点
    selectedArticles.forEach((article, index) => {
        const point = formatKeyPoint(article, index + 1);
        if (point) {
            keyPoints.push({
                point,
                importance: selectedArticles.length - index // 重要度递减
            });
        }
    });

    return keyPoints;
}

/**
 * 格式化关键要点
 * @param {Object} article - 文章对象
 * @param {number} index - 序号
 * @returns {string} 格式化后的要点
 */
function formatKeyPoint(article, index) {
    const title = article.title;
    const desc = article.description ? article.description.substring(0, 80) : '';
    
    let point = title;
    if (desc && desc !== title) {
        point += `。${desc}${article.description.length > 80 ? '...' : ''}`;
    }

    // 限制长度
    if (point.length > 150) {
        point = point.substring(0, 150) + '...';
    }

    return point;
}

/**
 * 格式化信息源列表
 * @param {Array} articles - 文章数组
 * @returns {Array} 信息源数组
 */
function formatSources(articles) {
    return articles.map(article => ({
        title: article.title,
        source: article.source.name,
        url: article.url,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage
    }));
}

/**
 * 获取时间描述
 * @param {string} dateString - ISO时间字符串
 * @returns {string} 时间描述
 */
function getTimeDescription(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffHours < 1) return '1小时内';
        if (diffHours < 6) return '6小时内';
        if (diffHours < 12) return '12小时内';
        if (diffHours < 24) return '24小时内';
        return '近期';
    } catch {
        return '最近';
    }
}

/**
 * 计算文本相似度（简单版）
 * @param {string} text1 - 文本1
 * @param {string} text2 - 文本2
 * @returns {number} 相似度 0-1
 */
function similarity(text1, text2) {
    if (!text1 || !text2) return 0;

    const words1 = new Set(tokenize(text1.toLowerCase()));
    const words2 = new Set(tokenize(text2.toLowerCase()));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}
