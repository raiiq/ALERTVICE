async function test() {
    console.log("Fetching local API API...");
    try {
        const res = await fetch('http://localhost:3000/api/news?limit=5&type=article');
        const data = await res.json();
        console.log("Posts count:", data.posts ? data.posts.length : 0);
        if (data.posts && data.posts.length > 0) {
            console.log("Sample imageUrl type:", typeof data.posts[0].imageUrl);
            console.log("Sample imageUrl value:", data.posts[0].imageUrl);
            console.log("Sample videoUrl type:", typeof data.posts[0].videoUrl);
            console.log("Sample videoUrl value:", data.posts[0].videoUrl);
        } else {
             console.log("No posts returned. Full response: ", data);
        }
    } catch(e) {
        console.error(e);
    }
}
test();
