// Set to false for development
const force = true;

if (!(location.hostname == "localhost") || force) {
    navigator.serviceWorker.register('/sw.js', { scope: '/'});
}