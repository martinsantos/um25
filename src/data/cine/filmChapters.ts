/** Captions follow the native movie clock; they explain the installation in view. */
export type FilmChapter = { at: number; text: string };
export const FILM_CHAPTERS: Record<string, FilmChapter[]> = {
  'software-system-v5': [
    { at: 0, text: 'La aplicación empieza por el trabajo de las personas.' },
    { at: 6.5, text: 'Cada acción tiene reglas, permisos y un resultado.' },
    { at: 11.2, text: 'Interfaz, reglas, datos e infraestructura forman un sistema.' },
    { at: 17.4, text: 'La información conserva su origen y su historial.' },
    { at: 21, text: 'El resultado vuelve al equipo para continuar el trabajo.' },
  ],
  'network-project-v2': [
    { at: 0, text: 'Del puesto de trabajo al núcleo de la red.' },
    { at: 5.6, text: 'Distribución identificada, con acceso para mantenerla.' },
    { at: 9, text: 'El switch conecta los equipos con la infraestructura.' },
    { at: 13.8, text: 'La radio extiende el acceso dentro del mismo sistema.' },
    { at: 20.5, text: 'Una infraestructura conectada de punta a punta.' },
  ],
  'security-project-v2': [
    { at: 0, text: 'Acceso, imagen y registro comparten el contexto.' },
    { at: 5.7, text: 'La óptica y el sensor permiten observar el lugar.' },
    { at: 12.4, text: 'El grabador conserva la secuencia y su evidencia.' },
    { at: 18.5, text: 'La supervisión relaciona imagen, evento y respuesta.' },
    { at: 22, text: 'Un sistema que se puede operar y verificar.' },
  ],
  'telecom-project-v2': [
    { at: 0, text: 'Cada sitio se conecta según su distancia y su entorno.' },
    { at: 5.5, text: 'El radioenlace requiere alineación y línea de vista.' },
    { at: 12.5, text: 'La fibra ofrece otra alternativa de transporte.' },
    { at: 15.2, text: 'Terminaciones, empalmes y reserva quedan protegidos.' },
    { at: 21, text: 'Elegimos el medio según lo que necesita la operación.' },
  ],
  'fire-project-v2': [
    { at: 0, text: 'La detección se organiza alrededor de los espacios.' },
    { at: 5.4, text: 'Cada detector integra sensado e identificación.' },
    { at: 9.7, text: 'El circuito vincula los dispositivos con la central.' },
    { at: 13.5, text: 'La central supervisa señales, avisos y respaldo.' },
    { at: 21, text: 'La instalación se entrega identificada y verificada.' },
  ],
  'power-project-v2': [
    { at: 0, text: 'La continuidad parte de conocer las cargas críticas.' },
    { at: 5.2, text: 'Entrada y protecciones se coordinan con la instalación.' },
    { at: 11.5, text: 'La UPS integra control, baterías y mantenimiento.' },
    { at: 18.4, text: 'Cada salida alimenta equipos identificados.' },
    { at: 22, text: 'Una cadena de alimentación que se puede comprobar.' },
  ],
  'support-project-v2': [
    { at: 0, text: 'Cada incidente empieza con un equipo y su contexto.' },
    { at: 5.5, text: 'La señal se convierte en un caso con evidencia.' },
    { at: 10.5, text: 'El diagnóstico sigue las dependencias del sistema.' },
    { at: 17.8, text: 'La recuperación se verifica y queda registrada.' },
    { at: 22, text: 'El historial conserva lo aprendido para el próximo caso.' },
  ],
  'consulting-project-v2': [
    { at: 0, text: 'Primero entendemos la operación y lo que la sostiene.' },
    { at: 5.5, text: 'Revelamos cómo se relacionan red, energía y servicios.' },
    { at: 13.2, text: 'Cada hallazgo vincula evidencia, impacto y alternativas.' },
    { at: 18, text: 'El plan ordena etapas, responsables y verificación.' },
    { at: 22, text: 'La complejidad se transforma en decisiones ejecutables.' },
  ],
};
