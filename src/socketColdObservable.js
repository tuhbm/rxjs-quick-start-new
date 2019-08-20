const { Observable } = rxjs;
const coldWebsocket$ = new Observable(function subscribe(obserber) {
    const socket = new WebSocket("ws:someUrl");
    const handler = e => obserber.next(e);
    socket.addEventListener("message", handler);
    return () => socket.close();
});