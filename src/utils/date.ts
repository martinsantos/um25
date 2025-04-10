export function formatDate(date: string | Date): string {
    // Si la fecha es un string, convertirla a Date
    const dateObj = typeof date === 'string' ? parseSpanishDate(date) : date;
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(dateObj);
}

function parseSpanishDate(dateStr: string): Date {
    const months: { [key: string]: number } = {
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
        'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
        'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };

    const parts = dateStr.toLowerCase().split(' ');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = months[parts[1].toLowerCase()];
        const year = parseInt(parts[2]);
        
        if (!isNaN(day) && month !== undefined && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    
    // Si no se puede parsear, devolver la fecha actual
    return new Date();
}
