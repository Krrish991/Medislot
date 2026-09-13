const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8080" : "";

const pendingLoading = document.getElementById("pendingLoading");
const pendingEmpty = document.getElementById("pendingEmpty");
const pendingTableWrapper = document.getElementById("pendingTableWrapper");
const pendingTableBody = document.getElementById("pendingTableBody");
const pendingCount = document.getElementById("pendingCount");
const pendingMessage = document.getElementById("pendingMessage");

function showPendingMessage(message, type = "danger") {
    pendingMessage.className = `alert alert-${type}`;
    pendingMessage.textContent = message;
}

function clearPendingMessage() {
    pendingMessage.className = "alert d-none";
    pendingMessage.textContent = "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderPendingDoctors(doctors) {

    pendingCount.textContent = doctors.length;

    if (!doctors || doctors.length === 0) {

        pendingTableWrapper.classList.add("d-none");
        pendingEmpty.classList.remove("d-none");

        return;
    }

    pendingEmpty.classList.add("d-none");
    pendingTableWrapper.classList.remove("d-none");

    pendingTableBody.innerHTML = doctors.map((doctor) => {

        const name =
            escapeHtml(doctor.user?.name || "Unnamed");

        const email =
            escapeHtml(doctor.user?.email || "-");

        const specialization =
            escapeHtml(doctor.specialization || "-");

        const qualification =
            escapeHtml(doctor.qualification || "-");

        const experience =
            doctor.experienceYears != null
                ? `${doctor.experienceYears} yrs`
                : "-";

        const clinic =
            escapeHtml(doctor.clinic?.name || "-");

        return `
            <tr data-doctor-id="${doctor.id}">

                <td>${name}</td>

                <td>${email}</td>

                <td>${specialization}</td>

                <td>${qualification}</td>

                <td>${experience}</td>

                <td>${clinic}</td>

                <td class="text-end">

                    <button
                        class="btn btn-sm btn-success me-2 approve-doctor-btn"
                        data-id="${doctor.id}">
                        Approve
                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger reject-doctor-btn"
                        data-id="${doctor.id}">
                        Reject
                    </button>

                </td>

            </tr>
        `;

    }).join("");

    document
        .querySelectorAll(".approve-doctor-btn")
        .forEach((button) => {

            button.addEventListener("click", () => {
                approveDoctor(button.dataset.id, button);
            });

        });

    document
        .querySelectorAll(".reject-doctor-btn")
        .forEach((button) => {

            button.addEventListener("click", () => {
                rejectDoctor(button.dataset.id, button);
            });

        });
}

async function loadPendingDoctors() {

    pendingLoading.classList.remove("d-none");

    pendingTableWrapper.classList.add("d-none");

    pendingEmpty.classList.add("d-none");

    clearPendingMessage();

    try {

        const response =
            await fetch(`${API_BASE_URL}/api/doctors/pending`);

        if (!response.ok) {
            throw new Error(
                "Failed to load pending doctors."
            );
        }

        const doctors =
            await response.json();

        renderPendingDoctors(doctors);

    } catch (error) {

        console.error(
            "Pending doctor loading error:",
            error
        );

        showPendingMessage(
            "Cannot connect to MediSlot backend. Make sure Spring Boot is running on port 8080.",
            "danger"
        );

    } finally {

        pendingLoading.classList.add("d-none");
    }
}

async function approveDoctor(doctorId, button) {

    if (!confirm("Approve this doctor registration?")) {
        return;
    }

    button.disabled = true;

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/doctors/${doctorId}/verify`,
                {
                    method: "PUT"
                }
            );

        if (!response.ok) {
            throw new Error("Approval failed.");
        }

        showPendingMessage(
            "Doctor approved successfully.",
            "success"
        );

        await loadPendingDoctors();

    } catch (error) {

        console.error(
            "Doctor approval error:",
            error
        );

        showPendingMessage(
            "Could not approve this doctor. Please try again.",
            "danger"
        );

        button.disabled = false;
    }
}

async function rejectDoctor(doctorId, button) {

    if (
        !confirm(
            "Reject and remove this doctor registration?"
        )
    ) {
        return;
    }

    button.disabled = true;

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/doctors/${doctorId}`,
                {
                    method: "DELETE"
                }
            );

        if (
            !response.ok &&
            response.status !== 204
        ) {
            throw new Error("Rejection failed.");
        }

        showPendingMessage(
            "Doctor registration rejected.",
            "success"
        );

        await loadPendingDoctors();

    } catch (error) {

        console.error(
            "Doctor rejection error:",
            error
        );

        showPendingMessage(
            "Could not reject this doctor. Please try again.",
            "danger"
        );

        button.disabled = false;
    }
}

// Load pending doctors when admin dashboard opens
document.addEventListener(
    "DOMContentLoaded",
    loadPendingDoctors
);
