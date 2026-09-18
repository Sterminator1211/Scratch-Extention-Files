function openDLLMenu(ext) {

    closeDLLMenu();


    const backdrop =
        document.createElement("div");

    backdrop.className =
        "dll-modal-backdrop";


    const modal =
        document.createElement("div");

    modal.className =
        "dll-modal";


    const header =
        document.createElement("div");

    header.className =
        "dll-modal-header";


    const title =
        document.createElement("h2");

    title.textContent =
        "DLL(s)";


    const closeButton =
        document.createElement("button");

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


    header.appendChild(title);
    header.appendChild(closeButton);

    modal.appendChild(header);


    const list =
        document.createElement("div");

    list.className =
        "dll-list";


    if (
        !ext.dlls ||
        ext.dlls.length === 0
    ) {

        const empty =
            document.createElement("p");

        empty.className =
            "dll-empty";

        empty.textContent =
            "No DLLs found.";

        list.appendChild(empty);

    } else {

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
                 * Text section.
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
                 * DLL icon.
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
                 * Extra fallback in case the
                 * icon unexpectedly fails to load.
                 */

                icon.addEventListener(
                    "error",
                    function() {

                        if (
                            icon.src.endsWith(
                                "/defaultDLL.png"
                            )
                        ) {
                            return;
                        }

                        icon.src =
                            "/defaultDLL.png";

                    }
                );


                button.appendChild(
                    text
                );

                button.appendChild(
                    icon
                );


                button.addEventListener(
                    "click",
                    function() {

                        downloadDLL(dll);

                    }
                );


                list.appendChild(
                    button
                );

            }
        );

    }


    modal.appendChild(list);

    backdrop.appendChild(modal);

    document.body.appendChild(
        backdrop
    );


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


    closeButton.addEventListener(
        "click",
        closeDLLMenu
    );


    document.addEventListener(
        "keydown",
        handleDLLKeydown
    );

}
