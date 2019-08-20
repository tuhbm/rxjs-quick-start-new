const { Observable } = rxjs;
const socket = new WebSocket("ws://someUrl");
const hotWebsocket$ = new Observable(function subscribe(observer) {
   const handler = e => observer.next(e);
   socket.addEventListener("message", handler);
   return socket.removeEventListener("message", handler);
});