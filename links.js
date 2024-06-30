document.querySelectorAll(".navigation>ul>*").forEach((e) => (e.nodeName == 'LI')
    && e.addEventListener("click", () =>
        (
            e.attributes.not_url
            && navigator.clipboard.writeText(e.attributes.hover.value)
            && (tmp = e.attributes.hover.value)
            && (e.attributes.hover.value = 'Copied to clipboard!')
            && setTimeout(() => { e.attributes.hover.value = tmp }, 1000)
        ) || (
            !e.attributes.not_url
            && window.open("https://"+e.attributes.hover.value, "_blank")
        )
    )
)

