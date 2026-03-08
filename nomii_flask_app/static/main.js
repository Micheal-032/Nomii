// ===== GLOBAL STATE =====
let currentRole = "";
let isProcessing = false;
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

// ===== DOM ELEMENTS =====
// Resolved lazily to avoid null errors when script loads before DOM
function el(id) { return document.getElementById(id); }

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
    initEventListeners();
    checkSession();
    loadSavedAttempts();
});

function initEventListeners() {
    // Ripple effect on buttons
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('button');
        if (btn) createRippleEffect(btn, e);
    });
}

function loadSavedAttempts() {
    const saved = localStorage.getItem('loginAttempts');
    if (saved) loginAttempts = parseInt(saved, 10);
}

// ===== SESSION CHECK =====
// FIX #8 / #24: Only use localStorage for UI hints — real auth is server-side.
// We do NOT auto-redirect here anymore; the server-side session in /dashboard is authoritative.
function checkSession() {
    // Nothing to auto-redirect — server handles session validation via cookies
}

// ===== SECTION NAVIGATION =====
function showSignupSection(role) {
    currentRole = role || currentRole;
    if (!currentRole) { showRoleSelection(); return; }

    el('roleSelection').style.display = 'none';
    el('signupSection').style.display = 'block';
    el('loginSection').style.display = 'none';

    const titles = {
        R: 'Retailer Signup',
        S: 'Supplier Signup',
        D: 'Delivery Partner Signup',
        F: 'Farmer Signup',
        A: 'Artisan Signup'
    };
    el('signupTitle').textContent = titles[currentRole] || 'Signup';

    // Generate role-specific form fields
    el('signupForm').innerHTML = generateRoleFields(currentRole);

    // Attach password strength checker
    const pwdField = el('password');
    if (pwdField) pwdField.addEventListener('input', checkPasswordStrength);
}

function showRoleSelection() {
    el('roleSelection').style.display = 'block';
    el('signupSection').style.display = 'none';
    el('loginSection').style.display = 'none';
}

// FIX #25: Guard against empty currentRole when switching to signup from login
function showLoginSection() {
    el('roleSelection').style.display = 'none';
    el('signupSection').style.display = 'none';
    el('loginSection').style.display = 'block';
    el('loginId').value = '';
    el('loginPassword').value = '';
    const err = document.querySelector('#loginSection .login-error');
    if (err) err.remove();
}

