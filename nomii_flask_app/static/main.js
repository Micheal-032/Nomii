// ===== GLOBAL VARIABLES =====
let currentRole = "";
let isProcessing = false;
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let lockoutTimer = null;

// ===== DOM ELEMENTS =====
const elements = {
    roleSelection: document.getElementById('roleSelection'),
    signupSection: document.getElementById('signupSection'),
    loginSection: document.getElementById('loginSection'),
    signupTitle: document.getElementById('signupTitle'),
    signupForm: document.getElementById('signupForm'),
    loginIdPopup: document.getElementById('loginIdPopup'),
    generatedLoginId: document.getElementById('generatedLoginId')
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    initEventListeners();
    
    // Check for session storage
    checkSession();
});

function initEventListeners() {
    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', showRoleSelection);
    });
    
    // Copy login ID button
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyLoginId);
    }
    
    // Password toggle buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('toggle-password') || 
            e.target.closest('.toggle-password')) {
            const toggleBtn = e.target.classList.contains('toggle-password') ? 
                e.target : e.target.closest('.toggle-password');
            const fieldId = toggleBtn.previousElementSibling.id;
            togglePasswordVisibility(fieldId);
        }
    });
    
    // Ripple effect for buttons
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            const btn = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
            createRippleEffect(btn, e);
        }
    });
}

// ===== ROLE SELECTION =====
function showSignupSection(role) {
    currentRole = role;
    elements.roleSelection.style.display = 'none';
    elements.signupSection.style.display = 'block';
    elements.loginSection.style.display = 'none';
    
    // Set title based on role
    const titles = {
        'R': 'Retailer Signup',
        'S': 'Supplier Signup',
        'D': 'Delivery Partner Signup',
        'F': 'Farmer Signup'
    };
    elements.signupTitle.textContent = titles[role];
    
    // Generate form fields
    elements.signupForm.innerHTML = generateRoleFields(role);
    
    // Add password strength checker
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('input', checkPasswordStrength);
    }
}

function showRoleSelection() {
    elements.roleSelection.style.display = 'block';
    elements.signupSection.style.display = 'none';
    elements.loginSection.style.display = 'none';
}

// ===== FORM GENERATION =====
function generateRoleFields(role) {
    const fields = {
        'R': `
            <div class="form-group">
                <input type="text" id="mobile" placeholder="Mobile (10 digits starting with 6-9)" required>
                <div class="error-message" id="mobile-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="aadhaarLast4" placeholder="Last 4 Aadhaar digits (not 0000/1234)" required>
                <div class="error-message" id="aadhaar-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="gst" placeholder="GST/Udyam Number (22ABCDE1234F1Z5)" required>
                <div class="error-message" id="gst-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="shopName" placeholder="Shop Name (min 3 characters)" required>
                <div class="error-message" id="shop-error"></div>
            </div>
            <div class="form-group">
                <div class="password-container">
                    <input type="password" id="password" placeholder="Create Password (8+ chars)" required>
                    <span class="toggle-password" onclick="togglePasswordVisibility('password')">
                        <i class="far fa-eye"></i>
                    </span>
                </div>
                <div class="error-message" id="password-error"></div>
                <div class="password-strength" id="password-strength"></div>
                <div class="password-feedback" id="password-feedback"></div>
            </div>
        `,
        'S': `
            <div class="form-group">
                <input type="text" id="mobile" placeholder="Mobile (10 digits)" required>
                <div class="error-message" id="mobile-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="gst" placeholder="GSTIN (22ABCDE1234F1Z5)" required>
                <div class="error-message" id="gst-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="location" placeholder="Business Location (min 3 chars)" required>
                <div class="error-message" id="location-error"></div>
            </div>
            <div class="form-group">
                <div class="password-container">
                    <input type="password" id="password" placeholder="Create Password (8+ chars)" required>
                    <span class="toggle-password" onclick="togglePasswordVisibility('password')">
                        <i class="far fa-eye"></i>
                    </span>
                </div>
                <div class="error-message" id="password-error"></div>
                <div class="password-strength" id="password-strength"></div>
                <div class="password-feedback" id="password-feedback"></div>
            </div>
        `,
        'D': `
            <div class="form-group">
                <input type="text" id="mobile" placeholder="Mobile (10 digits)" required>
                <div class="error-message" id="mobile-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="license" placeholder="License Number (DL01-2023-1234567)" required>
                <div class="error-message" id="license-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="area" placeholder="Service Area (min 3 chars)" required>
                <div class="error-message" id="area-error"></div>
            </div>
            <div class="form-group">
                <div class="password-container">
                    <input type="password" id="password" placeholder="Create Password (8+ chars)" required>
                    <span class="toggle-password" onclick="togglePasswordVisibility('password')">
                        <i class="far fa-eye"></i>
                    </span>
                </div>
                <div class="error-message" id="password-error"></div>
                <div class="password-strength" id="password-strength"></div>
                <div class="password-feedback" id="password-feedback"></div>
            </div>
        `,
        'F': `
            <div class="form-group">
                <input type="text" id="fullName" placeholder="Full Name (min 3 characters)" required>
                <div class="error-message" id="name-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="mobile" placeholder="Mobile (10 digits starting with 6-9)" required>
                <div class="error-message" id="mobile-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="aadhaarLast4" placeholder="Last 4 Aadhaar digits (not 0000/1234)" required>
                <div class="error-message" id="aadhaar-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="village" placeholder="Village / Area (min 3 characters)" required>
                <div class="error-message" id="village-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="landSize" placeholder="Landholding Size (e.g., 3 acres)" required>
                <div class="error-message" id="land-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="produce" placeholder="Type of Produce (e.g., Rice, Tomatoes)" required>
                <div class="error-message" id="produce-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="experience" placeholder="Experience (Years)" required>
                <div class="error-message" id="experience-error"></div>
            </div>
            <div class="form-group">
                <input type="text" id="regId" placeholder="Registration ID (Optional)">
            </div>
            <div class="form-group">
                <div class="password-container">
                    <input type="password" id="password" placeholder="Create Password (8+ chars)" required>
                    <span class="toggle-password" onclick="togglePasswordVisibility('password')">
                        <i class="far fa-eye"></i>
                    </span>
                </div>
                <div class="error-message" id="password-error"></div>
                <div class="password-strength" id="password-strength"></div>
                <div class="password-feedback" id="password-feedback"></div>
            </div>
        `
    };
    
    return fields[role];
}

