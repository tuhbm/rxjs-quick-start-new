const $canvas = document.getElementById('draw');
const ctx = $canvas.getContext('2d');
const $color = document.getElementById('color');
const $size = document.getElementById('size');
const $clear = document.getElementById('clear');
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
$canvas.style.cursor = 'crosshair';

// function toPos(obs$) {
//     return obs$
//         .pipe(
//             map(v => v),
//             // tap(event => console.log(event))
//         );
// }

function drawLine(position) {
    const {positionX, positionY} = position;

    ctx.lineTo(positionX, positionY);
    ctx.stroke();

    // [lastX, lastY] = [positionX, positionY];
}

const start$ = fromEvent($canvas, EVENTS.start);
const move$ = fromEvent($canvas, EVENTS.move);
const end$ = fromEvent($canvas, EVENTS.end);
const color$ = fromEvent($color);
// const size$ = fromEvent(window, 'resize')
//     .pipe(
//         startWith(0),
//         map(event => $canvas.clientWidth)
//     );
const clear$ = fromEvent($clear, 'click');

// end$.subscribe(e => console.log('end$', e));
const drag$ = start$
    .pipe(
        switchMap(start => {
            return move$.pipe(
                // tap(move => console.log(move)),
                map(event => [event.layerX, event.layerY]),
                takeUntil(end$)
            )
        }),
        // tap(v => console.log('drag$', v)),
        /**
         * drag$이 두번씩 호출됨 => share 오퍼레이터 사용
         * */
        // share(),
        // mergeAll(position => position)
    );

// const drop$ = drag$
//     .pipe(
//         // map(drag => end$.pipe(take(1)))
//         /**
//          * first 오퍼레이터를 사용하면 자동 구독해제
//          * */
//
//         // map(drag => end$.pipe(first())),
//         // mergeAll()
//         /**
//          * map + mergeAll = mergeMap
//          * mergeMap + (자동 구독해제) = switchMap
//          */
//         // tap(v => console.log('drog$', v)),
//         switchMap(drag => {
//             return end$.pipe(
//                 /**
//                  * drag는 drag$가 전달하는 start$와 move$의 위치 값의 거리
//                  * */
//                 map(event => drag),
//                 first()
//             )
//         }),
//         withLatestFrom((drag) => {
//             return drag
//         })
//     );

const drawTool$ = drag$
    .pipe(
        map((store) => {
            const updateStore = {
                positionX: store[0],
                positionY : store[1]
            };
            return updateStore;
        }),
        tap((store) => {
            ctx.strokeStyle = $color.value;
            ctx.lineWidth = $size.value;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'square';

            ctx.beginPath();
            ctx.moveTo(store.positionX, store.positionY);
            return store
        })
    );

drawTool$.subscribe(store => {
    // console.log('캐러셀 데이터', store);

    // console.log('store', store);
    drawLine({positionX: store.positionX, positionY: store.positionY})
});

clear$.subscribe( event => {
    $canvas.getContext("2d").clearRect(0, 0, window.innerWidth/1.5,window.innerHeight/1.5)
});