// ===== FORM GENERATION =====
function generateRoleFields(role) {
    const fields = {
        R: `
            <div class="form-group">
                <label for="mobile">Mobile Number</label>
                <input type="tel" id="mobile" placeholder="10 digits starting with 6-9" inputmode="numeric" maxlength="10" required>
                <div class="error-message" id="mobile-error"></div>
            </div>
            <div class="form-group">
                <label for="aadhaarLast4">Last 4 Aadhaar Digits</label>
                <input type="text" id="aadhaarLast4" placeholder="Last 4 digits of your Aadhaar" inputmode="numeric" maxlength="4" required>
                <div class="error-message" id="aadhaar-error"></div>
            </div>
            <div class="form-group">
                <label for="gst">GST / Udyam Number</label>
                <input type="text" id="gst" placeholder="e.g. 22ABCDE1234F1Z5" maxlength="15" required>
                <div class="error-message" id="gst-error"></div>
            </div>
            <div class="form-group">
                <label for="shopName">Shop Name</label>
                <input type="text" id="shopName" placeholder="Minimum 3 characters" required>
                <div class="error-message" id="shop-error"></div>
            </div>
            ${passwordFields()}
        `,
        S: `
            <div class="form-group">
                <label for="mobile">Mobile Number</label>
                <input type="tel" id="mobile" placeholder="10 digits starting with 6-9" inputmode="numeric" maxlength="10" required>
                <div class="error-message" id="mobile-error"></div>
            </div>
            <div class="form-group">
                <label for="gst">GSTIN</label>
                <input type="text" id="gst" placeholder="e.g. 22ABCDE1234F1Z5" maxlength="15" required>
                <div class="error-message" id="gst-error"></div>
            </div>
            <div class="form-group">
                <label for="location">Business Location</label>
                <input type="text" id="location" placeholder="Minimum 3 characters" required>
                <div class="error-message" id="location-error"></div>
            </div>
            <div class="form-group">
                <label for="warehouseLocation">Warehouse Location / City</label>
                <input type="text" id="warehouseLocation" placeholder="e.g. Pune Logistics Park" required>
                <div class="error-message" id="warehouse-error"></div>
            </div>
            <div class="form-group">
                <label for="productCategories">Primary Product Categories</label>
                <input type="text" id="productCategories" placeholder="e.g. Grains, Processed Foods" required>
                <div class="error-message" id="categories-error"></div>
            </div>
            <div class="form-group">
                <label for="stockVolume">Avg. Monthly Stock Volume (Tons)</label>
                <input type="number" id="stockVolume" placeholder="e.g. 50" min="1" required>
                <div class="error-message" id="volume-error"></div>
            </div>
            ${passwordFields()}
        `,
        D: `
            <div class="form-group">
                <label for="mobile">Mobile Number</label>
                <input type="tel" id="mobile" placeholder="10 digits starting with 6-9" inputmode="numeric" maxlength="10" required>
                <div class="error-message" id="mobile-error"></div>
            </div>
            <div class="form-group">
                <label for="license">Driving License Number</label>
                <input type="text" id="license" placeholder="e.g. DL01-2023-1234567" required>
                <div class="error-message" id="license-error"></div>
            </div>
            <div class="form-group">
                <label for="area">Service Area</label>
                <input type="text" id="area" placeholder="Minimum 3 characters" required>
                <div class="error-message" id="area-error"></div>
            </div>
            ${passwordFields()}
        `,
        F: `
            <div class="form-group">
                <label for="fullName">Full Name</label>
                <input type="text" id="fullName" placeholder="Your full name" required>
                <div class="error-message" id="name-error"></div>
            </div>
            <div class="form-group">
                <label for="mobile">Mobile Number</label>
                <input type="tel" id="mobile" placeholder="10 digits starting with 6-9" inputmode="numeric" maxlength="10" required>
                <div class="error-message" id="mobile-error"></div>
            </div>
            <div class="form-group">
                <label for="aadhaarLast4">Last 4 Aadhaar Digits</label>
                <input type="text" id="aadhaarLast4" placeholder="Last 4 digits of your Aadhaar" inputmode="numeric" maxlength="4" required>
                <div class="error-message" id="aadhaar-error"></div>
            </div>
            <div class="form-group">
                <label for="village">Village / Area</label>
                <input type="text" id="village" placeholder="Minimum 3 characters" required>
                <div class="error-message" id="village-error"></div>
            </div>
            <div class="form-group">
                <label for="landSize">Landholding Size</label>
                <input type="text" id="landSize" placeholder="e.g. 3 acres" required>
                <div class="error-message" id="land-error"></div>
            </div>
            <div class="form-group">
                <label for="produce">Type of Produce</label>
                <input type="text" id="produce" placeholder="e.g. Rice, Tomatoes" required>
                <div class="error-message" id="produce-error"></div>
            </div>
            <div class="form-group">
                <label for="experience">Years of Experience</label>
                <input type="number" id="experience" placeholder="0 – 99" min="0" max="99" required>
                <div class="error-message" id="experience-error"></div>
            </div>
            <div class="form-group">
                <label for="soilType">Soil Type</label>
                <select id="soilType" required>
                    <option value="">Select Soil Type</option>
                    <option value="Alluvial">Alluvial</option>
                    <option value="Black">Black Cotton</option>
                    <option value="Red">Red Soil</option>
                    <option value="Laterite">Laterite</option>
                    <option value="Desert">Desert/Sandy</option>
                    <option value="Mountain">Mountain/Forest</option>
                </select>
                <div class="error-message" id="soil-error"></div>
            </div>
            <div class="form-group">
                <label for="waterSource">Main Water Source</label>
                <select id="waterSource" required>
                    <option value="">Select Water Source</option>
                    <option value="Rainfed">Rainfed (Monsoon)</option>
                    <option value="Canal">Canal</option>
                    <option value="Borewell">Borewell/Tubewell</option>
                    <option value="River">River</option>
                    <option value="Tank">Tank/Pond</option>
                </select>
                <div class="error-message" id="water-error"></div>
            </div>
            <div class="form-group">
                <label for="seasonalCrops">Seasonal Crops</label>
                <input type="text" id="seasonalCrops" placeholder="e.g. Kharif (Rice), Rabi (Wheat)" required>
                <div class="error-message" id="seasonalCrops-error"></div>
            </div>
            <div class="form-group">
                <label for="regId">Registration ID <span style="font-weight:400;color:#888">(Optional)</span></label>
                <input type="text" id="regId" placeholder="Govt. registration number if available">
            </div>
            ${passwordFields()}
        `,
        A: `
            <div class="form-group">
                <label for="mobile">Mobile Number</label>
                <input type="tel" id="mobile" placeholder="10 digits starting with 6-9" inputmode="numeric" maxlength="10" required>
                <div class="error-message" id="mobile-error"></div>
            </div>
            <div class="form-group">
                <label for="aadhaarLast4">Last 4 Aadhaar Digits</label>
                <input type="text" id="aadhaarLast4" placeholder="Last 4 digits of your Aadhaar" inputmode="numeric" maxlength="4" required>
                <div class="error-message" id="aadhaar-error"></div>
            </div>
            <div class="form-group">
                <label for="craftType">Craft Type</label>
                <input type="text" id="craftType" placeholder="e.g. Pottery, Weaving" required>
                <div class="error-message" id="craft-error"></div>
            </div>
            <div class="form-group">
                <label for="region">Region / City</label>
                <input type="text" id="region" placeholder="Minimum 3 characters" required>
                <div class="error-message" id="region-error"></div>
            </div>
            <div class="form-group">
                <label for="productionCapacity">Monthly Production Capacity</label>
                <input type="text" id="productionCapacity" placeholder="e.g. 500 units, 100 kg" required>
                <div class="error-message" id="capacity-error"></div>
            </div>
            <div class="form-group">
                <label for="groupId">Artisan Group ID <span style="font-weight:400;color:#888">(Optional)</span></label>
                <input type="text" id="groupId" placeholder="Alphanumeric group code">
            </div>
            ${passwordFields()}
        `
    };
    return fields[role] || '';
}

