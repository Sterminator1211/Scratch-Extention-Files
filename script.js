const grid = document.getElementById("extensionGrid");
const search = document.getElementById("search");

let extensions = [];

async function loadExtensions() {

    grid.innerHTML =
        "<div class='loading'>Loading...</div>";

    const response = await fetch("/api/extensions");

    extensions = await response.json();

    render(extensions);

}

function render(list) {

    if (list.length === 0) {

        grid.innerHTML = `
        <div class="loading">
            No extensions found.
        </div>
        `;

        return;

    }

    grid.innerHTML = "";

    for (const ext of list) {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <img
                class="icon"
                src="${ext.icon}"
                alt="${ext.name}"
            >

            <div class="content">

                <h2>${ext.name}</h2>

                <p>${ext.description}</p>

                <div class="meta">

                    <span>${ext.version}</span>

                    <span>${ext.author}</span>

                </div>

                <a
                    class="download"
                    href="${ext.script}"
                    download
                >
                    Download
                </a>

            </div>

        `;

        grid.appendChild(card);

    }

}

search.addEventListener("input", () => {

    const value = search.value.toLowerCase();

    render(

        extensions.filter(ext =>

            ext.name.toLowerCase().includes(value) ||

            ext.description.toLowerCase().includes(value) ||

            ext.author.toLowerCase().includes(value)

        )

    );

});

loadExtensions();
