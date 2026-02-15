const fs = require('fs');
const path = require('path');
const googleTrends = require('google-trends-api');
const OpenAI = require('openai');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuration
const BLOG_DB_PATH = path.join(__dirname, '../data/blog-posts.json');
const TARGET_KEYWORDS = ['Amazon FBA', 'K-Beauty Export', 'Korea Cosmetic', 'Amazon Seller'];

// Initialize OpenAI (Lazy/Safe)
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} catch (e) {
    console.log('⚠️ OpenAI API Key missing. Automation disabled, but static generation available.');
}

async function getTrendingTopic() {
    try {
        console.log('🔍 Fetching Google Trends...');
        // In a real scenario, we might use google-trends-api to find related queries.
        // For stability in this demo, we'll pick a random topic from our high-value list 
        // and combine it with a current year trend.
        const baseKeyword = TARGET_KEYWORDS[Math.floor(Math.random() * TARGET_KEYWORDS.length)];
        return `${baseKeyword} trends 2026`;
    } catch (error) {
        console.error('Error fetching trends:', error);
        return 'Amazon FBA Success Strategies 2026'; // Fallback
    }
}

async function generateBlogPost(topic) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not found in .env');
    }

    console.log(`🤖 Generating content for: ${topic}...`);

    const prompt = `
    Write a comprehensive, SEO-optimized blog post about "${topic}" for a Korean B2B audience (K-Brand owners wanting to export to US via Amazon).
    
    Requirements:
    1. Language: Korean (Business professional tone).
    2. Format: HTML (just the body content, no <html> or <body> tags). Use <h2>, <h3>, <p>, <ul>, <li>.
    3. Length: ~1500 words (deep dive).
    4. Content:
       - Introduction: Why this topic matters now (2026 context).
       - Key Trends/Data.
       - Actionable strategies for K-Brands.
       - How 'NextGate' (our service) can help (subtle promotion).
       - Conclusion.
    5. SEO: Include long-tail keywords naturally.
    
    Also return a JSON object with:
    - title: Catchy SEO title
    - slug: URL-friendly-slug-english
    - metaDescription: 150 chars meta description
    - keywords: comma separated keywords
    
    Output format: JSON only.
    {
      "title": "...",
      "slug": "...",
      "metaDescription": "...",
      "keywords": "...",
      "content": "HTML string..."
    }
    `;

    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are an expert SEO content writer." }, { role: "user", content: prompt }],
        model: "gpt-4-turbo-preview",
        response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content);
}

// ... (imports remain)

// HTML Generation Helpers
function generateStaticFiles(posts) {
    const listTemplatePath = path.join(__dirname, '../../frontend/blog-list.html');
    const postTemplatePath = path.join(__dirname, '../../frontend/blog-post.html');
    const outputDir = path.join(__dirname, '../../frontend/blog');

    if (!fs.existsSync(listTemplatePath) || !fs.existsSync(postTemplatePath)) {
        console.error('❌ Templates not found. Skipping static generation.');
        return;
    }

    const listTemplate = fs.readFileSync(listTemplatePath, 'utf8');
    const postTemplate = fs.readFileSync(postTemplatePath, 'utf8');

    // 1. Generate Individual Post Pages
    posts.forEach(post => {
        let html = postTemplate
            .replace(/{{TITLE}}/g, post.title)
            .replace(/{{DESCRIPTION}}/g, post.metaDescription)
            .replace(/{{KEYWORDS}}/g, post.keywords)
            .replace(/{{SLUG}}/g, post.slug)
            .replace(/{{PUBLISHED_AT}}/g, post.publishedAt)
            .replace(/{{PUBLISHED_DATE}}/g, new Date(post.publishedAt).toLocaleDateString())
            .replace('{{CONTENT}}', post.content)
            // Fix relative paths for static hosting in subdirectory
            .replace(/href="\/"/g, 'href="../"')
            .replace(/href="\/styles.css"/g, 'href="../styles.css"')
            .replace(/href="\/blog"/g, 'href="./index.html"');

        fs.writeFileSync(path.join(outputDir, `${post.slug}.html`), html);
    });

    // 2. Generate Blog Index Page
    const listItems = posts.map(post => `
        <article class="blog-card">
            <div class="blog-card-body">
                <span class="blog-date">${new Date(post.publishedAt).toLocaleDateString()}</span>
                <h3><a href="./${post.slug}.html" class="read-more">${post.title}</a></h3>
                <p>${post.metaDescription || post.content.substring(0, 150)}...</p>
                <a href="./${post.slug}.html" class="read-more">Read Article →</a>
            </div>
        </article>
    `).join('');

    const indexHtml = listTemplate
        .replace('{{BLOG_LIST_ITEMS}}', listItems)
        // Fix relative paths
        .replace(/href="\/"/g, 'href="../"')
        .replace(/href="\/styles.css"/g, 'href="../styles.css"')
        .replace(/href="\/blog"/g, 'href="./index.html"');

    fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
    console.log('✅ Static HTML files generated in frontend/blog/');
}

async function savePost(post) {
    let posts = [];
    if (fs.existsSync(BLOG_DB_PATH)) {
        posts = JSON.parse(fs.readFileSync(BLOG_DB_PATH, 'utf8'));
    }

    const newPost = {
        id: Date.now().toString(),
        ...post,
        publishedAt: new Date().toISOString(),
        views: 0
    };

    posts.unshift(newPost); // Add to top
    fs.writeFileSync(BLOG_DB_PATH, JSON.stringify(posts, null, 2));
    console.log(`✅ Saved post to JSON: ${newPost.title}`);

    // Generate Static HTML
    generateStaticFiles(posts);

    return newPost;
}

// ... (main and exports remain)

async function main() {
    try {
        // If run with --regenerate flag, just rebuild HTML from JSON
        if (process.argv.includes('--regenerate')) {
            console.log('🔄 Regenerating static files from existing JSON...');
            if (fs.existsSync(BLOG_DB_PATH)) {
                const posts = JSON.parse(fs.readFileSync(BLOG_DB_PATH, 'utf8'));
                generateStaticFiles(posts);
            } else {
                console.log('⚠️ No blog-posts.json found.');
            }
            return;
        }

        // Check if OpenAI API Key is present
        if (!process.env.OPENAI_API_KEY) {
            console.log('⚠️ OPENAI_API_KEY not found. Skipping new post generation.');
            console.log('🔄 Regenerating static files from existing data instead...');
            if (fs.existsSync(BLOG_DB_PATH)) {
                const posts = JSON.parse(fs.readFileSync(BLOG_DB_PATH, 'utf8'));
                generateStaticFiles(posts);
            } else {
                console.log('⚠️ No blog-posts.json found. Nothing to generate.');
            }
            return;
        }

        const topic = await getTrendingTopic();
        const post = await generateBlogPost(topic);
        await savePost(post);
    } catch (error) {
        console.error('❌ Failed to generate blog post:', error);
        // Ensure static files are at least attempted to be rebuilt even if generation fails
        if (fs.existsSync(BLOG_DB_PATH)) {
            console.log('🔄 Attempting to regenerate static files from existing data...');
            const posts = JSON.parse(fs.readFileSync(BLOG_DB_PATH, 'utf8'));
            generateStaticFiles(posts);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = { main };
