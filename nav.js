fetch('nav.html')
.then(res => res.text())
.then(text => {
    let oldelem = document.querySelector("body script#navBar");
    let newelem = document.createElement("div");
    newelem.innerHTML = text;
    oldelem.parentNode.replaceChild(newelem,oldelem);
}).then(() => {
    const currentUrl = window.location.href;
    const links = document.querySelectorAll("body div nav a");
    links.forEach((link) => {
        if (currentUrl === link.href) {
            link.style.backgroundColor = "#7a0c50";
        }
    })
})

