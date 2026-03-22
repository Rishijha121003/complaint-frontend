// ==============================
// CONFIG & PATHS (Backend se sync rakhein)
// ==============================
const BASE_URL = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
    ? "http://127.0.0.1:8080/api/v1/complaints"
    : "https://complaint-backend-5rdk.onrender.com/api/v1/complaints";

// ==============================
// LOAD COMPLAINTS
// ==============================
async function loadComplaints() {
    try {
        // Student ki complaints fetch karne ke liye humne GetMapping banayi thi
        const res = await fetch(`${BASE_URL}/my-complaints`, {
            credentials: "include"
        });

        if (!res.ok) throw new Error("Failed to fetch complaints");

        const data = await res.json();
        const grid = document.getElementById("complaintGrid");

        if (!grid) return;
        grid.innerHTML = "";

        data.forEach(c => {
            // Logic for hiding CLOSED complaints after 24 hours
            if (c.status === 'CLOSED') {
                const actionDate = c.updatedAt ? new Date(c.updatedAt) : (c.createdAt ? new Date(c.createdAt) : new Date());
                const today = new Date();

                // Calculate difference in milliseconds
                const diffInMs = today - actionDate;
                // Convert difference to hours
                const diffInHours = diffInMs / (1000 * 60 * 60);

                // Check if 24 hours have passed
                if (diffInHours >= 24) {
                    return; // Is iteration ko skip kardo, card display nahi hoga
                }
            }

            // Status ke liye alag CSS class (e.g., status-open, status-resolved)
            const statusClass = c.status ? c.status.toLowerCase() : 'open';

            grid.innerHTML += `
                <div class="complaint-box">
                    <div class="box-header">
                        <h4>${c.title}</h4>
                        <span class="status-badge ${statusClass}">${c.status}</span>
                    </div>
                    <p class="category">${c.category}</p>
                    <p class="description">${c.description.substring(0, 50)}...</p>
                    <small>${new Date(c.createdAt).toLocaleDateString()}</small>
                </div>
            `;
        });

    } catch (err) {
        console.error("Error loading complaints:", err);
    }
}

// ==============================
// POPUP CONTROLS
// ==============================
const raisePopup = document.getElementById("raisePopup");

document.getElementById("openRaiseBtn")?.addEventListener("click", () => {
    raisePopup.style.display = "flex";
});

document.getElementById("closePopup")?.addEventListener("click", () => {
    raisePopup.style.display = "none";
});

// Window ke bahar click karne par popup band ho jaye
window.onclick = (event) => {
    if (event.target == raisePopup) {
        raisePopup.style.display = "none";
    }
};

// ==============================
// RAISE COMPLAINT (POST)
// ==============================
document.getElementById("raiseComplaintForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";

    const payload = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        category: document.getElementById("category").value
    };

    try {
        const response = await fetch(BASE_URL, { // Direct POST to /api/v1/complaints
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            throw new Error(errorMsg || "Submit failed");
        }

        alert("Complaint Raised Successfully! ✅");

        // UI Updates
        raisePopup.style.display = "none";
        this.reset();
        loadComplaints(); // Refresh the list

    } catch (err) {
        console.error("Error submitting complaint:", err);
        alert("Submission Failed: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Complaint";
    }
});

// ==============================
// INITIAL LOAD
// ==============================
loadComplaints();