// FIX #22: Added Confirm Password field to every form
function passwordFields() {
    return `
        <div class="form-group">
            <label for="password">Password</label>
            <div class="password-container">
                <input type="password" id="password" placeholder="Min 8 chars, upper, lower, number, special" required>
                <button type="button" class="toggle-password" id="togglePassword" 
                    aria-label="Toggle password visibility"
                    onclick="togglePasswordVisibility('password', 'togglePassword')">
                    <i class="far fa-eye"></i>
                </button>
            </div>
            <div class="error-message" id="password-error"></div>
            <div class="password-strength" id="password-strength" style="display:none"></div>
            <div class="password-feedback" id="password-feedback"></div>
        </div>
        <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <div class="password-container">
                <input type="password" id="confirmPassword" placeholder="Re-enter your password" required>
                <button type="button" class="toggle-password" id="toggleConfirm"
                    aria-label="Toggle confirm password visibility"
                    onclick="togglePasswordVisibility('confirmPassword', 'toggleConfirm')">
                    <i class="far fa-eye"></i>
                </button>
            </div>
            <div class="error-message" id="confirmPassword-error"></div>
        </div>
    `;
}

// ===== PASSWORD VISIBILITY TOGGLE =====
// FIX #11/#12: Use button ID directly — no broken sibling CSS selector
function togglePasswordVisibility(fieldId, btnId) {
    const field = el(fieldId);
    const btn = el(btnId);
    if (!field || !btn) return;
    const icon = btn.querySelector('i');
    if (field.type === 'password') {
        field.type = 'text';
        if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    } else {
        field.type = 'password';
        if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
    }
}

// ===== PASSWORD STRENGTH =====
// FIX #20: Strength capped at 4 for CSS meter compatibility
function checkPasswordStrength() {
    const password = el('password').value;
    const meter = el('password-strength');
    const feedback = el('password-feedback');
    if (!password) {
        if (meter) meter.style.display = 'none';
        if (feedback) feedback.textContent = '';
        return;
    }
    if (meter) meter.style.display = 'block';

    let strength = 0;
    const missing = [];
    if (password.length >= 8) strength++; else missing.push('8+ characters');
    if (/[A-Z]/.test(password)) strength++; else missing.push('uppercase letter');
    if (/[a-z]/.test(password)) strength++; else missing.push('lowercase letter');
    if (/\d/.test(password)) strength++; else missing.push('a number');
    if (/[\W_]/.test(password)) strength++;  // 5th check but capped below

    // Common passwords
    if (['password', '123456', 'qwerty', 'nomii123'].includes(password.toLowerCase())) {
        strength = 0;
        missing.length = 0;
        missing.push('something less common');
    }
    if (/(abc|123|xyz|987)/i.test(password)) {
        strength = Math.max(0, strength - 1);
        missing.push('avoid sequential chars');
    }

    // Cap to 4 for CSS meter
    const displayStrength = Math.min(strength, 4);
    if (meter) meter.setAttribute('data-strength', displayStrength);

    if (feedback) {
        if (displayStrength < 4 && password.length > 0) {
            feedback.textContent = `Add: ${missing.join(', ')}`;
            feedback.style.color = displayStrength < 2 ? '#e74c3c' : displayStrength < 3 ? '#f39c12' : '#f1c40f';
        } else if (password.length > 0) {
            feedback.textContent = '✓ Strong password!';
            feedback.style.color = '#2ecc71';
        }
    }
}

