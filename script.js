const grid = document.getElementById("extensionGrid");
const search = document.getElementById("search");

let extensions = [];


/* ============================= */
/* Load Extensions */
/* ============================= */

async function loadExtensions() {

    try {

        const response =
            await fetch("/api/extensions");

        if (!response.ok) {

            throw new Error(
                `API returned ${response.status}`
            );

        }

        extensions =
            await response.json();


        /*
         * Check if we're opening
         * an individual extension.
         */

        const params =
            new URLSearchParams(
                window.location.search
            );

        const extensionName =
            params.get("extension");


        if (extensionName) {

            const extension =
                extensions.find(
                    ext =>
                        ext.folder === extensionName
                );


            if (extension) {

                renderDetails(extension);

                return;

            }

        }


        /*
         * Otherwise show the
         * normal extension grid.
         */

        render(extensions);

    } catch (error) {

        console.error(
            "Extension loading error:",
            error
        );


        grid.innerHTML = `
            <div class="loading">
                Failed to load extensions.
            </div>
        `;

    }

}


/* ============================= */
/* Render Extension Cards */
/* ============================= */

function render(list) {

    /*
     * Make sure the search bar
     * is visible on the main page.
     */

    search.style.display = "";


    if (!list || list.length === 0) {

        grid.innerHTML = `
            <div class="loading">
                No extensions found.
            </div>
        `;

        return;

    }


    grid.innerHTML = "";


    list.forEach(ext => {

        const card =
            document.createElement("div");


        card.className = "card";


        /*
         * Extension card.
         */

        card.innerHTML = `

            <img
                class="icon"
                src="${escapeHTML(ext.icon)}"
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


                    <span
                        class="state-badge"
                        style="--state-color: ${escapeHTML(ext.statecolor)}"
                    >
                        ${escapeHTML(ext.state)}
                    </span>

                </div>


                <a
                    class="download"
                    href="${escapeHTML(ext.script)}"
                    download
                >
                    Download
                </a>

            </div>

        `;


        /*
         * Clicking the card opens
         * the extension detail page.
         *
         * Clicking Download does not.
         */

        card.addEventListener(
            "click",
            function(event) {

                if (
                    event.target.closest(".download")
                ) {

                    return;

                }


                window.location.href =
                    "?extension=" +
                    encodeURIComponent(
                        ext.folder
                    );

            }
        );


        grid.appendChild(card);

    });

}


/* ============================= */
/* Render Extension Details */
/* ============================= */

function renderDetails(ext) {

    /*
     * Hide search while viewing
     * an individual extension.
     */

    search.style.display = "none";


    grid.innerHTML = `

        <div class="extension-details">


            <button
                class="back-button"
                id="backButton"
            >
                ← Back to Extensions
            </button>


            <div class="details-header">


                <img
                    class="details-icon"
                    src="${escapeHTML(ext.icon)}"
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


                        <span
                            class="state-badge"
                            style="--state-color: ${escapeHTML(ext.statecolor)}"
                        >
                            ${escapeHTML(ext.state)}
                        </span>


                    </div>


                </div>


            </div>


            <div class="details-content">


                <h2>
                    About this extension
                </h2>


                <p>
                    ${escapeHTML(
                        ext.longdescription
                    )}
                </p>


                <a
                    class="download details-download"
                    href="${escapeHTML(ext.script)}"
                    download
                >
                    Download Extension
                </a>


            </div>


        </div>

    `;


    /*
     * Back button.
     */

    const backButton =
        document.getElementById(
            "backButton"
        );


    backButton.addEventListener(
        "click",
        goBack
    );

}


/* ============================= */
/* Back To Extensions */
/* ============================= */

function goBack() {

    /*
     * Remove the ?extension=...
     * query parameter.
     */

    window.location.href =
        window.location.pathname;

}


/* ============================= */
/* Search */
/* ============================= */

search.addEventListener(
    "input",
    function() {

        const value =
            search.value
                .toLowerCase()
                .trim();


        /*
         * If the search box is empty,
         * show everything.
         */

        if (!value) {

            render(extensions);

            return;

        }


        const filtered =
            extensions.filter(
                function(ext) {

                    return (

                        /*
                         * Search extension name
                         */

                        ext.name
                            .toLowerCase()
                            .includes(value)


                        ||


                        /*
                         * Search description
                         */

                        ext.description
                            .toLowerCase()
                            .includes(value)


                        ||


                        /*
                         * Search author
                         */

                        ext.author
                            .toLowerCase()
                            .includes(value)


                        ||


                        /*
                         * Search state
                         */

                        ext.state
                            .toLowerCase()
                            .includes(value)

                    );

                }
            );


        render(filtered);

    }
);


/* ============================= */
/* HTML Escaping */
/* ============================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;

}


/* ============================= */
/* Start Website */
/* ============================= */

loadExtensions();
