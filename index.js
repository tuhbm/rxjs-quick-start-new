const {fromEvent, Subject, Observable } = rxjs;
const {map, switchMap, debounceTime, share, distinctUntilChanged, tap, partition, retry, finalize} = rxjs.operators; //catchError, multicast, publish, refCount
const {ajax} = rxjs.ajax;

const $layer = document.getElementById("suggestLayer");
const $loading = document.getElementById("loading");

function showLoading() {
    $loading.style.display = "block";
}

function hideLoading() {
    $loading.style.display = "none";
}

function drawLayer(items) {
    $layer.innerHTML = items
        .map(user => {
            return `<li class="user">
        <img src="${user.avatar_url}" width="50px" width="50px"/>
        <p><a href="${user.html_url}" target="_blank">${user.login}</a></p>
      </li>`;
        })
        .join("");
}


const keyup$ = fromEvent(document.getElementById("search"), "keyup")
    .pipe(
        debounceTime(300),
        map(event => event.target.value),
        distinctUntilChanged(),
        tap(v => console.log("from keyup$", v)),
        // multicast(new Subject())
        // publish(),
        // refCount()
        share()
    );

let [user$, reset$] = keyup$
    .pipe(
        partition(query => query.trim().length > 0)
    );

user$ = user$.pipe(
    tap(showLoading),
    switchMap(query => {
        return ajax.getJSON(`https://api.github.com/search/users?q=${query}`);
    }),
    tap(hideLoading),
    retry(2),
    // finalize(hideLoading)
    // catchError((e, orgObservable) => {
    //     console.log("서버 에러가 발생하였으나 다시 호출하도록 처리", e.message);
    //     return orgObservable;
    // })
    finalize(hideLoading),
    tap(v => console.log("from user$", v))
);

reset$
    .pipe(
        tap(v => ($layer.innerHTML = "")),
        tap(v => console.log("from reset$", v))
    ).subscribe();

user$.subscribe({
    next: v => drawLayer(v.items),
    error: e => {
        console.error(e);
        alert(e.message);
    }
});

reset$.subscribe();

// subject에서 user$와 reset$를 생성 후, subject가 keyup$을 구

// keyup$.connect();