// ===== FORM DATA COLLECTION =====
function collectFormData() {
    const fieldMap = {
        R: ['mobile', 'aadhaarLast4', 'gst', 'shopName', 'password', 'confirmPassword'],
        S: ['mobile', 'gst', 'location', 'warehouseLocation', 'productCategories', 'stockVolume', 'password', 'confirmPassword'],
        D: ['mobile', 'license', 'area', 'password', 'confirmPassword'],
        F: ['fullName', 'mobile', 'aadhaarLast4', 'village', 'landSize', 'produce', 'experience', 'soilType', 'waterSource', 'seasonalCrops', 'regId', 'password', 'confirmPassword'],
        A: ['mobile', 'aadhaarLast4', 'craftType', 'region', 'productionCapacity', 'groupId', 'password', 'confirmPassword']
    };
    const data = {};
    (fieldMap[currentRole] || []).forEach(field => {
        const elem = el(field);
        if (elem) data[field] = elem.value.trim();
    });
    return data;
}

// ===== CLIENT-SIDE VALIDATION =====
// Helpers
const BLOCKED_AADHAAR = new Set(['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999']);
function isValidAadhaar(v) { return /^\d{4}$/.test(v) && !BLOCKED_AADHAAR.has(v); }
function isValidMobile(v) { return /^[6-9]\d{9}$/.test(v); }
function isValidGst(v) { return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(v); }
function isValidPassword(v) { return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}/.test(v); }
function isValidLicense(v) { return /^[A-Z]{2}\d{2,4}-\d{4}-\d{6,7}$/i.test(v); }
function isValidName(v) { return v && v.length >= 2 && /^[a-zA-Z][a-zA-Z .'-]*$/.test(v); }

function validateFormData(data) {
    const errors = {};

    // Mobile – every role
    if (!isValidMobile(data.mobile))
        errors.mobile = 'Enter a valid 10-digit Indian mobile number (starts with 6–9)';

    // Password – every role
    if (!isValidPassword(data.password))
        errors.password = 'Password needs 8+ chars with uppercase, lowercase, number & special char';

    // Confirm password
    if (data.confirmPassword !== undefined && data.confirmPassword !== data.password)
        errors.confirmPassword = 'Passwords do not match';

    // Role-specific
    if (currentRole === 'R') {
        if (!isValidAadhaar(data.aadhaarLast4))
            errors.aadhaar = 'Enter last 4 digits of Aadhaar (no all-repeating digits)';
        if (!isValidGst(data.gst))
            errors.gst = 'Invalid GST format — e.g. 22ABCDE1234F1Z5';
        if (!data.shopName || data.shopName.length < 3)
            errors.shop = 'Shop name needs at least 3 characters';

    } else if (currentRole === 'S') {
        if (!isValidGst(data.gst))
            errors.gst = 'Invalid GSTIN format — e.g. 22ABCDE1234F1Z5';
        if (!data.location || data.location.length < 3)
            errors.location = 'Business location needs at least 3 characters';
        if (!data.warehouseLocation || data.warehouseLocation.length < 3)
            errors.warehouse = 'Warehouse location needs at least 3 characters';
        if (!data.productCategories || data.productCategories.length < 3)
            errors.categories = 'Product categories are required';
        if (!data.stockVolume || data.stockVolume < 1)
            errors.volume = 'Please enter valid stock volume';

    } else if (currentRole === 'D') {
        if (!isValidLicense(data.license))
            errors.license = 'Invalid license — e.g. DL01-2023-1234567';
        if (!data.area || data.area.length < 3)
            errors.area = 'Service area needs at least 3 characters';

    } else if (currentRole === 'F') {
        if (!isValidName(data.fullName))
            errors.name = 'Enter your full name (letters, spaces, . or - allowed)';
        if (!isValidAadhaar(data.aadhaarLast4))
            errors.aadhaar = 'Enter last 4 digits of Aadhaar (no all-repeating digits)';
        if (!data.village || data.village.length < 3)
            errors.village = 'Village / Area needs at least 3 characters';
        if (!data.landSize)
            errors.land = 'Landholding size is required';
        if (!data.produce)
            errors.produce = 'Type of produce is required';
        const exp = data.experience === '' ? NaN : Number(data.experience);
        if (isNaN(exp) || exp < 0 || exp > 99)
            errors.experience = 'Years of experience must be 0–99';
        if (!data.soilType)
            errors.soil = 'Please select a soil type';
        if (!data.waterSource)
            errors.water = 'Please select a water source';
        if (!data.seasonalCrops || data.seasonalCrops.length < 3)
            errors.seasonalCrops = 'Seasonal crops info is required';

    } else if (currentRole === 'A') {
        if (!isValidAadhaar(data.aadhaarLast4))
            errors.aadhaar = 'Enter last 4 digits of Aadhaar (no all-repeating digits)';
        if (!data.craftType || data.craftType.length < 3)
            errors.craft = 'Craft type needs at least 3 characters';
        if (!data.region || data.region.length < 3)
            errors.region = 'Region / City needs at least 3 characters';
        if (!data.productionCapacity || data.productionCapacity.length < 2)
            errors.capacity = 'Production capacity is required';
        if (data.groupId && !/^[a-zA-Z0-9]+$/.test(data.groupId))
            errors.group = 'Group ID must be alphanumeric only';
    }

    return { isValid: Object.keys(errors).length === 0, errors };
}

function showValidationErrors(errors) {
    // Reset previous errors
    document.querySelectorAll('.error-message').forEach(e => { e.textContent = ''; e.style.display = 'none'; });
    document.querySelectorAll('input').forEach(e => e.classList.remove('error'));

    // Remove old top banner if any
    const oldBanner = document.getElementById('_formBanner');
    if (oldBanner) oldBanner.remove();

    if (Object.keys(errors).length === 0) return;

    // Try to map each error to a specific field
    const fieldMap = {
        mobile: 'mobile', password: 'password', confirmPassword: 'confirmPassword',
        aadhaar: 'aadhaarLast4', gst: 'gst', shop: 'shopName', location: 'location',
        license: 'license', area: 'area', name: 'fullName', village: 'village',
        land: 'landSize', produce: 'produce', experience: 'experience',
        soil: 'soilType', water: 'waterSource', seasonalCrops: 'seasonalCrops',
        craft: 'craftType', region: 'region', capacity: 'productionCapacity', group: 'groupId'
    };

    let unmapped = [];
    let firstBad = null;
    for (const [key, msg] of Object.entries(errors)) {
        const errEl = document.getElementById(`${key}-error`);
        const inpId = fieldMap[key] || key;
        const inpEl = document.getElementById(inpId);
        if (errEl) {
            errEl.textContent = msg;
            errEl.style.display = 'block';
        } else {
            unmapped.push(msg);
        }
        if (inpEl) {
            inpEl.classList.add('error');
            if (!firstBad) firstBad = inpEl;
        }
    }

    // All unmapped messages → single top banner
    if (unmapped.length) {
        const banner = document.createElement('div');
        banner.id = '_formBanner';
        banner.style.cssText = 'color:#e74c3c;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.4);' +
            'border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:14px;text-align:center';
        banner.textContent = unmapped.join(' | ');
        const form = document.getElementById('signupForm');
        if (form) form.insertAdjacentElement('afterend', banner);
    }

    // Scroll to first bad field
    if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== SIGNUP FLOW =====
async function processSignup() {
    if (isProcessing) return;
    isProcessing = true;

    const formData = collectFormData();
    const validation = validateFormData(formData);

    if (!validation.isValid) {
        showValidationErrors(validation.errors);
        isProcessing = false;
        return;
    }

    const submitBtn = document.querySelector('#signupSection .submit-btn');
    if (submitBtn) submitBtn.classList.add('loading');

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: currentRole, ...formData })
        });
        const result = await response.json();

        if (result.success) {
            // FIX #9: Show popup FIRST; download triggered by button inside popup
            showSuccessPopup(result.loginId, result.excelFile);
        } else {
            // FIX #10: Use result.message (not result.error)
            showValidationErrors({ form: result.message || 'Signup failed. Please try again.' });
        }
    } catch (err) {
        console.error('Signup error:', err);
        showValidationErrors({ form: 'Connection error. Please try again.' });
    } finally {
        isProcessing = false;
        if (submitBtn) submitBtn.classList.remove('loading');
    }
}

