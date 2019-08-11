const $canvas = document.getElementById('draw');
const ctx = $canvas.getContext('2d');
$canvas.width = window.innerWidth;
$canvas.height = window.innerHeight/1.5;

const $color = document.getElementById('color');
const $size = document.getElementById('size');
const EVENTS = {
    start: 'mousedown',
    move: 'mousemove',
    end: 'mouseup'
};
const { fromEvent, merge } = rxjs;
const { map, switchMap, takeUntil, mergeAll, take, first, startWith, withLatestFrom, tap, share, scan } = rxjs.operators;

function toPos(obs$) {
    return obs$
        .pipe(
            tap(event => console.log(event)),
            map(v => v.pageX)
        );
}

function drawLine(event, startPosition, endPosition) {
    console.log('startPosition', startPosition);
    console.log('endPosition', endPosition);
    ctx.beginPath();
    ctx.moveTo(startPosition, endPosition);
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();

    [lastX, lastY] = [event.offsetX, event.offsetY];
}

const start$ = fromEvent($canvas, EVENTS.start).pipe(toPos);
const move$ = fromEvent($canvas, EVENTS.move).pipe(toPos);
const end$ = fromEvent($canvas, EVENTS.end).pipe(toPos);
const size$ = fromEvent(window, 'resize')
    .pipe(
        startWith(0),
        map(event => $canvas.clientWidth)
    );

// end$.subscribe(e => console.log('end$', e));
const drag$ = start$
    .pipe(
        switchMap(start => {
            return move$.pipe(
                map(move => move - start),
                tap(event => console.log('event', event)),
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

const drawTool$ = merge(drag$, drop$)
    .pipe(
        scan((store, {distance, size}) => {
            const updateStore = {
                from: -(store.index * store.size) + distance
            };

            if(size === undefined) {
                updateStore.to = updateStore.from
            } else {
                let tobeIndex = store.index;

                updateStore.index = tobeIndex;
                updateStore.to = -(tobeIndex * size);
                updateStore.size = size;
            }
            console.log(ctx);
            ctx.strokeStyle = $color.value;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = $size.value;
            return {...store, ...updateStore};
        }, {
            from: 0,
            to: 0,
            index: 0,
            size: 0
        })
    );

drawTool$.subscribe(store => {
    console.log('캐러셀 데이터', this);

    drawLine(this, store.from, store.to)
});