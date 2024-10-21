const { promises: fs } = require('fs');
const path = require('path');

async function fetchTopPostsFromReddit() {
    try {
        const response = await fetch('https://www.reddit.com/r/CybersecurityMemes/top/.json');
        if (!response.ok) throw new Error(`Failed to fetch Reddit posts: ${response.statusText}`);
        
        const json = await response.json();
        return json.data?.children?.map(({ data }) => data) || [];
    } catch (error) {
        console.error("Error fetching Reddit posts:", error);
        return [];
    }
}

function filterPostsWithImages(posts) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    return posts.filter(({ url }) => imageExtensions.some(ext => url.includes(ext)));
}

function findTopPost(posts) {
    return posts.reduce((top, current) => current.score > top.score ? current : top, posts[0]);
}

async function generateReadme(topPost) {
    try {
        const templatePath = path.resolve(process.cwd(), './README.template.md');
        const readmeTemplate = (await fs.readFile(templatePath)).toString('utf-8');

        const readmeContent = readmeTemplate
            .replace(/{templ_title}/g, topPost.title || 'Top Post')
            .replace(/{templ_image}/g, topPost.url || '');

        await fs.writeFile('README.md', readmeContent);
        console.log("README.md has been successfully generated!");
    } catch (error) {
        console.error("Error generating README.md:", error);
    }
}

async function main() {
    console.log("Fetching top Reddit posts...");
    const posts = await fetchTopPostsFromReddit();

    if (posts.length === 0) {
        console.log("No posts retrieved from Reddit.");
        return;
    }

    console.log("Filtering posts with images...");
    const postsWithImages = filterPostsWithImages(posts);

    if (postsWithImages.length === 0) {
        console.log("No posts with valid images found.");
        return;
    }

    console.log("Finding the top post...");
    const topPost = findTopPost(postsWithImages);

    if (!topPost) {
        console.log("No top post found.");
        return;
    }

    console.log("Generating README.md...");
    await generateReadme(topPost);
}

main().catch((error) => console.error("Error in main function:", error));
