
async function testApi() {
    const urls = [
        "http://localhost:3000/api/news?lang=ar&limit=10&type=signal",
        "http://localhost:3000/api/news?lang=en&limit=10&type=signal"
    ];

    for (const url of urls) {
        console.log(`\nFetching: ${url}`);
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log(`Status: OK, Posts: ${data.posts?.length || 0}`);
                if (data.posts && data.posts.length > 0) {
                    console.log("First Post Sample:", {
                        id: data.posts[0].id,
                        aiTitle: data.posts[0].aiTitle,
                        aiSummary: data.posts[0].aiSummary
                    });
                }
            } else {
                console.error(`Status: ${res.status}`);
            }
        } catch (e) {
            console.error("Fetch failed (is server running?):", e.message);
        }
    }
}

testApi();
