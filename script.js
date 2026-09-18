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

const mainPageButton =
    document.getElementById(
        "mainPageButton"
    );

const testButton =
    document.getElementById(
        "testButton"
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

    search.style.display =
        "";

    dependenciesButton.style.display =
        "";

    mainPageButton.style.display =
        "";

    testButton.style.display =
        "";


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

    search.style.display =
        "";

    dependenciesButton.style.display =
        "";

    mainPageButton.style.display =
        "";

    testButton.style.display =
        "";


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


            const currentPage =
                new URLSearchParams(
                    window.location.search
                ).get(
                    "page"
                );


            sessionStorage.setItem(
                "extensionCollectionPage",
                currentPage ===
                    "dependencies"
                    ? "dependencies"
                    : "extensions"
            );


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

    mainPageButton.style.display =
        "none";

    testButton.style.display =
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


                <div class="details-actions">

                    <a
                        class="download details-download"
                        href="${escapeHTML(ext.script)}"
                        download
                    >
                        Download Extension
                    </a>


                    ${
                        ext.dll_available
                            ? `
                                <button
                                    class="dll-button"
                                    id="dllButton"
                                >
                                    DLL(s)
                                </button>
                            `
                            : ""
                    }

                </div>

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
        function() {

            const previousPage =
                sessionStorage.getItem(
                    "extensionCollectionPage"
                );


            if (
                previousPage ===
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


    /*
     * DLL button.
     */

    if (
        ext.dll_available
    ) {

        const dllButton =
            document.getElementById(
                "dllButton"
            );


        dllButton.addEventListener(
            "click",
            function() {

                openDLLMenu(
                    ext
                );

            }
        );

    }

}


/* ============================= */
/* DLL Popup */
/* ============================= */

function openDLLMenu(
    ext
) {

    closeDLLMenu();


    const backdrop =
        document.createElement(
            "div"
        );


    backdrop.className =
        "dll-modal-backdrop";


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "dll-modal";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "dll-modal-header";


    const title =
        document.createElement(
            "h2"
        );


    title.textContent =
        "DLL(s)";


    const closeButton =
        document.createElement(
            "button"
        );


    closeButton.className =
        "dll-close-button";


    closeButton.type =
        "button";


    closeButton.setAttribute(
        "aria-label",
        "Close DLL menu"
    );


    closeButton.textContent =
        "×";


    header.appendChild(
        title
    );


    header.appendChild(
        closeButton
    );


    modal.appendChild(
        header
    );


    const list =
        document.createElement(
            "div"
        );


    list.className =
        "dll-list";


    /*
     * No DLLs.
     */

    if (
        !ext.dlls ||
        ext.dlls.length === 0
    ) {

        const empty =
            document.createElement(
                "p"
            );


        empty.className =
            "dll-empty";


        empty.textContent =
            "No DLLs found.";


        list.appendChild(
            empty
        );

    } else {

        /*
         * Create one option for each DLL.
         */

        ext.dlls.forEach(
            dll => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.className =
                    "dll-option";


                button.type =
                    "button";


                /*
                 * Text.
                 */

                const text =
                    document.createElement(
                        "span"
                    );


                text.className =
                    "dll-option-text";


                text.textContent =
                    `${dll.title}   -  ${dll.version}`;


                /*
                 * Icon.
                 */

                const icon =
                    document.createElement(
                        "img"
                    );


                icon.className =
                    "dll-option-icon";


                icon.src =
                    dll.icon ||
                    "/defaultDLL.png";


                icon.alt =
                    "";


                /*
                 * If the custom icon fails,
                 * use the default DLL icon.
                 */

                icon.addEventListener(
                    "error",
                    function() {

                        if (
                            !icon.src.endsWith(
                                "/defaultDLL.png"
                            )
                        ) {

                            icon.src =
                                "/defaultDLL.png";

                        }

                    }
                );


                button.appendChild(
                    text
                );


                button.appendChild(
                    icon
                );


                /*
                 * Download this DLL.
                 */

                button.addEventListener(
                    "click",
                    function() {

                        downloadDLL(
                            dll
                        );

                    }
                );


                list.appendChild(
                    button
                );

            }
        );

    }


    modal.appendChild(
        list
    );


    backdrop.appendChild(
        modal
    );


    document.body.appendChild(
        backdrop
    );


    /*
     * Clicking outside the popup closes it.
     */

    backdrop.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                backdrop
            ) {

                closeDLLMenu();

            }

        }
    );


    /*
     * Close button.
     */

    closeButton.addEventListener(
        "click",
        closeDLLMenu
    );


    /*
     * Escape key.
     */

    document.addEventListener(
        "keydown",
        handleDLLKeydown
    );

}


/* ============================= */
/* Download DLL */
/* ============================= */

function downloadDLL(
    dll
) {

    const link =
        document.createElement(
            "a"
        );


    link.href =
        dll.script;


    link.download =
        dll.file;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    closeDLLMenu();

}


/* ============================= */
/* Close DLL Popup */
/* ============================= */

function closeDLLMenu() {

    const existing =
        document.querySelector(
            ".dll-modal-backdrop"
        );


    if (existing) {

        existing.remove();

    }


    document.removeEventListener(
        "keydown",
        handleDLLKeydown
    );

}


/* ============================= */
/* DLL Keyboard Handler */
/* ============================= */

function handleDLLKeydown(
    event
) {

    if (
        event.key ===
        "Escape"
    ) {

        closeDLLMenu();

    }

}


/* ============================= */
/* Main Page Button */
/* ============================= */

mainPageButton.addEventListener(
    "click",
    function() {

        sessionStorage.setItem(
            "extensionCollectionPage",
            "extensions"
        );


        window.location.href =
            window.location.pathname;

    }
);


/* ============================= */
/* Dependencies Button */
/* ============================= */

dependenciesButton.addEventListener(
    "click",
    function() {

        sessionStorage.setItem(
            "extensionCollectionPage",
            "dependencies"
        );


        window.location.href =
            "?page=dependencies";

    }
);


/* ============================= */
/* Test Button */
/* ============================= */

testButton.addEventListener(
    "click",
    function() {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            "/extension-tester.pmp";


        link.download =
            "extension-tester.pmp";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();

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


        let source;


        /*
         * Dependencies page:
         * search only dependencies.
         */

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

            /*
             * Normal page:
             * exclude dependencies.
             */

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
         * Render filtered results.
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
