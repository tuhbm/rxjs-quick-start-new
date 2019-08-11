const $canvas = document.getElementById('draw');
const ctx = $canvas.getContext('2d');
const $color = document.getElementById('color');
const $size = document.getElementById('size');
const EVENTS = {
    start: 'mousedown',
    move: 'mousemove',
    end: 'mouseup'
};
const { fromEvent, merge } = rxjs;
const { map, switchMap, takeUntil, mergeAll, take, first, startWith, withLatestFrom, tap, share, scan } = rxjs.operators;

$canvas.width = window.innerWidth/1.5;
$canvas.height = window.innerHeight/1.5;
$canvas.style.border = '1px solid #000';

function toPos(obs$) {
    return obs$
        .pipe(
            map(v => v),
            // tap(event => console.log(event))
        );
}

function drawLine(startPosition, endPosition) {
    ctx.beginPath();
    ctx.moveTo(startPosition, endPosition);
    ctx.lineTo(startPosition, endPosition);
    ctx.stroke();

    [lastX, lastY] = [startPosition, endPosition];
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
                tap(move => console.log(move)),
                map(event => [event.pageX, event.pageY]),
                takeUntil(end$)
            )
        }),
        // tap(v => console.log('drag$', v)),
        /**
         * drag$이 두번씩 호출됨 => share 오퍼레이터 사용
         * */
        share(),
        tap(distance => console.log(distance)),
        mergeAll(position => position)
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
        scan((store, distance) => {
            console.log(distance);
            const updateStore = {
                from: distance[0]
            };
            console.log(updateStore);

            if(size === undefined) {
                updateStore.to = updateStore.from
            } else {
                updateStore.to = distance[1];
                updateStore.size = size;
            }
            ctx.strokeStyle = $color.value;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = $size.value;
            return {...store, ...updateStore};
        }, {
            from: 0,
            to: 0
        })
    );

drawTool$.subscribe(store => {
    console.log('캐러셀 데이터', store);
    drawLine(store.from, store.to)
});