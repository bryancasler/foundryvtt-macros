const COOKIE_KEY = "sharedImages"; // Key for cookie
const MAX_IMAGES = 9; // Limit to 9 recent images

// Function to close any open image or journal modals and simulate typing
const closeOpenModalsAndSimulateTyping = () => {
    const imagePopouts = document.querySelectorAll(".image-popout");
    imagePopouts.forEach(popout => {
        const closeButton = popout.querySelector("a.close");
        if (closeButton) {
            closeButton.click();
        }
    });

    const journalPopouts = document.querySelectorAll(".journal-sheet");
    journalPopouts.forEach(popout => {
        const closeButton = journalPopout.querySelector("a.close");
        if (closeButton) {
            closeButton.click();
        }
    });

    // Notify user about closed modals
    ui.notifications.info("All open modals have been closed.");

    // Simulate typing the backtick (`) key 10 times
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const event = new KeyboardEvent("keydown", { key: "`", code: "Backquote" });
            document.dispatchEvent(event);
        }, i * 100); // 100ms interval
    }
};

// Utility function to get a cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
}

// Utility function to set a cookie with a long expiration
function setCookie(name, value, days = 365 * 10) { // Default: 10 years
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

// Utility function to delete a cookie
function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Utility function to parse the image history from a cookie
function getImageHistory() {
    const cookie = getCookie(COOKIE_KEY);
    return cookie ? JSON.parse(decodeURIComponent(cookie)) : [];
}

// Utility function to update the image history and save it to a cookie
function updateImageHistory(url) {
    let history = getImageHistory();

    // Remove duplicates
    history = history.filter(item => item !== url);

    // Add new URL to the front
    history.unshift(url);

    // Limit to max images
    history = history.slice(0, MAX_IMAGES);

    // Save back to cookie
    setCookie(COOKIE_KEY, encodeURIComponent(JSON.stringify(history)));
}

// Utility function to clear the image history
function clearImageHistory() {
    deleteCookie(COOKIE_KEY);
}

// Function to create a grid of thumbnails for the image history
function createThumbnailGrid() {
    const history = getImageHistory();
    return history.map(url => 
        `<div class="thumbnail">
            <img src="${url}" class="history-thumb" data-url="${url}" 
                 title="${url}" />
        </div>`
    ).join("");
}

// Function to toggle visibility of the Recent Images section and buttons
function toggleHistoryVisibility(html) {
    const history = getImageHistory();
    if (history.length > 0) {
        html.find("#history-grid").show();
        html.find("#clear-history-link").show();
        html.find("#divider").show();
        html.find("#recent-images-header").show();
    } else {
        html.find("#history-grid").hide();
        html.find("#clear-history-link").hide();
        html.find("#divider").hide();
        html.find("#recent-images-header").hide();
    }
}

// Function to show an image, broadcast it, and close the dialog
async function imageMessage(url, dialog) {
    if (url === "") {
        ui.notifications.warn("Please provide a valid URL or select a file.");
        return;
    }

    // Open the new image modal
    const popout = new ImagePopout(url).render(true);
    popout.shareImage();

    // Update history and close the dialog
    updateImageHistory(url);
    dialog.close();
}

// Main dialog
(async () => {
    let dialogContent = `
        <style>
            .share-image-dialog {
                font-family: Arial, sans-serif;
                padding: 1rem;
            }
            .share-image-dialog input[type="text"] {
                border: 2px solid black;
                width: 100%;
                font-size: 1rem;
                padding: 0.75rem;
                margin-right: 0;
                margin-bottom: 1rem;
                border-radius: 4px;
                box-sizing: border-box;
                display: inline-block;
            }
            .share-image-dialog input[type="text"]:focus {
                outline: 2px solid black;
            }
            .file-picker {
                text-align: center;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                margin-bottom: 1rem;
            }
            .file-picker:hover {
                color: #333;
            }
            .file-picker-icon {
                margin-left: 0.5rem;
                font-size: 1.5rem;
            }
            #divider {
                border-top: 2px solid black;
                margin: 1rem 0;
            }
            #recent-images-header {
                text-align: center;
                font-size: 1rem;
                font-weight: bold;
                color: #555;
                margin-bottom: 1rem;
            }
            #history-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.5rem;
                margin: 0;
                padding: 0;
            }
            .thumbnail {
                display: block;
                text-align: center;
                cursor: pointer;
                width: 100%;
                padding-top: 100%; /* Makes the div a perfect square */
                position: relative;
            }
            .thumbnail img {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            .thumbnail img:hover {
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            }
            #clear-history-link {
                font-size: 1rem;
                color: red;
                font-weight: bold;
                text-align: center;
                cursor: pointer;
                margin-top: 1rem;
                display: block;
            }
        </style>
        <div class="share-image-dialog">
            <input name="url" type="text" placeholder="Paste Image URL Here"/>
            <div class="file-picker" id="filepicker-button">
                File Picker
                <span class="file-picker-icon">📁</span>
            </div>
            <div id="divider"></div>
            <div id="recent-images-header">Recent Images</div>
            <div id="history-grid">
                ${createThumbnailGrid()}
            </div>
            <div id="clear-history-link" style="display: none;">Clear Sharing History</div>
        </div>
    `;

    const d = new Dialog({
        title: "Share an Image", // Dialog header remains consistent
        content: dialogContent,
        buttons: {}, // No additional buttons needed
        render: (html) => {
            // Toggle visibility of the history section and buttons on render
            toggleHistoryVisibility(html);

            // Event listener for the URL input field to detect changes
            html.find("[name=url]").on("input", async (event) => {
                const url = event.target.value;
                if (url) {
                    await imageMessage(url, d);
                }
            });

            // Event listener for the file picker button
            html.find("#filepicker-button").on("click", async () => {
                new FilePicker({
                    type: "image",
                    callback: async (path) => {
                        html.find("[name=url]").val(path); // Insert selected file path into input field
                        await imageMessage(path, d); // Automatically display the image and close the modal
                    },
                }).render(true);
            });

            // Event listener for history thumbnails
            html.find("#history-grid").on("click", ".history-thumb", async (event) => {
                const url = event.target.dataset.url;
                if (url) {
                    await imageMessage(url, d);
                }
            });

            // Event listener for the clear history link
            html.find("#clear-history-link").on("click", () => {
                clearImageHistory();
                html.find("#history-grid").html(""); // Clear the UI thumbnails
                toggleHistoryVisibility(html); // Update visibility
            });
        },
    });
    d.render(true);
})();