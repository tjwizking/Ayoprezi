document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('presentation');
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progress-bar');
    const currentSlideEl = document.getElementById('current-slide');
    const totalSlidesEl = document.getElementById('total-slides');
    const navDotsContainer = document.getElementById('nav-dots');
    
    const totalSlides = slides.length;
    totalSlidesEl.textContent = totalSlides.toString().padStart(2, '0');

    // Create Navigation Dots
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('nav-dot');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        if(index === 0) dot.classList.add('active');
        
        dot.addEventListener('click', () => {
            slides[index].scrollIntoView({ behavior: 'smooth' });
        });
        
        navDotsContainer.appendChild(dot);
    });

    const navDots = document.querySelectorAll('.nav-dot');

    // Setup Animation Delays
    document.querySelectorAll('.animate-in').forEach(el => {
        const delay = el.getAttribute('data-delay');
        if (delay) {
            el.style.transitionDelay = `${delay}ms`;
        }
    });

    // Intersection Observer for Animations and Progress
    const observerOptions = {
        root: container,
        threshold: 0.5 // Trigger when slide is 50% visible
    };

    const slideObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const slide = entry.target;
                const slideIndex = Array.from(slides).indexOf(slide);
                
                // Update counter
                currentSlideEl.textContent = (slideIndex + 1).toString().padStart(2, '0');
                
                // Update progress bar
                const progress = ((slideIndex) / (totalSlides - 1)) * 100;
                progressBar.style.width = `${progress}%`;
                
                // Update nav dots
                navDots.forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === slideIndex);
                });

                // Trigger animations
                const animateElements = slide.querySelectorAll('.animate-in');
                animateElements.forEach(el => {
                    // Small delay to ensure smooth transition after scrolling
                    setTimeout(() => {
                        el.classList.add('visible');
                    }, 50);
                });
            } else {
                // Remove animation classes when out of view to allow re-animating
                const slide = entry.target;
                const animateElements = slide.querySelectorAll('.animate-in');
                animateElements.forEach(el => {
                    el.classList.remove('visible');
                });
            }
        });
    }, observerOptions);

    slides.forEach(slide => {
        slideObserver.observe(slide);
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            container.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
        }
    });

    // Image Upload & LocalStorage Persistence Logic
    document.querySelectorAll('.media-container, .profile-photo').forEach((container, index) => {
        // Exclude the profile photo on the first slide if it already has the logo Hardcoded, unless they want to change it
        // Actually, let's allow changing everything
        
        const uploadId = 'momentum_slide_media_' + index;
        
        // Check localStorage for existing image
        const savedImage = localStorage.getItem(uploadId);
        if (savedImage) {
            let img = container.querySelector('img');
            let video = container.querySelector('video');
            let hint = container.querySelector('.media-hint');
            
            if (video) video.remove();
            if (hint) hint.style.display = 'none';

            if (!img) {
                img = document.createElement('img');
                container.appendChild(img);
            }
            img.src = savedImage;
            img.style.objectFit = 'cover';
            img.style.padding = '0';
            img.style.filter = 'none';
        }

        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        container.appendChild(fileInput);

        // Make container clickable
        container.style.cursor = 'pointer';
        container.title = 'Single click to enlarge, Double click to upload new image';
        
        let clickTimer = null;
        
        container.addEventListener('click', (e) => {
            if(e.target.tagName === 'VIDEO') return;
            
            if (e.detail === 1) {
                clickTimer = setTimeout(() => {
                    const currentImg = container.querySelector('img');
                    if (currentImg && currentImg.src) {
                        lightboxImg.src = currentImg.src;
                        lightbox.style.display = 'flex';
                        setTimeout(() => { lightbox.style.opacity = '1'; }, 10);
                    }
                }, 200);
            }
        });

        container.addEventListener('dblclick', (e) => {
            if(e.target.tagName === 'VIDEO') return;
            clearTimeout(clickTimer);
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Str = event.target.result;
                    // Save to local storage
                    try {
                        localStorage.setItem(uploadId, base64Str);
                    } catch (err) {
                        console.warn("Local storage quota exceeded. The image is too large to persist.");
                        alert("Image is too large to save to browser storage. It will show for this session only, use a compressed image (< 1MB) for permanent storage.");
                    }
                    
                    // Display image
                    let img = container.querySelector('img');
                    let hint = container.querySelector('.media-hint');
                    if (hint) hint.style.display = 'none';

                    if (!img) {
                        img = document.createElement('img');
                        container.appendChild(img);
                    }
                    img.src = base64Str;
                    img.style.objectFit = 'cover';
                    img.style.padding = '0';
                    img.style.filter = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Lightbox Global Element Setup
    const lightbox = document.createElement('div');
    lightbox.style.position = 'fixed';
    lightbox.style.top = '0';
    lightbox.style.left = '0';
    lightbox.style.width = '100vw';
    lightbox.style.height = '100vh';
    lightbox.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    lightbox.style.zIndex = '9999';
    lightbox.style.display = 'none';
    lightbox.style.alignItems = 'center';
    lightbox.style.justifyContent = 'center';
    lightbox.style.cursor = 'zoom-out';
    lightbox.style.opacity = '0';
    lightbox.style.transition = 'opacity 0.2s ease';

    const lightboxImg = document.createElement('img');
    lightboxImg.style.maxWidth = '90%';
    lightboxImg.style.maxHeight = '90%';
    lightboxImg.style.objectFit = 'contain';
    lightboxImg.style.borderRadius = '8px';
    lightboxImg.style.boxShadow = '0 0 60px rgba(0,0,0,0.8)';
    lightbox.appendChild(lightboxImg);
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', () => {
        lightbox.style.opacity = '0';
        setTimeout(() => { lightbox.style.display = 'none'; }, 200);
    });

    // Text Editing & LocalStorage Persistence Logic
    const editableSelectors = [
        '.hero-title__line', '.section-title', '.overline', '.body-text',
        '.hero-meta__value', '.hero-meta__label', '.quote-block__text',
        '.learning-item__text', '.stat-card__number', '.stat-card__label',
        '.closing-meta__label', '.timeline-marker__year', '.timeline-marker__chapter',
        '.closing-title__line', '.hero-tag__text', '.timeline-event__label', 
        '.timeline-event__year', '.org-logo span'
    ];

    document.querySelectorAll(editableSelectors.join(', ')).forEach((el, index) => {
        // Create a unique ID for each text element based on its DOM position class + index
        const textId = 'momentum_slide_text_' + index;

        // Load existing text if previously edited and saved
        const savedText = localStorage.getItem(textId);
        if (savedText !== null) {
            el.innerHTML = savedText;
        }

        // Enable editing
        el.setAttribute('contenteditable', 'true');
        el.style.outline = 'none'; // removing ugly focus outlines

        // Add subtle interaction hints
        el.addEventListener('mouseenter', () => {
            el.dataset.originalCursor = el.style.cursor;
            el.style.cursor = 'text';
            el.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.1)';
            el.style.borderRadius = '4px';
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.cursor = el.dataset.originalCursor || '';
            el.style.boxShadow = 'none';
        });

        // Save real-time as the user types
        el.addEventListener('input', () => {
             try {
                localStorage.setItem(textId, el.innerHTML);
             } catch(err) {
                 console.warn("Storage error when saving text:", err);
             }
        });
        
        // Prevent enter from making annoying nested divs if possible, just allow raw breaks
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.execCommand('insertLineBreak');
                e.preventDefault();
            }
            // Stop page navigation arrows if editing text
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                e.stopPropagation();
            }
        });
    });

    // ============================================
    // GITHUB PUBLISH "SECRET ADMIN" MODE
    // ============================================
    const publishBtn = document.createElement('button');
    publishBtn.innerHTML = '☁️ Publish to GitHub';
    publishBtn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 2rem;
        z-index: 10000;
        background: var(--accent);
        color: var(--bg-primary);
        font-family: var(--font-body);
        font-weight: 700;
        padding: 10px 16px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        opacity: 0.3;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    
    publishBtn.addEventListener('mouseenter', () => { publishBtn.style.opacity = '1'; publishBtn.style.transform = 'scale(1.05)'; });
    publishBtn.addEventListener('mouseleave', () => { publishBtn.style.opacity = '0.3'; publishBtn.style.transform = 'scale(1)'; });
    document.body.appendChild(publishBtn);

    publishBtn.addEventListener('click', async () => {
        const token = prompt('Enter your GitHub Personal Access Token (PAT) to publish these changes directly to tjwizking/Ayoprezi:', '');
        if (!token) return;

        publishBtn.innerHTML = '🔄 Publishing...';
        publishBtn.style.pointerEvents = 'none';

        try {
            const repoInfo = { owner: 'tjwizking', repo: 'Ayoprezi' };
            const headers = {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            };

            // 1. Fetch current index.html from github
            let htmlRes = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/index.html`, { headers });
            if (!htmlRes.ok) throw new Error("Could not fetch index.html from GitHub");
            const htmlData = await htmlRes.json();
            
            // Note: Data is base64 encoded. Some bytes might be multibyte utf8, so use a proper decode.
            const decodedHtml = decodeURIComponent(escape(atob(htmlData.content)));
            const parser = new DOMParser();
            const doc = parser.parseFromString(decodedHtml, "text/html");

            // Define mapping selectors for text extraction identically to local app
            const textSelectors = [
                '.hero-title__line', '.section-title', '.overline', '.body-text',
                '.hero-meta__value', '.hero-meta__label', '.quote-block__text',
                '.learning-item__text', '.stat-card__number', '.stat-card__label',
                '.closing-meta__label', '.timeline-marker__year', '.timeline-marker__chapter',
                '.closing-title__line', '.hero-tag__text', '.timeline-event__label', 
                '.timeline-event__year', '.org-logo span'
            ];
            const htmlTextElements = doc.querySelectorAll(textSelectors.join(', '));
            const htmlMediaContainers = doc.querySelectorAll('.media-container, .profile-photo');

            // 2. Iterate through localStorage and apply edits
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                // TEXT EDITS
                if (key.includes('momentum_slide_text_')) {
                    const idx = parseInt(key.split('_').pop());
                    if (htmlTextElements[idx]) {
                        htmlTextElements[idx].innerHTML = localStorage.getItem(key);
                    }
                }
                
                // IMAGE EDITS
                if (key.includes('momentum_slide_media_')) {
                    const idx = parseInt(key.split('_').pop());
                    const b64Data = localStorage.getItem(key);
                    const container = htmlMediaContainers[idx];
                    
                    if (container && b64Data.startsWith('data:image')) {
                        // Extract base64 pure string
                        const base64Pure = b64Data.split(',')[1];
                        const extMatch = b64Data.match(/data:image\/(.*);/);
                        const ext = extMatch ? extMatch[1] : 'jpg';
                        const filename = `upload_${Date.now()}_img${idx}.${ext}`;

                        // Upload the new image file to GitHub
                        publishBtn.innerHTML = `🔄 Uploading image ${idx}...`;
                        const imgUploadRes = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/public/${filename}`, {
                            method: 'PUT',
                            headers,
                            body: JSON.stringify({
                                message: `Auto-uploading image for container ${idx}`,
                                content: base64Pure,
                                branch: 'main'
                            })
                        });

                        if (imgUploadRes.ok) {
                            // Find or create img tag in the detached DOM container
                            let imgTag = container.querySelector('img');
                            let videoTag = container.querySelector('video');
                            let hintTag = container.querySelector('.media-hint');

                            if (videoTag) videoTag.remove();
                            if (hintTag) hintTag.style.display = 'none';

                            if (!imgTag) {
                                imgTag = doc.createElement('img');
                                container.appendChild(imgTag);
                            }
                            // Inject public path for HTML
                            imgTag.setAttribute('src', `./public/${filename}`);
                            imgTag.style.objectFit = 'cover';
                            imgTag.style.padding = '0';
                            imgTag.style.filter = 'none';
                        }
                    }
                }
            }

            // 3. Serialize HTML back to string
            publishBtn.innerHTML = '🔄 Committing HTML...';
            const newHtmlContent = doc.documentElement.outerHTML;
            // Note: need to safely encode to base64
            const encodedHtml = btoa(unescape(encodeURIComponent("<!DOCTYPE html>\n" + newHtmlContent)));

            // 4. Update the index.html on GitHub
            const htmlUpdateRes = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/index.html`, {
                 method: 'PUT',
                 headers,
                 body: JSON.stringify({
                     message: "Published live page edits to repo via Admin UI",
                     content: encodedHtml,
                     sha: htmlData.sha,
                     branch: 'main'
                 })
            });

            if (!htmlUpdateRes.ok) throw new Error("Committing HTML failed!");

            // 5. Clean up localStorage to prevent re-submitting stalely 
            localStorage.clear();
            publishBtn.innerHTML = '✅ Published!';
            setTimeout(() => { publishBtn.innerHTML = '☁️ Publish to GitHub'; }, 3000);

        } catch (error) {
            console.error(error);
            alert("Error publishing to GitHub: " + error.message);
            publishBtn.innerHTML = '⚠️ Error. Try again.';
        } finally {
            publishBtn.style.pointerEvents = 'auto';
        }
    });

});