// ===== POPUP =====
let _pendingExcelFile = null;

function showSuccessPopup(loginId, excelFile) {
    _pendingExcelFile = excelFile;
    el('generatedLoginId').textContent = loginId;
    el('loginIdPopup').style.display = 'flex';
}

function closePopup() {
    el('loginIdPopup').style.display = 'none';
}

function goToLogin() {
    closePopup();
    showLoginSection();
}

// FIX #28: Download triggered as explicit user action from popup button
function downloadCard() {
    if (_pendingExcelFile) {
        const link = document.createElement('a');
        link.href = `/download/${_pendingExcelFile}`;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function copyLoginId() {
    const id = el('generatedLoginId').textContent;
    navigator.clipboard.writeText(id).then(() => {
        const icon = el('copyLoginIdBtn').querySelector('i');
        if (icon) { icon.classList.replace('fa-copy', 'fa-check'); }
        showToast('Login ID copied!');
        setTimeout(() => {
            if (icon) icon.classList.replace('fa-check', 'fa-copy');
        }, 2000);
    }).catch(() => showToast('Copy failed', true));
}

// ===== LOGIN FLOW =====
async function processLogin() {
    if (isProcessing) return;

    // Check client-side lockout
    const lockoutTime = localStorage.getItem('lockoutTime');
    if (lockoutTime && Date.now() < parseInt(lockoutTime, 10)) {
        const remaining = Math.ceil((parseInt(lockoutTime, 10) - Date.now()) / 60000);
        showLoginError(`Account locked. Try again in ${remaining} minute(s).`);
        return;
    }

    isProcessing = true;
    const loginId = el('loginId').value.trim();
    const password = el('loginPassword').value;

    if (!loginId || !password) {
        showLoginError('Please enter both Login ID and password.');
        isProcessing = false;
        return;
    }

    const loginBtn = document.querySelector('#loginSection .submit-btn');
    if (loginBtn) loginBtn.classList.add('loading');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginId, password })
        });
        const result = await response.json();

        if (result.success) {
            // Successful login — clear lockout counters
            loginAttempts = 0;
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('lockoutTime');
            // FIX #13: Actually redirect to the dashboard page
            window.location.href = result.redirect || '/dashboard';
        } else {
            // FIX #14: Use result.message (not result.error)
            loginAttempts++;
            localStorage.setItem('loginAttempts', loginAttempts);
            if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                localStorage.setItem('lockoutTime', Date.now() + LOCKOUT_DURATION);
            }
            showLoginError(result.message || 'Invalid credentials. Please try again.');
        }
    } catch (err) {
        console.error('Login error:', err);
        showLoginError('Connection error. Please try again.');
    } finally {
        isProcessing = false;
        if (loginBtn) loginBtn.classList.remove('loading');
    }
}

