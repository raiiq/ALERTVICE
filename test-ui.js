async function test() {
    try {
        const signalRes = await fetch("http://localhost:3000/api/news?lang=en&limit=5&type=signal");
        const signals = await signalRes.json();
        console.log("Signals count:", signals.posts ? signals.posts.length : 0);

        const articleRes = await fetch("http://localhost:3000/api/news?lang=en&limit=5&type=article");
        const articles = await articleRes.json();
        console.log("Articles count:", articles.posts ? articles.posts.length : 0);

    } catch (e) {
        console.error("Fetch failed", e);
    }
}
test();
