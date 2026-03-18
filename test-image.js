async function testImage() {
    const url = "https://cdn4.telesco.pe/file/DeEPpsF9Hya56IW-oL7Xaj0mYFWcxssFSmBxy2CQo-Wu5VxNUBVxr61v29v4BgwyNMVZQ8CFA6UpC-DHRnLOxWsnfatl1j982Yf3YJ9PNmkb9cPRtvhG3eNFonJtEzHRTUXfm9t6WFxzY_7alNAVDcqmgeE0wSDA9YaQX9LmeFyUclmvH6QYV2B6jBxt22G88PxArNc8ezjz0Pr-BH1-6XaHBxaYcjl1YxNHb3fgMymSAqUeDsQKSapiSSQrHf6R7pScN6f8hecnT8VUIzF4S1rQmzqFr-c87iIvMQwzNxkuM04xjZjA9KqjjAd_Irh-nqZsG-61o9BMJJiWaLfAWQ";
    const res = await fetch(url);
    console.log("Status: ", res.status);
    console.log("Headers: ", res.headers);
}
testImage();