// ===== PASSWORD VISIBILITY TOGGLE =====
function togglePasswordVisibility(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const toggleIcon = document.querySelector(`#${fieldId} + .toggle-password i`);
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordField.type = 'password';
        toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ===== PASSWORD STRENGTH CHECKER =====
function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthMeter = document.getElementById('password-strength');
    const feedback = document.getElementById('password-feedback');
    
    if (!password) {
        strengthMeter.style.display = 'none';
        if (feedback) feedback.textContent = '';
        return;
    }
    
    strengthMeter.style.display = 'block';
    
    // Calculate strength (0-4)
    let strength = 0;
    let messages = [];
    
    // Length check
    if (password.length >= 8) strength++;
    else messages.push("at least 8 characters");
    
    // Complexity checks
    if (/[A-Z]/.test(password)) strength++;
    else messages.push("one uppercase letter");
    
    if (/[a-z]/.test(password)) strength++;
    else messages.push("one lowercase letter");
    
    if (/\d/.test(password)) strength++;
    else messages.push("one number");
    
    if (/[\W_]/.test(password)) strength++;
    else messages.push("one special character");
    
    // Common password check
    const commonPasswords = ["password", "123456", "qwerty", "nomii123"];
    if (commonPasswords.includes(password.toLowerCase())) {
        strength = 0;
        messages = ["too common - try something more unique"];
    }
    
    // Sequential characters check
    if (/(abc|123|xyz|987)/i.test(password)) {
        strength = Math.max(0, strength - 1);
        messages.push("avoid sequential characters");
    }
    
    // Update UI
    strengthMeter.setAttribute('data-strength', strength);
    
    if (feedback) {
        if (strength < 4 && password.length > 0) {
            feedback.textContent = `Try adding: ${messages.join(", ")}`;
            feedback.style.color = strength < 2 ? '#e74c3c' : strength < 3 ? '#f39c12' : '#f1c40f';
        } else if (password.length > 0) {
            feedback.textContent = 'Strong password!';
            feedback.style.color = '#2ecc71';
        } else {
            feedback.textContent = '';
        }
    }
}

// ===== SIGNUP PROCESS =====
async function processSignup() {
    if (isProcessing) return;
    isProcessing = true;
    
    const formData = collectFormData();
    const validation = validateFormData(formData);
    
    if (validation.isValid) {
        try {
            // Show loading state
            const submitBtn = document.querySelector('#signupSection button');
            submitBtn.classList.add('loading');
            
            // Simulate API call with timeout
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate login ID
            const loginId = generateLoginId(currentRole);
            
            // Show success popup
            showSuccessPopup(loginId);
            
            // In a real app, you would send data to the server here
            console.log('Form data to be sent:', {
                role: currentRole,
                ...formData,
                loginId
            });
            
            // Reset form
            document.getElementById('signupForm').reset();
            
        } catch (error) {
            console.error('Error:', error);
            showValidationErrors({ form: "Connection error. Please try again." });
        } finally {
            isProcessing = false;
            const submitBtn = document.querySelector('#signupSection button');
            submitBtn.classList.remove('loading');
        }
    } else {
        showValidationErrors(validation.errors);
        isProcessing = false;
    }
}

