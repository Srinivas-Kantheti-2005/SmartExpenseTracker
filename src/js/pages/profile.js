// Profile Page JavaScript
const USERS_API_URL = 'http://localhost:3004/users';
const TRANSACTIONS_API_URL = 'http://localhost:3004/transactions';

let currentUser = null;

let cropperInstance = null;

document.addEventListener('DOMContentLoaded', async function () {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../auth/login.html';
        return;
    }
    currentUser = JSON.parse(userStr);

    // If lastLogin is null (for existing users), set it to now
    if (!currentUser.lastLogin) {
        currentUser.lastLogin = new Date().toISOString();
        localStorage.setItem('user', JSON.stringify(currentUser));

        // Update in database
        try {
            await fetch(`${USERS_API_URL}/${currentUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lastLogin: currentUser.lastLogin })
            });
        } catch (error) {
            console.error('Failed to update lastLogin:', error);
        }
    }

    await loadProfileData();

    // Attach Event Listeners
    document.getElementById('avatarUpload').addEventListener('change', handleAvatarUpload);

    // Modify/Update button functionality
    const btnModify = document.getElementById('btnModifyBasicInfo');
    const btnUpdate = document.getElementById('btnUpdateBasicInfo');
    const fullNameInput = document.getElementById('fullName');
    const mobileInput = document.getElementById('mobile');
    const dobInput = document.getElementById('dob');

    btnModify.addEventListener('click', function () {
        // Enable editing
        fullNameInput.removeAttribute('readonly');
        mobileInput.removeAttribute('readonly');
        // Note: dobInput is handled by Flatpickr, don't modify its readonly state

        // Toggle buttons
        btnModify.style.display = 'none';
        btnUpdate.style.display = 'inline-block';

        // Enable calendar icon
        updateCalendarIconState();
    });

    document.getElementById('basicInfoForm').addEventListener('submit', handleBasicInfoUpdate);
    document.getElementById('financialPrefsForm').addEventListener('submit', handleFinancialPrefsUpdate);
    document.getElementById('btnExport').addEventListener('click', handleExportData);
    document.getElementById('btnDeleteAccount').addEventListener('click', handleDeleteAccount);

    // --- Calendar Icon Logic ---
    let dobPicker = null;

    if (typeof flatpickr !== 'undefined' && dobInput) {
        dobPicker = flatpickr(dobInput, {
            dateFormat: "d-m-Y",
            maxDate: "today",
            allowInput: false,
            clickOpens: false, // Only open via icon click
            disableMobile: "true"
        });
    }

    const dobIcon = document.getElementById('dobCalendarIcon');

    // Function to update calendar icon state
    function updateCalendarIconState() {
        const isLocked = document.getElementById('fullName').hasAttribute('readonly');
        if (dobIcon) {
            if (isLocked) {
                dobIcon.style.opacity = '0.3';
                dobIcon.style.cursor = 'not-allowed';
                dobIcon.style.pointerEvents = 'none';
            } else {
                dobIcon.style.opacity = '1';
                dobIcon.style.cursor = 'pointer';
                dobIcon.style.pointerEvents = 'auto';
            }
        }
    }

    // Initialize icon state
    updateCalendarIconState();

    if (dobIcon && dobPicker) {
        dobIcon.addEventListener('click', () => {
            dobPicker.open();
        });
    }

    // --- Password Modal Logic ---
    const passwordModal = document.getElementById('passwordModal');
    const btnOpenPasswordModal = document.getElementById('btnOpenPasswordModal');
    const btnClosePasswordModal = document.getElementById('closePasswordModal');
    const modalSecurityForm = document.getElementById('modalSecurityForm');

    // Open Modal
    if (btnOpenPasswordModal) {
        btnOpenPasswordModal.addEventListener('click', (e) => {
            e.preventDefault();
            passwordModal.classList.add('active');
        });
    }

    // Close Modal
    if (btnClosePasswordModal) {
        btnClosePasswordModal.addEventListener('click', () => {
            passwordModal.classList.remove('active');
            modalSecurityForm.reset();
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            passwordModal.classList.remove('active');
            modalSecurityForm.reset();
        }
        // Close cropper modal on outside click
        const cropperModal = document.getElementById('cropperModal');
        if (e.target === cropperModal) {
            closeCropperModal();
        }
    });

    // Handle Password Change Submit
    if (modalSecurityForm) {
        modalSecurityForm.addEventListener('submit', handlePasswordChangeModal);
    }

    // Toggle Password Visibility (Universal for all toggles)
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input.type === "password") {
                input.type = "text";
                this.textContent = "◉"; // Hide icon
            } else {
                input.type = "password";
                this.textContent = "◎"; // Show icon
            }
        });
    });

    // --- Cropper Modal Logic ---
    const cropperModal = document.getElementById('cropperModal');
    const btnCloseCropperModal = document.getElementById('closeCropperModal');
    const btnCancelCrop = document.getElementById('btnCancelCrop');
    const btnSaveCrop = document.getElementById('btnSaveCrop');

    if (btnCloseCropperModal) {
        btnCloseCropperModal.addEventListener('click', closeCropperModal);
    }

    if (btnCancelCrop) {
        btnCancelCrop.addEventListener('click', closeCropperModal);
    }

    if (btnSaveCrop) {
        btnSaveCrop.addEventListener('click', saveCroppedImage);
    }

    // --- Delete Account Modal Logic ---
    const deleteModal = document.getElementById('deleteAccountModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const deleteForm = document.getElementById('deleteAccountForm');
    const deleteInput = document.getElementById('deleteConfirmationInput');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', () => {
            deleteModal.classList.remove('active');
            deleteInput.value = '';
            confirmDeleteBtn.disabled = true;
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
            deleteInput.value = '';
            confirmDeleteBtn.disabled = true;
        });
    }

    // Confirm button is now enabled by default, so we don't need the input listener to toggle it.
    // The validation happens on click: Incorrect input -> Close modal (Cancel behavior).

    // Handle Delete Submit
    if (deleteForm) {
        deleteForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // If input is NOT correct, treat it as a Cancel action
            if (deleteInput.value !== 'DELETE ACCOUNT') {
                deleteModal.classList.remove('active');
                deleteInput.value = '';
                return;
            }

            // If input IS correct, proceed with deletion
            try {
                // Determine user endpoint - could be dynamic based on current config but using constant for now
                await fetch(`${USERS_API_URL}/${currentUser.id}`, { method: 'DELETE' });
                alert("Account deleted. Goodbye.");
                localStorage.clear();
                window.location.href = '../auth/login.html';
            } catch (error) {
                console.error(error);
                alert("Failed to delete account.");
            }
        });
    }

    // Close modal on outside click (reusing the existing window click listener would be better but adding specific check here is safe)
    window.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.classList.remove('active');
            deleteInput.value = '';
            confirmDeleteBtn.disabled = true;
        }
    });
});

async function loadProfileData() {
    try {
        console.log('Loading profile for user:', currentUser);
        console.log('Fetching URL:', `${USERS_API_URL}/${currentUser.id}`);
        const response = await fetch(`${USERS_API_URL}/${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const user = await response.json();

        // --- 1. Header & Basic Info ---
        // 2.2 Retrieve user name from registration (user.name)
        document.querySelector('.profile-name').textContent = user.name;
        document.getElementById('fullName').value = user.name || '';

        // 2.3 Retrieve email from registration (user.email)
        document.querySelector('.profile-email').textContent = user.email;
        document.getElementById('email').value = user.email || '';

        // Other Basic Fields
        document.getElementById('mobile').value = user.phone || '';

        // Set DOB to today's date if not set
        if (user.dob) {
            document.getElementById('dob').value = user.dob;
        } else {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('dob').value = today;
        }

        // Update Avatar in Profile Header
        const avatarEl = document.querySelector('.profile-avatar-large .avatar-placeholder');
        avatarEl.innerHTML = ''; // Clear previous

        if (user.avatar) {
            if (user.avatar.startsWith('http') || user.avatar.startsWith('data:image')) {
                avatarEl.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                avatarEl.textContent = user.avatar;
            }
        } else {
            avatarEl.textContent = "👤";
        }

        // Update Header User Avatar
        const headerAvatar = document.querySelector('.user-avatar .avatar');
        if (headerAvatar) {
            if (user.avatar) {
                if (user.avatar.startsWith('http') || user.avatar.startsWith('data:image')) {
                    headerAvatar.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    headerAvatar.textContent = user.avatar;
                }
            } else {
                headerAvatar.textContent = "👤";
            }
        }

        // --- 2. Account Overview & Member Grade ---
        if (user.createdAt) {
            const joinedDate = new Date(user.createdAt);
            // 2.4 Purple background member badge
            const monthYear = joinedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            document.querySelector('.member-since-purple').textContent = `Member since ${monthYear}`;

            // 4.2 Account Created On (Date)
            document.getElementById('accountCreated').textContent = joinedDate.toLocaleString();
        }

        // 4.3 Last Login (Time/Date)
        if (user.lastLogin) {
            document.getElementById('lastLogin').textContent = new Date(user.lastLogin).toLocaleString();
        } else {
            document.getElementById('lastLogin').textContent = "Not recorded yet";
        }

        // --- 3. Financial Preferences ---
        const settings = user.settings || {};
        document.getElementById('prefCurrency').value = settings.currency || 'INR';
        document.getElementById('startDay').value = settings.monthStartDay || 1;

        // --- 4. Security - Display Current Password ---
        const currentPasswordDisplay = document.getElementById('currentPasswordDisplay');
        if (currentPasswordDisplay && user.password) {
            currentPasswordDisplay.value = user.password;
        }

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// --- Action Handlers ---

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("Image is too large. Please choose an image under 2MB.");
        e.target.value = ''; // Reset file input
        return;
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file.");
        e.target.value = ''; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const imageDataUrl = event.target.result;
        openCropperModal(imageDataUrl);
        // Reset file input so the same file can be selected again
        e.target.value = '';
    };
    reader.readAsDataURL(file);
}

async function handleBasicInfoUpdate(e) {
    e.preventDefault();
    const newName = document.getElementById('fullName').value;
    const newPhone = document.getElementById('mobile').value;
    const newDob = document.getElementById('dob').value;

    try {
        await updateUserField({
            name: newName,
            phone: newPhone,
            dob: newDob
        });

        alert('Personal information updated!');
        document.querySelector('.profile-name').textContent = newName;

        // Update local storage user object name too
        const lsUser = JSON.parse(localStorage.getItem('user'));
        lsUser.name = newName;
        localStorage.setItem('user', JSON.stringify(lsUser));
        if (window.updateUserProfile) window.updateUserProfile();

        // Restore readonly state and toggle buttons
        const fullNameInput = document.getElementById('fullName');
        const mobileInput = document.getElementById('mobile');
        const dobInput = document.getElementById('dob');
        const btnModify = document.getElementById('btnModifyBasicInfo');
        const btnUpdate = document.getElementById('btnUpdateBasicInfo');

        fullNameInput.setAttribute('readonly', 'readonly');
        mobileInput.setAttribute('readonly', 'readonly');
        // Note: dobInput is handled by Flatpickr, don't modify its readonly state

        btnUpdate.style.display = 'none';
        btnModify.style.display = 'inline-block';

    } catch (error) {
        console.error(error);
        alert('Failed to update information.');
    }
}

async function handleFinancialPrefsUpdate(e) {
    e.preventDefault();
    const currency = document.getElementById('prefCurrency').value;
    const startDay = document.getElementById('startDay').value;

    try {
        // Fetch current settings first to merge
        const response = await fetch(`${USERS_API_URL}/${currentUser.id}`);
        const user = await response.json();
        const settings = user.settings || {};

        const newSettings = {
            ...settings,
            currency: currency,
            monthStartDay: parseInt(startDay)
        };

        await updateUserField({ settings: newSettings });

        // Update local storage appSettings
        localStorage.setItem('appSettings', JSON.stringify(newSettings));

        // Update currentUser in localStorage with new settings
        currentUser.settings = newSettings;
        localStorage.setItem('user', JSON.stringify(currentUser));

        alert('Financial preferences updated successfully!');
    } catch (error) {
        console.error(error);
        alert('Failed to save preferences.');
    }
}

async function handlePasswordChangeModal(e) {
    e.preventDefault();
    const currentPass = document.getElementById('modalCurrentPassword').value;
    const newPass = document.getElementById('modalNewPassword').value;
    const confirmPass = document.getElementById('modalConfirmPassword').value;

    // Basic Validation
    if (!currentPass || !newPass || !confirmPass) {
        alert("Please fill in all password fields.");
        return;
    }

    if (newPass !== confirmPass) {
        alert("New password and confirm password do not match.");
        return;
    }

    if (newPass.length < 6) {
        alert("New password must be at least 6 characters.");
        return;
    }

    try {
        // Verify current password
        const response = await fetch(`${USERS_API_URL}/${currentUser.id}`);
        const user = await response.json();

        if (user.password !== currentPass) {
            alert("Current password is incorrect.");
            return;
        }

        // Update Password
        await updateUserField({ password: newPass });

        // Update the current password display field in the Security section
        document.getElementById('currentPasswordDisplay').value = newPass;

        alert("Password changed successfully!");

        // Close modal
        document.getElementById('passwordModal').classList.remove('active');
        document.getElementById('modalSecurityForm').reset();

    } catch (error) {
        console.error(error);
        alert("Error changing password.");
    }
}

async function handleExportData() {
    try {
        const response = await fetch(`${TRANSACTIONS_API_URL}?userId=${currentUser.id}`);
        const transactions = await response.json();

        if (transactions.length === 0) {
            alert("No transactions to export.");
            return;
        }

        const headers = ["ID", "Date", "Type", "Category", "Subcategory/Description", "Amount"];
        const csvRows = [headers.join(",")];

        transactions.forEach(tx => {
            const row = [
                tx.id,
                tx.date,
                tx.type,
                tx.category,
                `"${(tx.description || tx.note || '').replace(/"/g, '""')}"`,
                tx.amount
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to export data.");
    }
}

async function handleDeleteAccount() {
    const deleteModal = document.getElementById('deleteAccountModal');
    if (deleteModal) {
        deleteModal.classList.add('active');
    }
}

// --- Helper ---
async function updateUserField(patchData) {
    const response = await fetch(`${USERS_API_URL}/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData)
    });
    if (!response.ok) throw new Error('Update failed');
    return await response.json();
}

// --- Image Cropper Functions ---

function openCropperModal(imageDataUrl) {
    const cropperModal = document.getElementById('cropperModal');
    const cropperImage = document.getElementById('cropperImage');

    // Set image source
    cropperImage.src = imageDataUrl;

    // Show modal
    cropperModal.classList.add('active');

    // Initialize Cropper.js after modal is visible
    setTimeout(() => {
        if (cropperInstance) {
            cropperInstance.destroy();
        }

        cropperInstance = new Cropper(cropperImage, {
            aspectRatio: 1, // Square crop for profile picture
            viewMode: 2, // Restrict crop box to canvas
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            responsive: true,
            background: false,
            modal: true,
            minContainerWidth: 200,
            minContainerHeight: 200,
        });
    }, 100);
}

function closeCropperModal() {
    const cropperModal = document.getElementById('cropperModal');

    // Destroy cropper instance
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }

    // Hide modal
    cropperModal.classList.remove('active');

    // Clear image source
    const cropperImage = document.getElementById('cropperImage');
    cropperImage.src = '';
}

async function saveCroppedImage() {
    if (!cropperInstance) return;

    try {
        // Get cropped canvas
        const canvas = cropperInstance.getCroppedCanvas({
            width: 300,
            height: 300,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        // Convert to base64
        const base64String = canvas.toDataURL('image/jpeg', 0.9);

        // Update avatar in database
        await updateUserField({ avatar: base64String });

        // Update Profile Header Avatar
        const avatarEl = document.querySelector('.profile-avatar-large .avatar-placeholder');
        avatarEl.innerHTML = `<img src="${base64String}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;

        // Update Header User Avatar
        const headerAvatar = document.querySelector('.user-avatar .avatar');
        if (headerAvatar) {
            headerAvatar.innerHTML = `<img src="${base64String}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }

        // Update LocalStorage
        const lsUser = JSON.parse(localStorage.getItem('user'));
        lsUser.avatar = base64String;
        localStorage.setItem('user', JSON.stringify(lsUser));
        if (window.updateUserProfile) window.updateUserProfile();

        // Close modal
        closeCropperModal();

        alert("Profile image updated successfully!");
    } catch (error) {
        console.error("Failed to save cropped image:", error);
        alert("Failed to update profile image. Please try again.");
    }
}
