// Configuration - Can be overridden in HTML pages
window.M4UConfig = window.M4UConfig || {
    // Submission method: 'postMessage', 'email', 'webhook', 'localStorage'
    submissionMethod: 'postMessage',
    
    // Email configuration (when using 'email' method)
    email: {
        to: '',
        subject: 'Worksheet Submission',
        body: 'Please see attached worksheet results.'
    },
    
    // Webhook configuration (when using 'webhook' method)
    webhook: {
        url: '',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    
    // UI customization
    ui: {
        loadingTitle: 'Submitting Results',
        loadingMessage: 'Please wait while we save your work...',
        successTitle: 'Success!',
        successMessage: 'Your work has been submitted successfully.',
        successSubtext: 'You can now close this window.',
        errorTitle: 'Submission Failed',
        errorMessage: 'There was an error submitting your work. Please try again.',
        
        // Theme colors
        primaryColor: '#3498db',
        successColor: '#27ae60',
        errorColor: '#e74c3c'
    },
    
    // Additional data to include in submission
    additionalData: {},
    
    // Callback functions
    onSuccess: null,
    onError: null,
    onBeforeSubmit: null
};

function submitForm() {
    // Allow pre-submission customization
    if (window.M4UConfig.onBeforeSubmit && typeof window.M4UConfig.onBeforeSubmit === 'function') {
        const shouldContinue = window.M4UConfig.onBeforeSubmit();
        if (shouldContinue === false) {
            return false;
        }
    }

    // Get grade data
    const studentGradeCell = document.querySelectorAll('[data-grade-field]')[0];
    var grade = studentGradeCell ? studentGradeCell.getAttribute('data-cval') : '';
    var worksheetCopy = typeof createStaticForm === 'function' ? createStaticForm(true) : '';
    
    const submissionData = {
        grade: grade,
        worksheetCopy: worksheetCopy,
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        ...window.M4UConfig.additionalData
    };

    // Show loading message
    showSubmissionStatus('submitting');
    
    // Handle different submission methods
    switch (window.M4UConfig.submissionMethod) {
        case 'postMessage':
            handlePostMessage(submissionData);
            break;
        case 'email':
            handleEmailSubmission(submissionData);
            break;
        case 'webhook':
            handleWebhookSubmission(submissionData);
            break;
        case 'localStorage':
            handleLocalStorageSubmission(submissionData);
            break;
        default:
            handlePostMessage(submissionData);
    }

    return false;
}

function updateCellFields(event) {
    const studentNameElement = document.querySelectorAll('[data-name-field]')[0];
    const studentIdElement = document.querySelectorAll('[data-id-field]')[0];

    let message = event.data;
    
    // Debug: Log the message to see what we're receiving
    console.log('M4U: Received message:', message);

    if (studentNameElement && message.studentName) {
        studentNameElement.innerHTML = message.studentName;
    }
    
    if (studentIdElement) {
        if (!message.studentId) {
            console.error('M4U: studentId is missing from message data. Expected structure: {studentName: "...", studentId: "..."}');
            // Set a warning message instead of crashing
            studentIdElement.innerHTML = 'MISSING ID';
            studentIdElement.setAttribute('data-cval', 'MISSING_ID');
        } else {
            const numericId = generateNumericId(message.studentId);
            studentIdElement.innerHTML = numericId;
            studentIdElement.setAttribute('data-cval', numericId);
            if (typeof calculate === 'function') {
                calculate(studentIdElement.id);
            }
        }
    }
}

function activityIdFromPathname() {
    var path = window.location.pathname || '';
    var base = path.split('/').pop() || '';
    var dot = base.lastIndexOf('.');
    if (dot > 0) {
        base = base.slice(0, dot);
    }
    return base || null;
}

function parseScoreForArchimedes(grade) {
    if (grade == null || grade === '') {
        return null;
    }
    var s = String(grade).trim();
    if (s === '') {
        return null;
    }
    var pct = s.indexOf('%');
    if (pct !== -1) {
        s = s.slice(0, pct).trim();
    }
    var n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
}

function notifyArchimedesOpener(grade) {
    try {
        var params = new URLSearchParams(window.location.search);
        var assignmentId = params.get('assignment_id');
        var parentOriginRaw = params.get('archimedes_parent_origin');
        if (!window.opener || !assignmentId || !parentOriginRaw) {
            return;
        }
        var targetOrigin = new URL(parentOriginRaw).origin;
        var activityId = params.get('activity_id') || activityIdFromPathname();
        var score = parseScoreForArchimedes(grade);
        window.opener.postMessage(
            {
                type: 'archimedes-assignment-complete',
                assignmentId: assignmentId,
                activityId: activityId,
                score: score
            },
            targetOrigin
        );
    } catch (e) {
        console.warn('Archimedes opener notify failed', e);
    }
}

// Submission handlers for different methods
function handlePostMessage(data) {
    var params = new URLSearchParams(window.location.search);
    if (params.get('assignment_id') && params.get('archimedes_parent_origin')) {
        notifyArchimedesOpener(data.grade);
    } else {
        window.parent.postMessage(data, '*');
    }
    setTimeout(() => {
        showSubmissionStatus('success');
        if (window.M4UConfig.onSuccess) {
            window.M4UConfig.onSuccess(data);
        }
    }, 1000);
}

function handleEmailSubmission(data) {
    const emailBody = `${window.M4UConfig.email.body}\n\nGrade: ${data.grade}\nTimestamp: ${data.timestamp}\nPage: ${data.pageUrl}`;
    const mailtoLink = `mailto:${window.M4UConfig.email.to}?subject=${encodeURIComponent(window.M4UConfig.email.subject)}&body=${encodeURIComponent(emailBody)}`;
    
    setTimeout(() => {
        window.location.href = mailtoLink;
        showSubmissionStatus('success');
        if (window.M4UConfig.onSuccess) {
            window.M4UConfig.onSuccess(data);
        }
    }, 1000);
}

function handleWebhookSubmission(data) {
    fetch(window.M4UConfig.webhook.url, {
        method: window.M4UConfig.webhook.method,
        headers: window.M4UConfig.webhook.headers,
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            showSubmissionStatus('success');
            if (window.M4UConfig.onSuccess) {
                window.M4UConfig.onSuccess(data);
            }
        } else {
            throw new Error('Network response was not ok');
        }
    })
    .catch(error => {
        console.error('Submission error:', error);
        showSubmissionStatus('error');
        if (window.M4UConfig.onError) {
            window.M4UConfig.onError(error, data);
        }
    });
}

