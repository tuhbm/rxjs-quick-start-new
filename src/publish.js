const { interval } = rxjs;
const { publish, refCount } = rxjs.operators;
const number$ = interval(1000);
const connectable$ = number$
    .pipe(
        publish(),
        refCount()
    );

let connectSub, sub1, sub2;

sub1 = connectable$.subscribe(v => console.log(`observerA: ${v}`));
// connectSub = connectable$.connect();

setTimeout(() => {
    // sub1.unsubscribe();
    sub2 = connectable$.subscribe(v => console.log(`observerB: ${v}`));
}, 1100);

setTimeout(() => {
    console.log('observerA is unsubscribed');
    sub1.unsubscribe();
}, 2100);

setTimeout(() => {
    console.log('observerB is unsubscribed');
    sub2.unsubscribe();
    console.log('connectabelObservable is unsubscribed');

    connectSub.unsubscribe(); // number$의 전송 중지
}, 3100);