// FIX #15: Append error to loginSection directly, not to a nested form-group
function showLoginError(message) {
    let errEl = document.querySelector('#loginSection .login-error');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'login-error';
        // Append after the last .form-group, before the button
        const section = el('loginSection');
        const btn = section.querySelector('.submit-btn');
        section.insertBefore(errEl, btn);
    }
    errEl.textContent = message;
}

// ===== TOAST NOTIFICATION =====
function showToast(message, isError = false) {
    let toast = el('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.style.cssText = `
            position:fixed; bottom:24px; right:24px; z-index:9999;
            background:#22c55e; color:white; padding:12px 20px;
            border-radius:10px; font-size:14px; font-weight:500;
            display:flex; align-items:center; gap:8px;
            box-shadow:0 4px 20px rgba(0,0,0,0.15);
            transition:all 0.4s ease; opacity:0; transform:translateY(30px);
        `;
        document.body.appendChild(toast);
    }
    toast.style.background = isError ? '#e74c3c' : '#22c55e';
    toast.innerHTML = `<i class="fas ${isError ? 'fa-times-circle' : 'fa-check-circle'}"></i> ${message}`;
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(30px)';
    }, 2500);
}

// ===== RIPPLE EFFECT =====
function createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

// ===== EXPOSE GLOBALLY (for onclick attributes) =====
window.showSignupSection = showSignupSection;
window.showRoleSelection = showRoleSelection;
window.showLoginSection = showLoginSection;
window.processSignup = processSignup;
window.processLogin = processLogin;
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyLoginId = copyLoginId;
window.downloadCard = downloadCard;
window.goToLogin = goToLogin;
window.closePopup = closePopup;