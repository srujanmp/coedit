/**
 * Real-time collaborative editor functionality
 * Handles Socket.IO connections, live editing, and user management
 */

class CollaborativeEditor {
    constructor() {
        this.initializeElements();
        this.initializeSocket();
        this.setupEventListeners();
        this.debounceTimer = null;
    }

    initializeElements() {

        this.textarea = document.getElementById("file-body");
        this.status = document.getElementById("status");
        this.copyBtn = document.getElementById('copy-link-btn');
        this.userList = document.getElementById("user-list");
        this.globalCount = document.getElementById("global-count");
        this.downloadBtn = document.getElementById("download-btn");


        // Get data passed from server
        this.fileData = window.fileData || {};
        this.fileId = this.fileData.fileId;
        this.userName = this.fileData.userName;
        this.userEmail = this.fileData.userEmail;
    }

    initializeSocket() {
        this.socket = io();
        this.joinFile();
        this.setupSocketListeners();
    }

    joinFile() {
        this.socket.emit("join-file", {
            fileId: this.fileId,
            userName: this.userName,
            userEmail: this.userEmail
        });
    }

    setupSocketListeners() {
        // Update user list when users join/leave
        this.socket.on("users-update", (names) => {
            this.updateUserList(names);
        });

        // Listen for content updates from other users
        this.socket.on("body-updated", (newBody) => {
            this.updateTextareaContent(newBody);
        });

        // Update global user count
        this.socket.on("total-users", (total) => {
            this.updateGlobalCount(total);
        });

        // Handle access denied
        this.socket.on("access-denied", () => {
            this.handleAccessDenied();
        });
    }

    setupEventListeners() {
        // Real-time editing
        this.textarea.addEventListener("input", () => {
            this.handleTextareaInput();
        });

        // Save to database on blur
        this.textarea.addEventListener("blur", () => {
            this.saveToDatabase();
        });

        // Copy link functionality
        this.copyBtn.addEventListener('click', () => {
            this.copyLinkToClipboard();
        });

        // Download functionality
        this.downloadBtn.addEventListener("click", () => {
            this.downloadFile();
        });

    }

    updateUserList(names) {
        this.userList.innerHTML = "";
        names.forEach((name) => {
            const li = document.createElement("li");
            li.textContent = name;
            this.userList.appendChild(li);
        });
    }

    updateTextareaContent(newBody) {
        if (this.textarea.value !== newBody) {
            // Store cursor position
            const cursorPos = this.textarea.selectionStart;
            this.textarea.value = newBody;

            // Restore cursor position if possible
            if (cursorPos <= newBody.length) {
                this.textarea.setSelectionRange(cursorPos, cursorPos);
            }
        }
    }

    updateGlobalCount(total) {
        this.globalCount.textContent = `${total} people are online in server`;
    }

    handleAccessDenied() {
        this.textarea.disabled = true;
        this.textarea.style.backgroundColor = "#f0f0f0";
        this.status.textContent = "Read-only access (you can't edit this file)";
    }

    handleTextareaInput() {
        const newBody = this.textarea.value;

        // Emit real-time changes
        this.socket.emit("edit-body", {
            fileId: this.fileId,
            newBody
        });

        // Clear any existing debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set status to indicate typing
        this.status.textContent = "Status: Typing...";
    }

    async saveToDatabase() {
        const updatedBody = this.textarea.value;

        try {
            this.status.textContent = "Status: Saving...";

            const response = await fetch(`/file/${this.fileId}/edit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ body: updatedBody }),
            });

            if (response.ok) {
                this.status.textContent = "Status: Saved";
                setTimeout(() => {
                    this.status.textContent = "Status:";
                }, 1200);
            } else {
                this.status.textContent = "Status: Error saving";
                console.error("Save failed:", response.statusText);
            }
        } catch (error) {
            console.error("Save error:", error);
            this.status.textContent = "Status: Save failed";
        }
    }

    async copyLinkToClipboard() {
        const linkToCopy = window.location.href;

        try {
            // Use modern Clipboard API if available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(linkToCopy);
                this.showCopyFeedback("Link copied");
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(linkToCopy);
            }
        } catch (error) {
            console.error("Copy failed:", error);
            this.showCopyFeedback("Failed to copy link", true);
        }
    }

    fallbackCopyToClipboard(text) {
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopyFeedback("Link copied");
            } else {
                this.showCopyFeedback("Failed to copy link", true);
            }
        } catch (error) {
            this.showCopyFeedback("Failed to copy link", true);
        }

        document.body.removeChild(tempInput);
    }

    showCopyFeedback(message, isError = false) {
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 10px;
            background: ${isError ? '#808080' : '#808080'};
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 14px;
            margin-top:45px;
        `;

        document.body.appendChild(feedback);

        // Remove feedback after 0.5 seconds
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 500);
    }
    downloadFile() {
        const textContent = this.textarea.value;
        const blob = new Blob([textContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.fileData.fileName || "document"}.txt`; // default fallback
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CollaborativeEditor();
});