export function formatDescription(desc) {
    if (!desc) return '';
    desc = escapeHtml(desc);
    desc = desc.replace(/\*\*_(.*?)_\*\*/g, '<strong><em>$1</em></strong>');
    desc = desc.replace(/_\*\*(.*?)\*\*_ /g, '<strong><em>$1</em></strong>');
    desc = desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    desc = desc.replace(/_(.*?)_/g, '<em>$1</em>');
    const lines = desc.split('\n');
    let inList = false;
    let html = '';
    lines.forEach(line => {
        if (line.startsWith('* ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${line.substring(2)}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (line.trim() !== '') {
                html += `<p>${line}</p>`;
            }
        }
    });
    if (inList) html += '</ul>';
    return html;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function renderCards(filtered, translations, criteria, translationMap, principles) {
    const container = document.getElementById('cards-overview');
    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = '<p>No cards match the filter.</p>';
        return;
    }
    filtered.forEach(([num, card]) => {
        const t = translations[num] || {};
        const c = criteria[num] || {};
        const lang = document.getElementById('language').value;
        const qrPath = `localization/${lang}/qr/${num.replace(/\./g, '-')}.svg`;

        const principleNum = num.split('.')[0];
        const principleObj = principles[principleNum] || {};
        const principleTitle = principleObj.title || translationMap.principle || '';
        const principleName = {
            '1': 'perceivable',
            '2': 'operable', 
            '3': 'understandable',
            '4': 'robust'
        }[principleNum] || '';
        const principleClass = `card--${principleName}`;

        const level = card.level ? (translationMap.level[card.level]?.short || card.level) : '';

        const description = formatDescription(c.description || t.description || '');


        const roleIcons = {
            'design': 'assets/icons/pencil-ruler.svg',
            'development': 'assets/icons/xml.svg',
            'content': 'assets/icons/file-document.svg'
        };

        const disabilityIcons = {
            'visual': 'assets/icons/eye.svg',
            'auditory': 'assets/icons/ear-hearing.svg',
            'cognitive': 'assets/icons/head-cog.svg',
            'physical': 'assets/icons/human.svg',
            'speech': 'assets/icons/account-voice.svg'
        };

        const roleIconsHtml = card.responsibilities ? card.responsibilities.map(role =>
            roleIcons[role.toLowerCase()] ?
            `<span class="icon-wrapper"><i class="icon" role="img" style="--icon-url:url('${roleIcons[role.toLowerCase()]}')" aria-label="${translationMap.responsibility[role] || role}"></i></span>` :
            ''
        ).join('') : '';

        const disabilityIconsHtml = card.disabilities ? card.disabilities.map(dis =>
            disabilityIcons[dis.toLowerCase()] ?
            `<span class="icon-wrapper"><i class="icon" role="img" style="--icon-url:url('${disabilityIcons[dis.toLowerCase()]}')" aria-label="${translationMap.disability[dis] || dis}"></i></span>` :
            ''
        ).join('') : '';

        const icons = `<span class="card-icons">
            ${roleIconsHtml}${disabilityIconsHtml}
        </span>`;
        
        const themeTags = card.themes ? card.themes.map(theme => {
            const translatedTheme = translationMap.theme[theme] || theme;
            return `<span class="card-tag card-tag--${theme.toLowerCase()}">
            <i class="icon"></i>
            ${translatedTheme}
            </span>`;
        }).join('') : '';

        let seeTogetherHtml = '';
        if (card.seeTogether && card.seeTogether.length > 0 && translations.strings?.seeTogetherLabel) {
            seeTogetherHtml = `<h4>${translations.strings.seeTogetherLabel}:</h4> ${card.seeTogether.join(', ')}`;
        }

        let cardTitle = c.title || t.title || num;
        if (card.obsolete) {
            // Classes applied to cloned elements below
        }

        // Clone card template
        const template = document.getElementById('card-template');
        const clone = template.content.cloneNode(true);

        // Populate template with data
        const cardEl = clone.querySelector('.card');
        cardEl.classList.add(principleClass);
        if (card.obsolete) {
            cardEl.classList.add('card-obsolete');
            clone.querySelector('.card__title')?.classList.add('card-title-obsolete');
        }

        clone.querySelector('.principle-title').textContent = principleTitle;
        clone.querySelector('.card-level').textContent = level;
        
        clone.querySelector('.sc-number').textContent = num;
        clone.querySelector('.sc-name').textContent = cardTitle;
        clone.querySelector('.sc-responsibilities').innerHTML = roleIconsHtml;
        clone.querySelector('.sc-disabilities').innerHTML = disabilityIconsHtml;

        clone.querySelector('.card-description').innerHTML = description;
        
        clone.querySelector('.sc-see-together').innerHTML = seeTogetherHtml;
        clone.querySelector('.sc-url').innerHTML = `
           <h4>${translations.strings?.successCriteria || 'Success Criteria'}</h4>
           ${c.url ? `<a href="${c.url}" target="_blank">${c.url}</a>` : ''}
       `;
        const qrEl = clone.querySelector('.sc-url-qr');
        if (qrEl) {
            qrEl.classList.add('card-qr');
            qrEl.setAttribute('style', `--icon-url:url('${qrPath}')`);
        }
        clone.querySelector('.sc-themes').innerHTML = themeTags;

        // Append card to container
        container.appendChild(clone);
    });
}