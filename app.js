// Wolcheon Studio - Kids Coloring Web Core Application

// 1. SPA Routing System
function navigateTo(pageId) {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(sec => sec.classList.remove('active'));
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    const targetSection = document.getElementById(`sec-${pageId}`);
    if (targetSection) targetSection.classList.add('active');
    
    const targetBtn = document.getElementById(`btn-${pageId}`);
    if (targetBtn) targetBtn.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 2. Custom Order Form Submission
function submitCustomOrder(event) {
    event.preventDefault();
    const email = document.getElementById('order-email').value;
    const title = document.getElementById('order-title').value;
    const password = document.getElementById('order-password').value;
    
    // Get checked themes
    const themeCheckboxes = document.querySelectorAll('input[name="theme"]:checked');
    const selectedThemes = Array.from(themeCheckboxes).map(cb => cb.value);
    
    if (!email || !title || !password || selectedThemes.length === 0) {
        alert("Please fill out all required fields (Email, Password, Title, and at least one Theme).");
        return;
    }
    
    if (!/^\d{4}$/.test(password)) {
        alert("Please enter exactly a 4-digit password (numbers only).");
        return;
    }
    
    alert(`Order received successfully!\n\nEmail: ${email}\nPassword: [Hidden]\nTitle: ${title}\nThemes: ${selectedThemes.join(', ')}\n\n[System Simulation] 1st draft process started!\nWe will send an email when your sample is ready. Use your 4-digit password in the 'Sample Check' tab to view it.\n\nNote: Printing proceeds automatically if not reviewed within 4 days, or after 2 revisions.`);
}

// 3. Sample Verification Logic
function verifyPassword() {
    const pw = document.getElementById('sample-password').value;
    if (pw === '1234') {
        document.getElementById('verify-login-form').style.display = 'none';
        document.getElementById('verify-preview-area').style.display = 'block';
    } else {
        alert("Incorrect password. Please try '1234' for this demo.");
    }
}



// 4. AdSense Modal & Preview Logic
const adModal = document.getElementById('ad-modal');
const adTimerText = document.getElementById('ad-timer');
const btnDownloadSample = document.getElementById('btn-download-sample');
const previewModal = document.getElementById('preview-modal');
const previewContainer = document.getElementById('preview-images-container');

const sampleImagesDB = {
    'dinosaur': ['assets/sample_dinosaur_1.jpg', 'assets/sample_dinosaur_2.jpg', 'assets/sample_dinosaur_3.jpg'],
    'baking': ['assets/sample_baking_1.jpg', 'assets/sample_baking_2.jpg', 'assets/sample_baking_3.jpg'],
    'job': ['assets/sample_job_1.jpg', 'assets/sample_job_2.jpg', 'assets/sample_job_3.jpg'],
    'eco': ['assets/sample_eco_1.jpg', 'assets/sample_eco_2.jpg', 'assets/sample_eco_3.jpg']
};

let currentPreviewBook = '';
let adCountdown = null;

function watchAdToPreview(bookId) {
    currentPreviewBook = bookId;
    if (adModal) {
        adModal.classList.add('active');
        btnDownloadSample.style.opacity = '0.5';
        btnDownloadSample.style.pointerEvents = 'none';
        btnDownloadSample.textContent = 'Loading Preview...';
        
        let timeLeft = 5;
        adTimerText.textContent = `Please wait ${timeLeft} seconds...`;
        
        // Start countdown
        adCountdown = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                adTimerText.textContent = `Please wait ${timeLeft} seconds...`;
            } else {
                clearInterval(adCountdown);
                adTimerText.textContent = "Preview is ready!";
                btnDownloadSample.style.opacity = '1';
                btnDownloadSample.style.pointerEvents = 'auto';
                btnDownloadSample.textContent = '👀 Show Preview';
                
                // Allow user to click the button to see preview
                btnDownloadSample.onclick = function() {
                    closeAdModal();
                    openPreviewModal(currentPreviewBook);
                };
            }
        }, 1000);
    }
}

function closeAdModal() {
    if (adModal) {
        adModal.classList.remove('active');
        if (adCountdown) clearInterval(adCountdown);
    }
}

function openPreviewModal(bookId) {
    if (!previewModal || !previewContainer) return;
    const images = sampleImagesDB[bookId];
    previewContainer.innerHTML = '';
    
    if (images) {
        images.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.style.width = '30%';
            img.style.minWidth = '200px';
            img.style.border = '2px solid #ddd';
            img.style.borderRadius = '5px';
            img.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            previewContainer.appendChild(img);
        });
    }
    
    previewModal.classList.add('active');
}

function closePreviewModal() {
    if (previewModal) previewModal.classList.remove('active');
}

