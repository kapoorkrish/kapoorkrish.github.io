// ─── CUSTOM CURSOR ───
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
});

function animateRing() {
  ringX += (mouseX - ringX) * 0.14;
  ringY += (mouseY - ringY) * 0.14;
  ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
  requestAnimationFrame(animateRing);
}
animateRing();

// ─── ACTIVE NAV ON SCROLL ───
const sections = [...document.querySelectorAll('section[id]')];
const navItems = document.querySelectorAll('.nav-item');

const NAV_OFFSET = 120;

function setActiveNav(id) {
  navItems.forEach(item => {
    item.classList.toggle(
      'active',
      item.getAttribute('href') === `#${id}`
    );
  });
}

function updateActiveSection() {
  let currentSection = sections[0]?.id;

  // If near bottom of page, force last section active
  const nearBottom =
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 50;

  if (nearBottom) {
    currentSection = sections[sections.length - 1]?.id;
    setActiveNav(currentSection);
    return;
  }

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();

    if (rect.top <= NAV_OFFSET) {
      currentSection = section.id;
    }
  });

  setActiveNav(currentSection);
}

// Initial state
updateActiveSection();

let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateActiveSection();
      ticking = false;
    });

    ticking = true;
  }
});

// ─── FADE-IN ON SCROLL ───
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${i * 0.04}s`;
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => fadeObserver.observe(el));

// ─── STAGGER HELPER ───
function staggerElements(selector) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.5s ease ${0.08 + i * 0.08}s, transform 0.5s ease ${0.08 + i * 0.08}s, background 0.3s, border-color 0.3s`;
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 100);
  });
}

// ─── THUMBNAIL HELPER ───
// For experience and projects:
//   If `image` is a non-empty string, renders an <img> tag.
//   Otherwise falls back to the `icon` unicode character (projects)
//   or initials derived from the company name (experience).
function makeThumb(image, fallback) {
  if (image && image.trim() !== '') {
    return `<img src="${image}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />`;
  }
  return `<span style="font-family:'DM Serif Display',serif;font-size:1.6rem;color:var(--text-dim);">${fallback}</span>`;
}

function companyInitials(company) {
  return company.split(/\s+/).filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join('') || '—';
}

// ─── POPULATE DATA FROM JSON ───
async function loadData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    populateExperiences(data.experiences);
    populateProjects(data.projects);
    populateSkills(data.skills);
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ─── EXPERIENCE ───
// Groups entries by `type` ("work" | "research"), renders each group
// under a subtle divider label. Within each group, items are shown in
// the order they appear in data.json.
function populateExperiences(experiences) {
  const container = document.getElementById('experience-container');
  if (!container) return;

  const typeConfig = {
    work:     { label: 'Industry' },
    research: { label: 'Research' }
  };

  // Preserve order: collect unique types in first-seen order
  const seenTypes = [];
  experiences.forEach(exp => {
    const t = exp.type || 'work';
    if (!seenTypes.includes(t)) seenTypes.push(t);
  });

  let html = '';

  seenTypes.forEach(type => {
    const group = experiences.filter(e => (e.type || 'work') === type);
    const config = typeConfig[type] || { label: type };

    html += `<div class="exp-group-label">${config.label}</div>`;

    html += group.map(exp => {
      const arrowSVG = `<svg class="exp-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>`;
      const titleRow = exp.link
        ? `<div class="exp-title-row"><div class="exp-title">${exp.title}</div>${arrowSVG}</div>`
        : `<div class="exp-title">${exp.title}</div>`;

      const expHTML = `
        <div class="exp-item${exp.link ? ' exp-item--link' : ''}">
          <div class="exp-meta">
            <div class="exp-period">${exp.period}</div>
            ${exp.image ? `<div class="exp-thumb"><img src="${exp.image}" alt="" /></div>` : ''}
          </div>
          <div>
            ${titleRow}
            <div class="exp-company">${exp.company}</div>
            <p class="exp-desc">${exp.description}</p>
            <div class="tags">
              ${exp.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
        </div>`;
      
      if (exp.link) {
        return `<a href="${exp.link}" class="exp-link">${expHTML}</a>`;
      }
      return expHTML;
    }).join('');
  });

  container.innerHTML = html;
  staggerElements('#experience-container .exp-item');
}

// ─── PROJECTS ───
// `image` field: path or URL to a thumbnail image (e.g. "images/catchbot.png").
// Leave as "" to use the `icon` unicode character as placeholder instead.
function populateProjects(projects) {
  const container = document.getElementById('projects-container');
  if (!container) return;

  container.innerHTML = projects.map(project => `
    <a href="${project.link}" target="_blank" rel="noopener" class="project-card">
      <div class="project-thumb">
        ${makeThumb(project.image, project.icon || '✦')}
      </div>
      <div class="project-content">
        ${project.period ? `<div class="project-period">${project.period}</div>` : ''}
        <div class="project-header">
          <div class="project-title">${project.title}</div>
          <div class="project-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
          </div>
        </div>
        <p class="project-desc">${project.description}</p>
        <div class="tags">
          ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    </a>
  `).join('');

  staggerElements('#projects-container .project-card');
}

// ─── SKILLS ───
function populateSkills(skills) {
  const container = document.getElementById('skills-container');
  if (!container) return;

  container.innerHTML = skills.map(skillGroup => `
    <div class="skill-group">
      <div class="skill-group-title">${skillGroup.category}</div>
      <ul class="skill-list">
        ${skillGroup.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  staggerElements('#skills-container .skill-group');
}

// Load data when DOM is ready
document.addEventListener('DOMContentLoaded', loadData);