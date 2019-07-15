const { fromEvent } = rxjs;
const { map, mergeMap, debounceTime, filter, distinctUntilChanged, tap } = rxjs.operators;
const { ajax } = rxjs.ajax;

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

const keyup$ = fromEvent(document.getElementById("search"), "keyup").pipe(
    debounceTime(300),
    map(event => event.target.value),
    distinctUntilChanged()
);

const user$ = keyup$.pipe(
    filter(query => {
        console.log("user$");
        return query.trim().length > 0;
    }),
    tap(showLoading),
    mergeMap(query => {
        return ajax.getJSON(`https://api.github.com/search/users?q=${query}`);
    }),
    tap(hideLoading)
);

const reset$ = keyup$.pipe(
    filter(query => {
        console.log("reset$");
        return query.trim().length === 0;
    }),
    tap(v => ($layer.innerHTML = ""))
);

reset$.subscribe();

user$.subscribe(v => {
    drawLayer(v.items);
});