function printPreviewPages() {
    if (!currentPreviewBook || !sampleImagesDB[currentPreviewBook]) return;
    const images = sampleImagesDB[currentPreviewBook];
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        // Build img tags
        let imgTags = '';
        images.forEach(src => {
            // Check if we are running on file:// or http://
            const absSrc = window.location.protocol === 'file:' ? src : `${window.location.origin}/${src}`;
            imgTags += `<img src="${absSrc}" />`;
        });
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Samples - Wolcheon Studio</title>
                    <style>
                        @page { size: A4 portrait; margin: 0; }
                        body { margin: 0; padding: 0; background: #fff; }
                        img { width: 100%; height: 100vh; object-fit: contain; page-break-after: always; }
                    </style>
                </head>
                <body>
                    ${imgTags}
                </body>
            </html>
        `);
        printWindow.document.close();
        
        // Wait for images to load, then print
        setTimeout(() => {
            printWindow.print();
            setTimeout(() => { printWindow.close(); }, 500);
        }, 1000);
    } else {
        alert("Popup blocked! Please allow popups for this site to print.");
    }
}

// 5. Blog & Policy System
const blogModal = document.getElementById('blog-modal');
const blogBody = document.getElementById('blog-modal-body');

const blogDB = {
    1: {
        title: "3 Cognitive Benefits of Coloring for Ages 4-8",
        content: `
            <div class="blog-post">
                <h2>3 Cognitive Benefits of Coloring for Ages 4-8</h2>
                <p class="blog-meta">Date: May 31, 2026 | Author: Education Team</p>
                <div class="blog-body">
                    <p>Coloring inside the lines is not just an entertaining way to pass the time. In early childhood, gripping a crayon and filling a boundary is a highly rated brain development tool.</p>
                    <h4>1. Enhancing Fine Motor Skills</h4>
                    <p>Children between 4 and 8 are still refining the small muscles in their fingers. Holding a pencil with the correct pressure and controlling it to stay within a boundary powerfully stimulates the motor cortex of the brain, improving handwriting skills.</p>
                    <h4>2. Building Focus and Problem Solving</h4>
                    <p>Completing a complex section provides a dopamine-driven sense of achievement. Children plan which colors go where, training their ability to maintain focus over an extended period.</p>
                    <h4>3. Spatial Awareness and Pattern Recognition</h4>
                    <p>Understanding boundaries—like a dinosaur's shell versus the background—develops spatial logic. It harmonizes visual data processing with logical thinking, leading to balanced IQ growth.</p>
                </div>
            </div>
        `
    },
    2: {
        title: "Bonding Through Art: Coloring with Parents",
        content: `
            <div class="blog-post">
                <h2>Bonding Through Art: Coloring with Parents</h2>
                <p class="blog-meta">Date: May 31, 2026 | Author: Art Therapist Team</p>
                <div class="blog-body">
                    <p>With an increase in screen time, children are increasingly vulnerable to attention deficit disorders. Physical, tactile coloring books serve as a perfect mindfulness therapy.</p>
                    <h4>1. A Medium for Conversation</h4>
                    <p>Coloring together provides a psychological safe space for children who struggle to express themselves verbally. Simple questions like "Why did you choose yellow here?" spark natural, stress-free interactions.</p>
                    <h4>2. Mindfulness and Anti-Stress</h4>
                    <p>The repetitive strokes of coloring activate the parasympathetic nervous system, lowering heart rates and calming anxiety. It acts as an emotional outlet for young minds.</p>
                </div>
            </div>
        `
    }
};

const policyDB = {
    privacy: {
        content: `
            <div class="blog-post">
                <h2>Privacy Policy</h2>
                <p class="blog-meta">Last Updated: May 31, 2026 | Applicable to wolcheonstudio.app</p>
                <div class="blog-body">
                    <p>Wolcheon Studio ("we" or "us") respects your privacy. This policy outlines how we handle data when you visit wolcheonstudio.app.</p>
                    <h4>1. Data Collection</h4>
                    <p>We may collect non-personally identifiable information such as IP addresses, browser types, and cookies to improve your experience and deliver targeted advertisements through Google AdSense.</p>
                    <h4>2. Use of Information</h4>
                    <p>Data is used exclusively to provide downloading services, process custom orders, and display relevant advertising. Images uploaded to the AI Studio are processed locally in your browser or immediately deleted; they are not stored on our servers.</p>
                    <h4>3. Cookies and Google AdSense</h4>
                    <p>Our website uses Google AdSense, which uses cookies to serve ads based on a user's prior visits. Users may opt out of personalized advertising by visiting Google's Ads Settings.</p>
                    <h4>4. Contact</h4>
                    <p>For inquiries regarding this policy, please contact the domain administrator via Porkbun.com Whois data.</p>
                </div>
            </div>
        `
    },
    tos: {
        content: `
            <div class="blog-post">
                <h2>Terms of Service</h2>
                <p class="blog-meta">Last Updated: May 31, 2026 | Applicable to wolcheonstudio.app</p>
                <div class="blog-body">
                    <p>By accessing wolcheonstudio.app, you agree to these terms, governed by standard web hosting policies provided by our registrar, Porkbun.com.</p>
                    <h4>1. License to Use</h4>
                    <p>Free sample PDFs are provided for personal, non-commercial use only (e.g., home or classroom). Mass reproduction, redistribution, or commercial sale of our line art without permission is strictly prohibited.</p>
                    <h4>2. Custom Orders & AI Studio</h4>
                    <p>When using the custom order form, you are responsible for the content you submit. Wolcheon Studio reserves the right to reject orders that violate copyright or contain inappropriate content.</p>
                    <h4>3. Limitation of Liability</h4>
                    <p>We provide the service "as is" without any warranties. We are not liable for any damages arising from the use of our digital downloads or physical books purchased through third parties (e.g., Amazon).</p>
                </div>
            </div>
        `
    }
};

function openBlog(id) {
    if (blogModal && blogBody && blogDB[id]) {
        blogBody.innerHTML = blogDB[id].content;
        blogModal.classList.add('active');
    }
}

function showPolicy(type) {
    if (blogModal && blogBody && policyDB[type]) {
        blogBody.innerHTML = policyDB[type].content;
        blogModal.classList.add('active');
    }
}

function closeBlogModal() {
    if (blogModal) blogModal.classList.remove('active');
}

window.onclick = function(event) {
    if (event.target === blogModal) closeBlogModal();
    if (event.target === adModal) closeAdModal();
    if (event.target === previewModal) closePreviewModal();
}
