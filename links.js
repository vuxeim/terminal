document.querySelectorAll(".navigation>ul>*").forEach(e => (e.nodeName == 'LI') && e.addEventListener("click", () => navigator.clipboard.writeText(e.attributes.hover.value)));