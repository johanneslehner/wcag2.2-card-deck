import { createElement, formatDescription } from './utils.js';

export { formatDescription }; // Re-export if needed elsewhere

export function renderCards(filtered, translations, criteria, translationMap, principles) {
    const container = document.getElementById('cards-overview');
    container.innerHTML = '';
    
    if (filtered.length === 0) {
        container.appendChild(createElement('p', {}, 'No cards match the filter.'));
        return;
    }

    const fragment = document.createDocumentFragment();
    const template = document.getElementById('card-template');

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

        // Create Icon Fragments
        const createIconList = (items, iconMap, labelMap) => {
            const frag = document.createDocumentFragment();
            if (!items) return frag;
            
            items.forEach(item => {
                const key = item.toLowerCase();
                if (iconMap[key]) {
                    const span = createElement('span', { className: 'icon-wrapper' });
                    const icon = createElement('i', {
                        className: 'icon',
                        style: { '--icon-url': `url('../../${iconMap[key]}')` },
                        'aria-label': labelMap[item] || item
                    });
                    span.appendChild(icon);
                    frag.appendChild(span);
                }
            });
            return frag;
        };

        const roleIconsFrag = createIconList(card.responsibilities, roleIcons, translationMap.responsibility);
        const disabilityIconsFrag = createIconList(card.disabilities, disabilityIcons, translationMap.disability);

        // Create Theme Tags Fragment
        const themeTagsFrag = document.createDocumentFragment();
        if (card.themes) {
            card.themes.forEach(theme => {
                const translatedTheme = translationMap.theme[theme] || theme;
                const span = createElement('span', { 
                    className: `card-tag card-tag--${theme.toLowerCase()}` 
                }, [
                    createElement('i', { className: 'icon' }),
                    translatedTheme
                ]);
                themeTagsFrag.appendChild(span);
            });
        }

        // Card Title & Obsolete status
        let cardTitle = c.title || t.title || num;
        const clone = template.content.cloneNode(true);
        const cardEl = clone.querySelector('.card');
        
        cardEl.classList.add(principleClass);
        if (card.obsolete) {
            cardEl.classList.add('card-obsolete');
            // We might want to add class to title, but template structure might vary
        }

        // Fill Text Content
        clone.querySelector('.principle-title').textContent = principleTitle;
        clone.querySelector('.card-level').textContent = level;
        clone.querySelector('.sc-number').textContent = num;
        
        const scNameEl = clone.querySelector('.sc-name');
        scNameEl.textContent = cardTitle;
        if (card.obsolete) scNameEl.classList.add('card-title-obsolete');

        // Fill HTML Content (via Fragments)
        const rolesContainer = clone.querySelector('.sc-responsibilities');
        rolesContainer.innerHTML = '';
        rolesContainer.appendChild(roleIconsFrag);

        const disContainer = clone.querySelector('.sc-disabilities');
        disContainer.innerHTML = '';
        disContainer.appendChild(disabilityIconsFrag);

        // Description (keep as innerHTML since it contains formatting tags from formatDescription)
        clone.querySelector('.card-description').innerHTML = description;

        // See Together
        const seeTogetherContainer = clone.querySelector('.sc-see-together');
        seeTogetherContainer.innerHTML = '';
        if (card.seeTogether && card.seeTogether.length > 0 && translations.strings?.seeTogetherLabel) {
            seeTogetherContainer.appendChild(createElement('h4', {}, `${translations.strings.seeTogetherLabel}:`));
            seeTogetherContainer.appendChild(document.createTextNode(' ' + card.seeTogether.join(', ')));
        }

        // URL
        const urlContainer = clone.querySelector('.sc-url');
        urlContainer.innerHTML = '';
        urlContainer.appendChild(createElement('h4', {}, translations.strings?.successCriteria || 'Success Criteria'));
        if (c.url) {
            urlContainer.appendChild(createElement('a', { href: c.url, target: '_blank' }, c.url));
        }

        // QR Code
        clone.querySelector('.sc-url-qr').setAttribute('style', '--icon-url:url(../../' + qrPath + ')');

        // Themes
        const themesContainer = clone.querySelector('.sc-themes');
        themesContainer.innerHTML = '';
        themesContainer.appendChild(themeTagsFrag);

        fragment.appendChild(clone);
    });

    container.appendChild(fragment);
}
