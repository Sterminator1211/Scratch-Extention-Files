const grid =
    document.getElementById(
        "extensionGrid"
    );

const search =
    document.getElementById(
        "search"
    );

const dependenciesButton =
    document.getElementById(
        "dependenciesButton"
    );


let extensions = [];


/* ============================= */
/* Load Extensions */
/* ============================= */

async function loadExtensions() {

    try {

        const response =
            await fetch(
                "/api/extensions"
            );


        if (!response.ok) {

            throw new Error(
                `API returned ${response.status}`
            );

        }


        extensions =
            await response.json();


        /*
         * Read the current URL.
         */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const extensionName =
            params.get(
                "extension"
            );


        const page =
            params.get(
                "page"
            );


        /*
         * Individual extension page.
         */

        if (extensionName) {

            const extension =
                extensions.find(
                    ext =>
                        ext.folder ===
                        extensionName
                );


            if (extension) {

                renderDetails(
                    extension
                );

                return;

            }

        }


        /*
         * Dependencies page.
         */

        if (
            page ===
            "dependencies"
        ) {

            renderDependencies();

            return;

        }


        /*
         * Normal extension page.
         */

        renderExtensions();

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
/* Normal Extensions */
/* ============================= */

function renderExtensions(
    list = null
) {

    search.style.display = "";

    dependenciesButton.classList.remove(
        "active"
    );


    const source =
        list ||
        extensions.filter(
            ext =>
                ext.type !==
                "dependency"
        );


    renderCards(
        source
    );

}


/* ============================= */
/* Dependencies */
/* ============================= */

function renderDependencies(
    list = null
) {

    search.style.display = "";

    dependenciesButton.classList.add(
        "active"
    );


    const dependencies =
        list ||
        extensions.filter(
            ext =>
                ext.type ===
                "dependency"
        );


    grid.innerHTML = `

        <div class="page-title">

            <h1>
                Dependencies
            </h1>

            <p>
                Extensions and resources used
                as dependencies.
            </p>

        </div>

    `;


    const dependencyGrid =
        document.createElement(
            "div"
        );


    dependencyGrid.className =
        "dependency-grid";


    if (
        dependencies.length ===
        0
    ) {

        dependencyGrid.innerHTML = `

            <div class="loading">

                No dependencies found.

            </div>

        `;

    } else {

        dependencies.forEach(
            extension => {

                dependencyGrid.appendChild(
                    createCard(
                        extension
                    )
                );

            }
        );

    }


    grid.appendChild(
        dependencyGrid
    );

}


/* ============================= */
/* Render Cards */
/* ============================= */

function renderCards(
    list
) {

    grid.innerHTML = "";


    if (
        !list ||
        list.length === 0
    ) {

        grid.innerHTML = `

            <div class="loading">

                No extensions found.

            </div>

        `;

        return;

    }


    list.forEach(
        extension => {

            grid.appendChild(
                createCard(
                    extension
                )
            );

        }
    );

}


/* ============================= */
/* Create Card */
/* ============================= */

function createCard(
    ext
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "card";


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
     * Clicking anywhere on the card
     * except Download opens details.
     */

    card.addEventListener(
        "click",
        function(event) {

            if (
                event.target.closest(
                    ".download"
                )
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


    return card;

}


/* ============================= */
/* Extension Details */
/* ============================= */

function renderDetails(
    ext
) {

    search.style.display =
        "none";

    dependenciesButton.style.display =
        "none";


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


                    <p
                        class="details-description"
                    >
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


    const backButton =
        document.getElementById(
            "backButton"
        );


    backButton.addEventListener(
        "click",
        function() {

            /*
             * Return to the correct
             * collection page.
             */

            const referrerPage =
                sessionStorage.getItem(
                    "extensionCollectionPage"
                );


            if (
                referrerPage ===
                "dependencies"
            ) {

                window.location.href =
                    "?page=dependencies";

            } else {

                window.location.href =
                    window.location.pathname;

            }

        }
    );

}


/* ============================= */
/* Dependencies Button */
/* ============================= */

dependenciesButton.addEventListener(
    "click",
    function() {

        /*
         * Remember where the user came from
         * so the detail-page Back button can
         * return to the right collection.
         */

        sessionStorage.setItem(
            "extensionCollectionPage",
            "dependencies"
        );


        window.location.href =
            "?page=dependencies";

    }
);


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


        const params =
            new URLSearchParams(
                window.location.search
            );


        const page =
            params.get(
                "page"
            );


        /*
         * Determine which collection
         * should be searched.
         */

        let source;


        if (
            page ===
            "dependencies"
        ) {

            source =
                extensions.filter(
                    ext =>
                        ext.type ===
                        "dependency"
                );

        } else {

            source =
                extensions.filter(
                    ext =>
                        ext.type !==
                        "dependency"
                );

        }


        /*
         * Empty search.
         */

        if (!value) {

            if (
                page ===
                "dependencies"
            ) {

                renderDependencies();

            } else {

                renderExtensions();

            }

            return;

        }


        /*
         * Search fields.
         */

        const filtered =
            source.filter(
                ext => {

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

                        ||

                        ext.state
                            .toLowerCase()
                            .includes(value)

                        ||

                        ext.version
                            .toLowerCase()
                            .includes(value)

                    );

                }
            );


        /*
         * Render search results.
         */

        if (
            page ===
            "dependencies"
        ) {

            renderDependencies(
                filtered
            );

        } else {

            renderExtensions(
                filtered
            );

        }

    }
);


/* ============================= */
/* HTML Escaping */
/* ============================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;

}


/* ============================= */
/* Start */
/* ============================= */

loadExtensions();