function handleLocalStorageSubmission(data) {
    try {
        const submissions = JSON.parse(localStorage.getItem('m4u_submissions') || '[]');
        submissions.push(data);
        localStorage.setItem('m4u_submissions', JSON.stringify(submissions));
        
        setTimeout(() => {
            showSubmissionStatus('success');
            if (window.M4UConfig.onSuccess) {
                window.M4UConfig.onSuccess(data);
            }
        }, 1000);
    } catch (error) {
        console.error('LocalStorage error:', error);
        showSubmissionStatus('error');
        if (window.M4UConfig.onError) {
            window.M4UConfig.onError(error, data);
        }
    }
}

function init() {
    // https://stackoverflow.com/questions/65695171/why-does-javascript-window-postmessage-create-duplicate-messages
    window.addEventListener("message", updateCellFields, false);
}

function showSubmissionStatus(status) {
    // Remove any existing status overlay
    const existingOverlay = document.getElementById('submission-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const config = window.M4UConfig.ui;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'submission-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
    `;

    // Create status container
    const statusContainer = document.createElement('div');
    statusContainer.style.cssText = `
        background: white;
        padding: 30px 40px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
    `;

    if (status === 'submitting') {
        statusContainer.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid ${config.primaryColor}; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">${config.loadingTitle}</h3>
            <p style="color: #7f8c8d; margin: 0;">${config.loadingMessage}</p>
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    } else if (status === 'success') {
        statusContainer.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; background: ${config.successColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <span style="color: white; font-size: 20px; font-weight: bold;">✓</span>
                </div>
            </div>
            <h3 style="color: ${config.successColor}; margin: 0 0 10px 0;">${config.successTitle}</h3>
            <p style="color: #7f8c8d; margin: 0;">${config.successMessage}</p>
            <p style="color: #95a5a6; margin: 10px 0 0 0; font-size: 14px;">${config.successSubtext}</p>
        `;
    } else if (status === 'error') {
        statusContainer.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; background: ${config.errorColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <span style="color: white; font-size: 20px; font-weight: bold;">✕</span>
                </div>
            </div>
            <h3 style="color: ${config.errorColor}; margin: 0 0 10px 0;">${config.errorTitle}</h3>
            <p style="color: #7f8c8d; margin: 0 0 20px 0;">${config.errorMessage}</p>
            <button onclick="document.getElementById('submission-overlay').remove()" style="background: ${config.primaryColor}; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Try Again</button>
        `;
    }

    overlay.appendChild(statusContainer);
    document.body.appendChild(overlay);
}

function generateNumericId(studentId) {
    const hash = hashCode(studentId).toString();
    return hash.substring(hash.length - 5);
}

function hashCode(str) {
    if (!str || typeof str !== 'string') {
        console.error('M4U: hashCode received invalid input:', str);
        return 0;
    }
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

init();