function collectFormData() {
    const data = {};
    const fields = {
        'R': ['mobile', 'aadhaarLast4', 'gst', 'shopName', 'password'],
        'S': ['mobile', 'gst', 'location', 'password'],
        'D': ['mobile', 'license', 'area', 'password'],
        'F': ['fullName', 'mobile', 'aadhaarLast4', 'village', 'landSize', 'produce', 'experience', 'regId', 'password']
    };

    fields[currentRole].forEach(field => {
        const element = document.getElementById(field);
        if (element) data[field] = element.value.trim();
    });

    return data;
}

// ===== VALIDATION =====
function validateFormData(data) {
    const errors = {};
    let isValid = true;

    // Common validations
    if (data.mobile && !/^[6-9]\d{9}$/.test(data.mobile)) {
        errors.mobile = "Invalid mobile (10 digits starting with 6-9)";
        isValid = false;
    }

    if (data.password && !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}/.test(data.password)) {
        errors.password = "Must include uppercase, lowercase, number & special char";
        isValid = false;
    }

    // Role-specific validations
    if (currentRole === 'R') {
        if (!/^\d{4}$/.test(data.aadhaarLast4) || ['0000', '1234'].includes(data.aadhaarLast4)) {
            errors.aadhaar = "Invalid last 4 Aadhaar digits";
            isValid = false;
        }
        if (!/^[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/i.test(data.gst)) {
            errors.gst = "Invalid GST format (e.g., 22ABCDE1234F1Z5)";
            isValid = false;
        }
        if (!data.shopName || data.shopName.length < 3) {
            errors.shop = "Shop name needs 3+ characters";
            isValid = false;
        }
    } 
    else if (currentRole === 'S') {
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(data.gst)) {
            errors.gst = "Invalid GSTIN format";
            isValid = false;
        }
        if (!data.location || data.location.length < 3) {
            errors.location = "Location needs 3+ characters";
            isValid = false;
        }
    } 
    else if (currentRole === 'D') {
        if (!/^[A-Z]{2}\d{2,4}-\d{4}-\d{6,7}$/i.test(data.license)) {
            errors.license = "Invalid license format";
            isValid = false;
        }
        if (!data.area || data.area.length < 3) {
            errors.area = "Area needs 3+ characters";
            isValid = false;
        }
    }
    else if (currentRole === 'F') {
        // Farmer validation
        if (!data.fullName || data.fullName.length < 3 || !/^[a-zA-Z\s]+$/.test(data.fullName)) {
            errors.name = "Full name must be at least 3 alphabetic characters";
            isValid = false;
        }
        if (!/^\d{4}$/.test(data.aadhaarLast4) || ['0000', '1111', '1234'].includes(data.aadhaarLast4)) {
            errors.aadhaar = "Invalid last 4 Aadhaar digits";
            isValid = false;
        }
        if (!data.village || data.village.length < 3) {
            errors.village = "Village/Area must be at least 3 characters";
            isValid = false;
        }
        if (!data.landSize) {
            errors.land = "Landholding size is required";
            isValid = false;
        }
        if (!data.produce) {
            errors.produce = "Produce is required";
            isValid = false;
        }
        if (!data.experience || !/^\d{1,2}$/.test(data.experience) || parseInt(data.experience) < 0 || parseInt(data.experience) > 99) {
            errors.experience = "Experience must be a number between 0 and 99";
            isValid = false;
        }
    }

    return { isValid, errors };
}

function showValidationErrors(errors) {
    // Reset all errors
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    document.querySelectorAll('input').forEach(el => {
        el.classList.remove('error');
    });

    // Show new errors
    for (const [field, message] of Object.entries(errors)) {
        const errorElement = document.getElementById(`${field}-error`);
        const inputElement = document.getElementById(field);
        
        if (errorElement && inputElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            inputElement.classList.add('error');
            if (!inputElement.matches(':focus')) inputElement.focus();
        }
    }
}

// ===== LOGIN ID GENERATION =====
function generateLoginId(role) {
    const now = new Date();
    const timestamp = now.getFullYear() + 
                     String(now.getMonth() + 1).padStart(2, '0') + 
                     String(now.getDate()).padStart(2, '0') + 
                     String(now.getHours()).padStart(2, '0') + 
                     String(now.getMinutes()).padStart(2, '0') + 
                     String(now.getSeconds()).padStart(2, '0');
    return `NOMII-${role}-${timestamp}`;
}

