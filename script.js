const grid = document.getElementById("extensionGrid");
const search = document.getElementById("search");

let extensions = [];


/*
 * Load extensions from the Vercel API
 */

async function loadExtensions() {

    grid.innerHTML = `
        <div class="loading">
            Loading extensions...
        </div>
    `;

    try {

        const response = await fetch("/api/extensions");

        if (!response.ok) {
            throw new Error("Failed to load extensions.");
        }

        extensions = await response.json();

        /*
         * Check whether the URL contains an extension.
         *
         * Example:
         * ?extension=UUID%20Generator
         */

        const params =
            new URLSearchParams(window.location.search);

        const extensionName =
            params.get("extension");

        if (extensionName) {

            const extension =
                extensions.find(
                    ext => ext.folder === extensionName
                );

            if (extension) {

                renderDetails(extension);

                return;

            }

        }

        render(extensions);

    } catch (error) {

        console.error(error);

        grid.innerHTML = `
            <div class="loading">
                Failed to load extensions.
            </div>
        `;

    }

}


/*
 * Render extension cards
 */

function render(list) {

    /*
     * Make sure the search bar is visible
     * when we're on the main extension page.
     */

    search.style.display = "";

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

        const card =
            document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <img
                class="icon"
                src="${ext.icon}"
                alt="${escapeHTML(ext.name)}"
            >

            <div class="content">

                <h2>
                    ${escapeHTML(ext.name)}
                </h2>

                <p>
                    ${escapeHTML(ext.description)}
                </p>

                <div class="meta">

                    <span>
                        ${escapeHTML(ext.version)}
                    </span>

                    <span>
                        ${escapeHTML(ext.author)}
                    </span>

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


        /*
         * Clicking the card opens the detail page.
         *
         * Clicking Download does NOT open the
         * detail page.
         */

        card.addEventListener("click", event => {

            if (
                event.target.closest(".download")
            ) {

                return;

            }

            window.location.href =
                `?extension=${encodeURIComponent(
                    ext.folder
                )}`;

        });


        grid.appendChild(card);

    }

}


/*
 * Render extension detail page
 */

function renderDetails(ext) {

    /*
     * Hide the search bar while viewing
     * an individual extension.
     */

    search.style.display = "none";


    grid.innerHTML = `

        <div class="extension-details">

            <button
                class="back-button"
                onclick="goBack()"
            >
                ← Back to Extensions
            </button>


            <div class="details-header">

                <img
                    class="details-icon"
                    src="${ext.icon}"
                    alt="${escapeHTML(ext.name)}"
                >


                <div class="details-info">

                    <h1>
                        ${escapeHTML(ext.name)}
                    </h1>

                    <p class="details-description">
                        ${escapeHTML(ext.description)}
                    </p>


                    <div class="meta">

                        <span>
                            ${escapeHTML(ext.version)}
                        </span>

                        <span>
                            ${escapeHTML(ext.author)}
                        </span>

                    </div>

                </div>

            </div>


            <div class="details-content">

                <h2>
                    About this extension
                </h2>

                <p>
                    ${escapeHTML(ext.longdescription)}
                </p>


                <a
                    class="download details-download"
                    href="${ext.script}"
                    download
                >
                    Download Extension
                </a>

            </div>

        </div>

    `;

}


/*
 * Return to the main extension page
 */

function goBack() {

    window.location.href =
        window.location.pathname;

}


/*
 * Escape user/config-provided text before
 * inserting it into HTML.
 */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/*
 * Search
 */

search.addEventListener("input", () => {

    const value =
        search.value
            .toLowerCase()
            .trim();


    const filtered =
        extensions.filter(ext => {

            return (

                ext.name
                    .toLowerCase()
                    .includes(value)

                ||

                ext.description
                    .toLowerCase()
                    .includes(value)

                ||

                ext.author
                    .toLowerCase()
                    .includes(value)

            );

        });


    render(filtered);

});


/*
 * Start the website
 */

loadExtensions();
