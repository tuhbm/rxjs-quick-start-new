const $view = document.getElementById('carousel');
const $container = $view.querySelector('.container');
const PANEL_COUNT = $container.querySelectorAll('.panel').length;
const SUPPORT_TOUCH = 'ontouchstart' in window;
const EVENTS = {
    start: SUPPORT_TOUCH ? 'touchstart' : 'mousedown',
    move: SUPPORT_TOUCH ? 'touchmove' : 'mousemove',
    end: SUPPORT_TOUCH ? 'touchend' : 'mouseup'
};
const THRESHOLD = 200; // drag - drop 임계치값
const { fromEvent, merge } = rxjs;
const { map, switchMap, takeUntil, mergeAll, take, first, startWith, withLatestFrom, tap, share, scan } = rxjs.operators;

function toPos(obs$) {
    return obs$
    .pipe(
        map(v => SUPPORT_TOUCH ? v.changedTouches[0].pageX : v.pageX)
    );
}

function tanslateX(posX) {
    $container.style.transform = `translate3d(${posX}px, 0, 0)`;
}

const start$ = fromEvent($view, EVENTS.start).pipe(toPos);
const move$ = fromEvent($view, EVENTS.move).pipe(toPos);
const end$ = fromEvent($view, EVENTS.end).pipe(toPos);
const size$ = fromEvent(window, 'resize')
.pipe(
    startWith(0),
    map(event => $view.clientWidth)
);

const drag$ = start$
.pipe(
    switchMap(start => {
        return move$.pipe(
            map(move => move - start),
            takeUntil(end$)
        )
    }),
    // tap(v => console.log('drag$', v)),
    /**
     * drag$이 두번씩 호출됨 => share 오퍼레이터 사용
     * */
    share(),
    map(distance => ({distance}))
);

const drop$ = drag$
.pipe(
    // map(drag => end$.pipe(take(1)))
    /**
     * first 오퍼레이터를 사용하면 자동 구독해제
     * */
    
    // map(drag => end$.pipe(first())),
    // mergeAll()
    /**
     * map + mergeAll = mergeMap
     * mergeMap + (자동 구독해제) = switchMap
     */
    // tap(v => console.log('drog$', v)),
    switchMap(drag => {
        return end$.pipe(
            /**
             * drag는 drag$가 전달하는 start$와 move$의 위치 값의 거리
             * */
            map(event => drag),
            first()
        )
    }),
    withLatestFrom(size$, (drag, size) => {
        return {...drag, size}
    })
);

// size$.subscribe(width => console.log('widow resize 후 width 값', width));
// drop$.subscribe(array => console.log('drop', array));
// drag$.subscribe(distance => console.log('start$와 move$의 차이값', distance));

const carousel$ = merge(drag$, drop$)
.pipe(
    scan((store, {distance, size}) => {
        const updateStore = {
            from: -(store.index * store.size) + distance
        };
        
        if(size === undefined) {
            updateStore.to = updateStore.from
        } else {
            let tobeIndex = store.index;
            if(Math.abs(distance) >= THRESHOLD) {
                tobeIndex = distance < 0 ?
                    Math.min(tobeIndex + 1, PANEL_COUNT - 1) :
                    Math.max(tobeIndex - 1, 0);
            }
            updateStore.index = tobeIndex;
            updateStore.to = -(tobeIndex * size);
            updateStore.size = size;
        }
        
        return {...store, ...updateStore};
    }, {
        from: 0,
        to: 0,
        index: 0,
        size: 0
    })
);

carousel$.subscribe(store => {
    console.log('캐러셀 데이터', store);
    tanslateX(store.to);
});
