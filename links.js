document.querySelectorAll(".navigation>ul>*")
.forEach(e => (e.nodeName == 'LI')
    && e.addEventListener("click", () =>
        (e.attributes.not_url
        && navigator.clipboard.writeText(e.attributes.hover.value))
        || window.open("https://"+e.attributes.hover.value, "_blank")
    )
);



// document.querySelectorAll(".navigation>ul>*")
// .forEach(e => (e.nodeName == 'LI') && e.attributes.not_url
//     && e.addEventListener("click", () =>
//         navigator.clipboard.writeText(e.attributes.hover.value)));