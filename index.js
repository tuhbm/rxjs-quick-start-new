const { BehaviorSubject, ReplaySubject, AsyncSubject } = rxjs;

// const subject = new BehaviorSubject('start');
// const subject = new ReplaySubject(2);
const subject = new AsyncSubject();
subject.subscribe({
    next: (v) => console.log(`observerA: ${v}`),
    complete: () => console.log('observerA: completed')
});

subject.next(1);
subject.next(2);
subject.next(3);
subject.next(4);

subject.subscribe({
    next: (v) => console.log(`observerB: ${v}`),
    complete: () => console.log('observerB: completed')
});

subject.complete();

setTimeout(() => {
    subject.subscribe({
        next: (v) => console.log(`observerC: ${v}`),
        complete: () => console.log('observerC: completed')
    });
}, 2000);