// ===== POPUP MANAGEMENT =====
function showSuccessPopup(loginId) {
    elements.generatedLoginId.textContent = loginId;
    elements.loginIdPopup.style.display = 'flex';
}

function closePopup() {
    elements.loginIdPopup.style.display = 'none';
}

function goToLogin() {
    closePopup();
    showLoginSection();
}

function copyLoginId() {
    const loginId = elements.generatedLoginId.textContent;
    navigator.clipboard.writeText(loginId).then(() => {
        const copyBtn = document.querySelector('.copy-btn i');
        copyBtn.classList.replace('fa-copy', 'fa-check');
        
        setTimeout(() => {
            copyBtn.classList.replace('fa-check', 'fa-copy');
        }, 2000);
    });
}

// ===== LOGIN SYSTEM =====
function showLoginSection() {
    elements.roleSelection.style.display = 'none';
    elements.signupSection.style.display = 'none';
    elements.loginSection.style.display = 'block';
    document.getElementById('loginId').value = '';
    document.getElementById('loginPassword').value = '';
    
    // Clear any errors
    const error = document.querySelector('#loginSection .login-error');
    if (error) error.remove();
}

async function processLogin() {
    if (isProcessing) return;
    
    // Check if account is locked
    const lockoutTime = localStorage.getItem('lockoutTime');
    if (lockoutTime && Date.now() < parseInt(lockoutTime)) {
        const remainingTime = Math.ceil((parseInt(lockoutTime) - Date.now()) / 1000 / 60);
        showLoginError(`Account locked. Try again in ${remainingTime.toFixed(0)} minutes.`);
        return;
    }
    
    isProcessing = true;
    
    const loginId = document.getElementById('loginId').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!loginId || !password) {
        showLoginError('Please enter both fields');
        isProcessing = false;
        return;
    }

    try {
        // Show loading state
        const loginBtn = document.querySelector('#loginSection button');
        loginBtn.classList.add('loading');
        
        // Simulate API call with timeout
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a real app, you would verify credentials with the server
        if (loginId.startsWith('NOMII-') && password.length >= 8) {
            // Successful login
            loginAttempts = 0;
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('lockoutTime');
            
            // Store session
            localStorage.setItem('nomiiSession', JSON.stringify({
                loginId,
                role: loginId.split('-')[1],
                timestamp: Date.now()
            }));
            
            alert('Login successful! Redirecting to dashboard...');
            // window.location.href = '/dashboard';
        } else {
            // Failed login
            loginAttempts++;
            localStorage.setItem('loginAttempts', loginAttempts);
            
            if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                const lockoutTime = Date.now() + LOCKOUT_DURATION;
                localStorage.setItem('lockoutTime', lockoutTime);
                showLoginError(`Too many attempts. Account locked for 5 minutes.`);
            } else {
                showLoginError(`Invalid credentials. ${MAX_LOGIN_ATTEMPTS - loginAttempts} attempts remaining.`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showLoginError('Connection error. Please try again.');
    } finally {
        isProcessing = false;
        const loginBtn = document.querySelector('#loginSection button');
        loginBtn.classList.remove('loading');
    }
}

function showLoginError(message) {
    let errorElement = document.querySelector('#loginSection .login-error');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'login-error';
        errorElement.style.color = 'var(--danger)';
        errorElement.style.marginTop = '10px';
        errorElement.style.textAlign = 'center';
        document.querySelector('#loginSection .form-group:last-child').appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

// ===== SESSION MANAGEMENT =====
function checkSession() {
    const sessionData = localStorage.getItem('nomiiSession');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        // Check if session is still valid (less than 24 hours old)
        if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
            // Redirect to dashboard
            // window.location.href = '/dashboard';
        }
    }
    
    // Check for login attempts
    const attempts = localStorage.getItem('loginAttempts');
    if (attempts) {
        loginAttempts = parseInt(attempts);
    }
}

// ===== UI EFFECTS =====
function createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    // Position the ripple at the click location
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    
    // Remove ripple after animation completes
    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });
}

// ===== EXPORT FUNCTIONS FOR HTML ONCLICK =====
// These are needed because the functions are called directly from HTML
window.showSignupSection = showSignupSection;
window.processSignup = processSignup;
window.togglePasswordVisibility = togglePasswordVisibility;
window.processLogin = processLogin;
window.showLoginSection = showLoginSection;
window.copyLoginId = copyLoginId;
window.goToLogin = goToLogin;